// 本部の会員名簿を正として、守成MAPS（miyakonojo.shusei-maps.com）の掲載内容を取り込む。
//   npm run import:shusei-maps -- <守成MAPSのCSV> <会員名簿CSV（本部・Shift_JIS）>
//
// 書き出すもの
//   src/data/shuseiMaps.js  名簿にいる会員の掲載だけ（店名・写真・営業時間・定休日・電話・紹介文・座標）
//   src/data/roster.js      ポータルにいるのに名簿にいない会員の氏名（MAP から外す）
//
// 名簿そのもの（メール・携帯・紹介者など）はリポジトリに入れない。氏名の突き合わせにだけ使う。
// 座標は check-locations と同じく国土地理院の住所検索で引く。番地まで無い住所はピンを立てない。
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const [mapsCsv, rosterCsv] = process.argv.slice(2)
if (!mapsCsv || !rosterCsv) {
  console.error('使い方: npm run import:shusei-maps -- <守成MAPSのCSV> <会員名簿CSV>')
  process.exit(1)
}

const PORTAL_URL = 'https://sewaninja-portal.a-sasahala.workers.dev'
const MAPS_ORIGIN = 'https://miyakonojo.shusei-maps.com'
const PHOTO_ORIGIN = 'https://storage.shusei-id.com'
const out = (name) => fileURLToPath(new URL(`../src/data/${name}`, import.meta.url))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── CSV ────────────────────────────────────────
const parseCsv = (text) => {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') cell += text[++i]
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') row.push(cell), (cell = '')
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell), rows.push(row), (row = []), (cell = '')
    } else cell += c
  }
  if (cell || row.length) row.push(cell), rows.push(row)
  const [head, ...body] = rows
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}

// ── 氏名・社名の突き合わせ ───────────────────────
const norm = (s = '') => s.normalize('NFKC').replace(/[\s　]+/g, '')
// 名簿は Shift_JIS に無い漢字（髙・﨑など）が「_」になっているので1文字の何でもとして扱う
const sameName = (rosterName, name) => {
  const a = norm(rosterName)
  const b = norm(name)
  if (a === b) return true
  return a.includes('_') && a.length === b.length && [...a].every((c, i) => c === '_' || c === b[i])
}
const companyKey = (s = '') =>
  norm(s)
    .replace(/[⑭⑰]|株式会社|有限会社|合同会社|\(株\)|\(有\)/g, '')
    .toLowerCase()
const sameCompany = (a, b) => {
  const x = companyKey(a)
  const y = companyKey(b)
  return Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x))
}
// 名簿と守成ID で漢字が違う人（平井 亜砂美／亜沙美 など）はフリガナで同じ人と見る
const sameKana = (roster, member) =>
  roster.kana && norm(roster.kana) === norm(member.kana) && [...norm(roster.name)].some((c) => norm(member.name).includes(c))

const roster = parseCsv(new TextDecoder('shift_jis').decode(readFileSync(rosterCsv)))
  .filter((r) => r['氏名'] && !r['退会日'])
  .map((r) => ({ name: r['氏名'].replace(/　/g, ' '), kana: r['氏名カナ'], company: r['会社名'] }))
console.log(`名簿: ${roster.length}名`)

const portal = await (await fetch(`${PORTAL_URL}/api/member-map`)).json()
const inRoster = (m) => roster.find((r) => sameName(r.name, m.name) || sameKana(r, m))
const notInRoster = portal.members.filter((m) => !inRoster(m)).map((m) => m.name)
console.log(`ポータル: ${portal.members.length}名（名簿にいない ${notInRoster.length}名を外す）`)

// 守成MAPS の掲載者 → 会員（表記はポータルに合わせる。MAP はポータルの氏名で引くため）
const ownerOf = (accountName) => {
  const r =
    roster.find((x) => sameName(x.name, accountName)) ??
    roster.find((x) => portal.members.some((m) => sameName(m.name, accountName) && sameKana(x, m))) ??
    roster.find((x) => sameCompany(x.company, accountName))
  if (!r) return null
  const m = portal.members.find((p) => sameName(r.name, p.name) || sameKana(r, p))
  return m?.name ?? r.name
}

// ── 住所 → 座標（国土地理院） ─────────────────────
const toKey = (address) =>
  address
    .normalize('NFKC')
    .replace(/^〒?\d{3}-?\d{4}\s*/, '')
    .replace(/\s+/g, ' ')
    .replace(/^(.+?\D)(\d+)(?:街区|番地|番|丁目|-)(\d+).*$/, '$1$2-$3')
const geocode = async (address) => {
  if (!/\d/.test(address.normalize('NFKC'))) return null
  const res = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(toKey(address))}`)
  const hit = (await res.json())[0]
  if (!hit) return null
  // 「鹿児島県鹿児島市」「宮崎県北諸県郡三股町」のように市町村の中心にしか当たらなかったら立てない
  const rest = hit.properties.title.replace(/^.+?[都道府県]/, '').replace(/^.+?郡/, '')
  if (/^[^市区町村]+[市区町村]$/.test(rest)) return null
  const [lng, lat] = hit.geometry.coordinates
  return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) }
}

// ── 取り込み ────────────────────────────────────
const text = (s) => (s ?? '').replace(/\r\n?/g, '\n').trim()
const listings = []
const skipped = []
for (const row of parseCsv(readFileSync(mapsCsv, 'utf8'))) {
  const id = row['box href'].split('/stores/')[1]
  if (!id) continue
  const store = await (await fetch(`${MAPS_ORIGIN}/api/stores/${id}`, { headers: { accept: 'application/json' } })).json()
  const d = store.data ?? {}
  const owner = ownerOf(d.account_name || row.name)
  if (!owner) {
    skipped.push(`${store.name}（${d.account_name || row.name}）`)
    continue
  }
  const address = [d.address, d.address2].filter(Boolean).join(' ').replace(/^〒?\d{3}-?\d{4}\s*/, '')
  listings.push({
    id,
    name: store.name.trim(),
    owner,
    categories: (store.categories ?? []).map((c) => c.name),
    address,
    ...((await geocode(address)) ?? {}),
    hours: text(d.hour),
    closed: text(d.off),
    phone: /\d/.test(d.phone ?? '') ? d.phone.trim() : '',
    copy: text(d.copy),
    description: text(d.description),
    photo: d.image ? `${PHOTO_ORIGIN}/${d.image}` : row['photo src'],
    url: `${MAPS_ORIGIN}/stores/${id}`,
  })
  await sleep(300)
}

const today = new Date().toISOString().slice(0, 10)
writeFileSync(
  out('shuseiMaps.js'),
  `// 守成MAPS（${MAPS_ORIGIN}）の掲載のうち、本部の会員名簿にいる会員のもの。
// scripts/import-shusei-maps.mjs で生成（${today}）。手で直さず、守成MAPS 側を直して取り込み直す。
export const SHUSEI_MAPS_IMPORTED = '${today}'

export const shuseiListings = ${JSON.stringify(listings, null, 2)}
`,
)
writeFileSync(
  out('roster.js'),
  `// 本部の会員名簿（${rosterCsv.split('/').pop()}）を正とする。
// セワニンジャ・ポータル（守成ID）に「有効」で残っているが名簿にいない会員。MAP からは外す。
// 退会を確認できたら守成ID 側で「無効」にすれば、ここに書かなくても出なくなる。
// scripts/import-shusei-maps.mjs で生成（${today}）。
export const notInRoster = ${JSON.stringify(notInRoster, null, 2)}
`,
)

console.log(`\n守成MAPS: ${listings.length}件を取り込み（座標なし ${listings.filter((l) => !l.latitude).length}件）`)
if (skipped.length) console.log(`名簿にいない掲載者のため外した ${skipped.length}件:\n  ${skipped.join('\n  ')}`)

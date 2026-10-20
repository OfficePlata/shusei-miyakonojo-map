// セワニンジャ・ポータルの会員（都城会場の有効会員）を正として、守成MAPS（miyakonojo.shusei-maps.com）の掲載を取り込む。
//   npm run import:shusei-maps -- <守成MAPSのCSV>
//
// 書き出すもの
//   src/data/shuseiMaps.js  ポータルにいる会員の掲載だけ（店名・写真・営業時間・定休日・電話・紹介文・座標）
// 守成MAPS に載っていてもポータルにいない人の掲載は取り込まない（退会者など）。
// 座標は check-locations と同じく国土地理院の住所検索で引く。番地まで無い住所はピンを立てない。
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const [mapsCsv] = process.argv.slice(2)
if (!mapsCsv) {
  console.error('使い方: npm run import:shusei-maps -- <守成MAPSのCSV>')
  process.exit(1)
}

const PORTAL_URL = 'https://sewaninja-portal.a-sasahala.workers.dev'
const MAPS_ORIGIN = 'https://miyakonojo.shusei-maps.com'
const PHOTO_ORIGIN = 'https://storage.shusei-id.com'
const out = (name) => fileURLToPath(new URL(`../src/data/${name}`, import.meta.url))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 守成MAPS に載っていても、この MAP には出さない掲載（守成MAPS の店舗 ID）
const SKIP = {
  'e2ec34f8-f308-4807-b9ef-bc8c30a13902': '武者武者（志布志市）— 笹原の判断で掲載しない（2026-10-21）',
}

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
// 異体字（髙・﨑など）は守成MAPS 側で常用字になっていることがあるのでそろえる
const VARIANTS = { 髙: '高', 﨑: '崎', 德: '徳', 濵: '浜', 邉: '辺', 邊: '辺' }
const norm = (s = '') =>
  s
    .normalize('NFKC')
    .replace(/[\s\u3000]+/g, '')
    .replace(/[髙﨑德濵邉邊]/g, (c) => VARIANTS[c])
const companyKey = (s = '') =>
  norm(s)
    .replace(/株式会社|有限会社|合同会社|\(株\)|\(有\)/g, '')
    .toLowerCase()
const sameCompany = (a, b) => {
  const x = companyKey(a)
  const y = companyKey(b)
  return Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x))
}

const portal = await (await fetch(`${PORTAL_URL}/api/member-map`)).json()
console.log(`ポータル: ${portal.members.length}名`)

// 守成MAPS の掲載者 → ポータルの会員（氏名、なければ社名で引く。社名で掲載している人がいるため）
const ownerOf = (accountName) =>
  (portal.members.find((m) => norm(m.name) === norm(accountName)) ??
    portal.members.find((m) => sameCompany(m.company, accountName)))?.name ?? null

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
  if (SKIP[id]) {
    skipped.push(SKIP[id])
    continue
  }
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
  `// 守成MAPS（${MAPS_ORIGIN}）の掲載のうち、セワニンジャ・ポータルにいる会員のもの。
// scripts/import-shusei-maps.mjs で生成（${today}）。手で直さず、守成MAPS 側を直して取り込み直す。
export const SHUSEI_MAPS_IMPORTED = '${today}'

export const shuseiListings = ${JSON.stringify(listings, null, 2)}
`,
)

console.log(`\n守成MAPS: ${listings.length}件を取り込み（座標なし ${listings.filter((l) => !l.latitude).length}件）`)
if (skipped.length) console.log(`外した ${skipped.length}件（ポータルにいない掲載者・掲載しない指定）:\n  ${skipped.join('\n  ')}`)

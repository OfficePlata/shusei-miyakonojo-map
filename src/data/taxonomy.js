// 店舗データから「用途」「シーン」「エリア」を自動で割り当てる。
// 元データは restaurants.js（写真・紹介文つき）、守成MAPS の飲食・ナイトの掲載（shuseiMaps.js）、
// ポータルの三部会店舗（掲載 ON・三部会判定つき）。
// restaurants.js の各店舗に `scenes: ['settai']` のように書けば、自動判定に追加できる。
import { restaurants } from './restaurants.js'
import { shuseiListings } from './shuseiMaps.js'
import { notInRoster } from './roster.js'

// 掲載対象の会場（宮崎県・都城会場の在籍会員のみ）
export const TARGET_VENUE = '都城'

// ── 用途（業態の大分類） ─────────────────────────
export const CATEGORIES = [
  { id: 'food', label: '食事・居酒屋', emoji: '🍖', color: '#DD6420' },
  { id: 'bar', label: 'バー', emoji: '🍸', color: '#1A1A1A' },
  { id: 'snack', label: 'スナック・クラブ', emoji: '🎤', color: '#F5A623' },
]

const GENRE_TO_CATEGORY = {
  居酒屋: 'food',
  焼肉: 'food',
  ダイナー: 'food',
  ダイニング: 'food',
  'ラーメン・居酒屋': 'food',
  'ラーメン・辛麺': 'food',
  ラーメン: 'food',
  カレー: 'food',
  カフェ: 'food',
  バー: 'bar',
  ダーツバー: 'bar',
  カフェバー: 'bar',
  スナック: 'snack',
  ラウンジ: 'snack',
  高級クラブ: 'snack',
  ナイトスポット: 'snack',
}

// ── シーン ─────────────────────────────────────
export const SCENES = [
  // 三部会：赤バッジ以上の会員のお店で、店主がその日の例会に出席。牟田町周辺・都城駅周辺（判定はポータル）
  { id: 'sanbukai', label: '三部会', sub: '赤バッジ以上・本日例会参加', emoji: '🏮' },
  { id: 'late', label: '深夜営業', sub: '深夜1時以降も営業', emoji: '🌙' },
  { id: 'nijikai', label: '二次会', sub: '例会後の一杯', emoji: '🍻' },
  { id: 'dinner', label: '食事・一次会', sub: '18時台から入れる', emoji: '🍽️' },
  { id: 'enkai', label: '宴会・団体', sub: '28名以上OK', emoji: '🎉' },
  { id: 'settai', label: '接待', sub: '個室・高単価', emoji: '🤝' },
  { id: 'small', label: '少人数', sub: '1〜2名でサク飲み', emoji: '🥃' },
  { id: 'lunch', label: 'ランチ', sub: '昼営業あり', emoji: '☀️' },
]

// ── 価格帯（ディナー下限で判定） ───────────────────
export const PRICE_BANDS = [
  { id: 'low', label: '〜¥2,999', test: (min) => min < 3000 },
  { id: 'mid', label: '¥3,000〜¥4,999', test: (min) => min >= 3000 && min < 5000 },
  { id: 'high', label: '¥5,000〜', test: (min) => min >= 5000 },
]

// "18:00～24:00" "20:00～深夜" "21:00～05:00" "11:00~15:00,18:00~3:00" → 時間（小数）
const parseHours = (raw = '') => {
  // 「（LO22:30）」「（推定）」などの補足は除き、「18時〜3時」「20時30分」も 18:00 の形にそろえる
  const text = raw
    .normalize('NFKC')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/(\d{1,2})時(?:(\d{1,2})分)?/g, (_, h, m = '0') => `${h}:${m.padStart(2, '0')}`)
  const times = [...text.matchAll(/(\d{1,2})[:：](\d{2})/g)].map(
    ([, h, m]) => Number(h) + Number(m) / 60,
  )
  if (times.length === 0) return { open: null, close: null, lunch: false }
  const open = times[0]
  // 「21時〜」のように開店時刻しか無ければ閉店は不明
  let close = /深夜|last/i.test(text) ? 26 : times.length > 1 ? times[times.length - 1] : null
  // 翌朝までの営業（05:00 など）は 24 を足す
  if (close !== null && close <= 12 && close < open) close += 24
  const lunch = open < 15
  return { open, close, lunch }
}

const parseMinPrice = (text = '') => {
  const m = text.replace(/[,，]/g, '').match(/(\d{3,6})/)
  return m ? Number(m[1]) : null
}

// 住所から町名を取り出す（都城市の繁華街はまとめる）
const AREA_GROUPS = { 牟田町: '牟田町・中町（繁華街）', 中町: '牟田町・中町（繁華街）' }
const parseArea = (address = '') => {
  const m = address.match(/(?:都城市|北諸県郡)([^\d０-９\s]+?町)/)
  if (!m) return 'その他'
  return AREA_GROUPS[m[1]] ?? m[1]
}

const categoryOf = (r, hours) => {
  if (GENRE_TO_CATEGORY[r.genre]) return GENRE_TO_CATEGORY[r.genre]
  // 業態不明の店は開店時刻で判定（20時以降オープンは夜のお店）
  return hours.open !== null && hours.open >= 20 ? 'snack' : 'food'
}

const scenesOf = (r, category, hours, minPrice) => {
  const s = new Set(r.scenes ?? [])
  const features = `${r.specialFeatures ?? ''}${r.description ?? ''}`
  if (r.sanbukai) s.add('sanbukai')
  if (hours.close !== null && hours.close >= 25) s.add('late')
  if (category !== 'food' || /居酒屋|ダイナー/.test(r.genre)) s.add('nijikai')
  if (category === 'food' && hours.open !== null && hours.open <= 18.5) s.add('dinner')
  if (r.capacity >= 28 || /団体|宴会/.test(features)) s.add('enkai')
  if ((minPrice ?? 0) >= 5000 || /個室|接待/.test(features)) s.add('settai')
  if (category === 'bar' || r.capacity <= 15) s.add('small')
  if (hours.lunch) s.add('lunch')
  return [...s]
}

const venueOf = (r) => r.venue ?? (r.memberType?.includes(TARGET_VENUE) ? TARGET_VENUE : null)

// 店名の突き合わせ用（全角半角・空白・大小を無視）
const nameKey = (name = '') =>
  name
    .normalize('NFKC')
    .replace(/[\s・'’、,]/g, '')
    .toLowerCase()

// 住所の「町名＋番地」（「21街区7号」「21番7」も「21-7」に揃える）
const addressKey = (address = '') => {
  const m = address
    .normalize('NFKC')
    .match(/([^\s\d]+?町)\s*(\d+)(?:街区|番地|番|丁目|-)\s*(\d+)/)
  return m ? `${m[1]}${m[2]}-${m[3]}` : null
}

// 店名が一致・片方が片方を含む（4文字以上）
const sameStoreName = (x, y) => {
  const a = nameKey(x)
  const b = nameKey(y)
  return a === b || (Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a)))
}

// 同じ店か。店名が一致・片方が片方を含む（4文字以上）、または番地が1対1で一致
const makeMatcher = (statics, shops) => {
  const count = (list, key) => list.filter((x) => addressKey(x.address) === key).length
  return (r, shop) => {
    if (sameStoreName(r.name, shop.name)) return true
    const key = addressKey(r.address)
    return key !== null && key === addressKey(shop.address) && count(statics, key) === 1 && count(shops, key) === 1
  }
}

// 守成MAPS の掲載のうち、お店モードに載せるもの（飲食・ナイト）
const FOOD_CATEGORIES = ['ランチ', 'ディナー', 'カフェ', 'Bar・スナック・Club']
const isFoodListing = (l) => l.categories.some((c) => FOOD_CATEGORIES.includes(c))

const genreOfListing = (l) => {
  if (l.categories.includes('Bar・スナック・Club')) {
    if (/cafe\s*&\s*bar/i.test(l.name)) return 'カフェバー'
    return /bar/i.test(l.name) ? 'バー' : 'スナック'
  }
  if (/ラーメン|辛麺/.test(l.name)) return 'ラーメン'
  if (/焼肉/.test(l.name)) return '焼肉'
  if (/カレー/.test(l.name)) return 'カレー'
  if (/ダイナー/.test(l.name)) return 'ダイナー'
  if (/居酒屋|居食/.test(l.name)) return '居酒屋'
  if (/cafe|カフェ/i.test(l.name) || l.categories.every((c) => c === 'カフェ')) return 'カフェ'
  return 'ダイニング'
}

// 守成MAPS の掲載 → restaurants.js と同じ形
const fromListing = (l) => ({
  id: `m-${l.id}`,
  name: l.name,
  genre: genreOfListing(l),
  description: l.copy || l.description,
  address: l.address,
  latitude: l.latitude,
  longitude: l.longitude,
  phoneNumber: l.phone,
  openingHours: l.hours,
  closingDay: l.closed,
  imageUrl: l.photo,
  shuseiUrl: l.url,
  owner: l.owner,
  scenes: [...(l.categories.includes('24時以降も営業') ? ['late'] : [])],
  venue: TARGET_VENUE,
})

// 店名が同じ店に守成MAPS の掲載を重ねる。写真・営業時間・定休日・電話は店主が手入れしている守成MAPS を優先し、
// 紹介文・価格帯・席数は restaurants.js を残す。番地だけでは重ねない（同じビルに別の店が入っているため）
const withListings = (statics) => {
  const listings = shuseiListings.filter(isFoodListing)
  const used = new Set()
  const merged = statics.map((r) => {
    const l = listings.find((x) => !used.has(x) && sameStoreName(r.name, x.name))
    if (!l) return r
    used.add(l)
    return {
      ...r,
      imageUrl: l.photo || r.imageUrl,
      openingHours: l.hours || r.openingHours,
      closingDay: l.closed || r.closingDay,
      phoneNumber: l.phone || r.phoneNumber,
      description: r.description || l.copy,
      shuseiUrl: l.url,
    }
  })
  return [...merged, ...listings.filter((l) => !used.has(l)).map(fromListing)]
}

// ポータルの三部会店舗 → restaurants.js と同じ形
const fromPortalShop = (shop, i) => ({
  id: `p${i + 1}`,
  name: shop.name,
  genre: shop.category,
  description: shop.note,
  address: shop.address,
  latitude: shop.lat,
  longitude: shop.lng,
  phoneNumber: shop.phone,
  openingHours: shop.hours,
  closingDay: shop.closed,
  priceRangeDinner: shop.budget,
  capacity: shop.seats,
  venue: TARGET_VENUE,
})

const enrich = (r) => {
  const hours = parseHours(r.openingHours)
  const minPrice = parseMinPrice(r.priceRangeDinner)
  const category = categoryOf(r, hours)
  return {
    ...r,
    category,
    area: parseArea(r.address),
    scenes: scenesOf(r, category, hours, minPrice),
    minPrice,
    priceBand: PRICE_BANDS.find((b) => minPrice !== null && b.test(minPrice))?.id ?? null,
    closeHour: hours.close,
    hasImage: Boolean(r.imageUrl) && !r.imageUrl.startsWith('/api/placeholder'),
  }
}

/**
 * 表示する店の一覧。portalShops（ポータルの三部会店舗）が来ていれば、
 * 同名の店は restaurants.js の写真・紹介文を残したまま三部会判定と店主を足し、無い店は追加する。
 * 名簿にいない店主の店は出さない（ポータルの店は呼び出し側で店主の ID を見て外す）。
 */
const rosterOut = new Set(notInRoster.map((n) => n.replace(/[\s\u3000]+/g, '')))
export const buildStores = (portalShops = []) => {
  const statics = withListings(
    restaurants.filter((r) => venueOf(r) === TARGET_VENUE && !rosterOut.has((r.owner ?? '').replace(/[\s\u3000]+/g, ''))),
  )
  const same = makeMatcher(statics, portalShops)
  const used = new Set()
  const merged = statics.map((r) => {
    const shop = portalShops.find((s) => !used.has(s) && same(r, s))
    if (!shop) return r
    used.add(shop)
    // 住所・座標・電話は世話人が手入れしているポータルを優先し、写真と紹介文は restaurants.js を残す
    return {
      ...r,
      sanbukai: shop.sanbukai,
      ownerIds: shop.ownerIds,
      address: shop.address || r.address,
      phoneNumber: shop.phone || r.phoneNumber,
      latitude: shop.lat ?? r.latitude,
      longitude: shop.lng ?? r.longitude,
    }
  })
  const added = portalShops
    .filter((s) => !used.has(s))
    .map((s, i) => ({ ...fromPortalShop(s, i), sanbukai: s.sanbukai, ownerIds: s.ownerIds }))
  return [...merged, ...added]
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .map(enrich)
}

export const areasOf = (stores) =>
  [...new Set(stores.map((s) => s.area))].sort(
    (a, b) => stores.filter((s) => s.area === b).length - stores.filter((s) => s.area === a).length,
  )

export const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))
export const storeMarker = (store) => categoryById[store.category]
export const sceneById = Object.fromEntries(SCENES.map((s) => [s.id, s]))

export const formatClose = (h) => {
  if (h === null || h === undefined) return null
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${hh}:${String(mm).padStart(2, '0')}`
}

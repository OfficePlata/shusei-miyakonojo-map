// 店舗データから「用途」「シーン」「エリア」を自動で割り当てる。
// restaurants.js の各店舗に `scenes: ['settai']` のように書けば、自動判定に追加できる。
import { restaurants } from './restaurants.js'

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
  バー: 'bar',
  ダーツバー: 'bar',
  カフェバー: 'bar',
  スナック: 'snack',
  高級クラブ: 'snack',
  ナイトスポット: 'snack',
}

// ── シーン ─────────────────────────────────────
export const SCENES = [
  { id: 'sanbukai', label: '三部会', sub: '深夜1時以降も営業', emoji: '🌙' },
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
  // 「（LO22:30）」「（推定）」などの補足は除く
  const text = raw.replace(/[（(][^）)]*[）)]/g, '')
  const times = [...text.matchAll(/(\d{1,2})[:：](\d{2})/g)].map(
    ([, h, m]) => Number(h) + Number(m) / 60,
  )
  if (times.length === 0) return { open: null, close: null, lunch: false }
  const open = times[0]
  let close = /深夜/.test(text) ? 26 : times[times.length - 1]
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
  if (hours.close !== null && hours.close >= 25) s.add('sanbukai')
  if (category !== 'food' || /居酒屋|ダイナー/.test(r.genre)) s.add('nijikai')
  if (category === 'food' && hours.open !== null && hours.open <= 18.5) s.add('dinner')
  if (r.capacity >= 28 || /団体|宴会/.test(features)) s.add('enkai')
  if ((minPrice ?? 0) >= 5000 || /個室|接待/.test(features)) s.add('settai')
  if (category === 'bar' || r.capacity <= 15) s.add('small')
  if (hours.lunch) s.add('lunch')
  return [...s]
}

const venueOf = (r) => r.venue ?? (r.memberType?.includes(TARGET_VENUE) ? TARGET_VENUE : null)

export const stores = restaurants
  .filter((r) => venueOf(r) === TARGET_VENUE)
  .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
  .map((r) => {
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
  })

export const AREAS = [...new Set(stores.map((s) => s.area))].sort(
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

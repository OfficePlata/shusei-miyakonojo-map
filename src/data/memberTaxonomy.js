// 会員を「こんな時に相談できる人」で引けるように分類する。
// members.js の業種・事業内容・services から自動判定し、飲食店オーナーは店舗と紐づける。
import { members } from './members.js'
import { stores, TARGET_VENUE } from './taxonomy.js'

// ── 困りごと・用途（会員検索の入口） ──────────────────
export const NEEDS = [
  { id: 'home', label: '住まい・建物', sub: '建築・内装・害虫', emoji: '🏠', color: '#DD6420', pattern: /建築|内装|リフォーム|壁紙|土木|害虫|水廻り|工事/ },
  { id: 'cleanup', label: '片付け・買取', sub: '不用品・遺品整理', emoji: '📦', color: '#F5A623', pattern: /リサイクル|買取|片付け|遺品|不用品/ },
  { id: 'beauty', label: '美容・健康', sub: '整体・脱毛・ジム', emoji: '💆', color: '#C8161D', pattern: /脱毛|美容|整体|リラク|フィットネス|トレーニング|ジム|サロン/ },
  { id: 'car', label: '車', sub: 'コーティング・洗車', emoji: '🚗', color: '#1A1A1A', pattern: /車|コーティング|洗車/ },
  { id: 'promo', label: '集客・PR・撮影', sub: 'Web・デザイン・空撮', emoji: '📣', color: '#DD6420', pattern: /WEB|Web|広告|ドローン|空撮|デザイン|集客/ },
  { id: 'biz', label: '経営・お金', sub: '創業・融資・相談', emoji: '💼', color: '#1A1A1A', pattern: /コンサル|融資|創業|税|保険|カウンセ/ },
  { id: 'gift', label: '贈り物・記念品', sub: '名入れ・花・作品', emoji: '🎁', color: '#F5A623', pattern: /彫刻|レジン|名入れ|花|クラフト|きくらげ/ },
  { id: 'event', label: 'イベント・余興', sub: '出演・アウトドア', emoji: '🎶', color: '#C8161D', pattern: /イベント|音楽|三味線|キャンプ|余興/ },
  { id: 'learn', label: '習い事・教室', sub: '講座・レッスン', emoji: '📚', color: '#DD6420', pattern: /教室|講師|講座|レッスン|パーソナル/ },
  { id: 'food', label: '会食・飲み会', sub: '飲食店・ナイト', emoji: '🍻', color: '#F5A623', pattern: /飲食|居酒屋|焼肉|BAR|バー|スナック|ナイト|辛麺|クラブ|ダイニング|ダイナー|ラーメン/ },
]

export const needById = Object.fromEntries(NEEDS.map((n) => [n.id, n]))

const normalizeName = (name = '') => name.replace(/[\s\u3000]+/g, '')

// 店舗オーナーで members.js に載っていない人は、店舗情報から会員カードを作る
const storeOwners = new Map()
for (const s of stores) {
  if (!s.owner) continue
  const key = normalizeName(s.owner)
  if (!storeOwners.has(key)) storeOwners.set(key, [])
  storeOwners.get(key).push(s)
}

const listed = new Set(members.map((m) => normalizeName(m.name)))
const ownerOnlyMembers = [...storeOwners.entries()]
  .filter(([key]) => !listed.has(key))
  .map(([, own]) => ({
    id: `store-${own[0].id}`,
    name: own[0].owner,
    company: own[0].name,
    industry: own[0].genre,
    description: own[0].description,
    services: own[0].specialFeatures ? own[0].specialFeatures.split(/[、,]/).map((t) => t.trim()).filter(Boolean) : [],
    venue: TARGET_VENUE,
    fromStore: true,
  }))

export const directory = [...members, ...ownerOnlyMembers]
  .filter((m) => m.venue === TARGET_VENUE)
  .map((m) => {
    const linkedStores = storeOwners.get(normalizeName(m.name)) ?? []
    const text = [m.industry, m.description, ...(m.services ?? [])].join(' ')
    // 店舗情報から作った会員は店の説明文（「内装」など）で誤判定しないよう飲食だけにする
    const needs = m.fromStore ? [] : NEEDS.filter((n) => n.pattern.test(text)).map((n) => n.id)
    if (linkedStores.length && !needs.includes('food')) needs.push('food')
    const located = Number.isFinite(m.latitude) && Number.isFinite(m.longitude)
    const anchor = located ? m : linkedStores[0]
    const primaryNeed = needs[0] ?? 'biz'
    return {
      ...m,
      needs,
      primaryNeed,
      linkedStores,
      latitude: anchor?.latitude,
      longitude: anchor?.longitude,
      address: m.address ?? anchor?.address,
      phoneNumber: m.phoneNumber ?? linkedStores[0]?.phoneNumber,
      hasLocation: Boolean(anchor),
    }
  })

export const memberMarker = (member) => needById[member.primaryNeed]

export const memberById = Object.fromEntries(directory.map((m) => [m.id, m]))

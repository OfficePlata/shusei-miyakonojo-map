// 会員を「こんな時に相談できる人」で引けるように分類する。
// 会員の元データはポータル（sewaninja-portal の /api/member-map）。読めないときだけ members.js を使う。
// 業種（ポータルの19区分）を第一に、事業内容のキーワードでも当てる。1人が複数の困りごとに出てよい。
import { members as fallbackMembers } from './members.js'
import { TARGET_VENUE } from './taxonomy.js'

// ── 困りごと・用途（会員検索の入口） ──────────────────
export const NEEDS = [
  { id: 'home', label: '住まい・建物', sub: '建築・リフォーム・不動産', emoji: '🏠', color: '#DD6420', industries: ['建設・工事', '不動産'], pattern: /建築|内装|リフォーム|壁紙|土木|害虫|水廻り|工事|塗装|不動産|住宅|外構|電気/ },
  { id: 'living', label: '片付け・暮らし', sub: '清掃・買取・生活サービス', emoji: '🧹', color: '#F5A623', industries: ['清掃・生活サービス'], pattern: /リサイクル|買取|片付け|遺品|不用品|清掃|クリーニング|葬|仏壇/ },
  { id: 'beauty', label: '美容・健康', sub: '整体・美容室・ジム', emoji: '💆', color: '#C8161D', industries: ['美容・健康'], pattern: /脱毛|美容|整体|リラク|フィットネス|トレーニング|ジム|サロン|エステ|ネイル|ヘア|整骨|鍼/ },
  { id: 'care', label: '医療・介護・保育', sub: '病院・福祉・子育て', emoji: '🩺', color: '#1A1A1A', industries: ['医療・福祉・保育'], pattern: /医療|介護|福祉|保育|看護|歯科|クリニック|薬局/ },
  { id: 'car', label: '車・運送', sub: '整備・コーティング・物流', emoji: '🚗', color: '#1A1A1A', industries: ['自動車', '運輸・物流'], pattern: /自動車|車検|コーティング|洗車|整備|板金|運送|物流|配送|タクシー|運転代行/ },
  { id: 'promo', label: '集客・Web・撮影', sub: 'HP・広告・デザイン・印刷', emoji: '📣', color: '#DD6420', industries: ['IT・Web・デザイン・印刷', '映像・写真・イベント'], pattern: /WEB|Web|ウェブ|ホームページ|広告|ドローン|空撮|デザイン|集客|印刷|撮影|映像|SNS|システム/ },
  { id: 'biz', label: '経営・お金・法律', sub: '税理士・保険・コンサル', emoji: '💼', color: '#1A1A1A', industries: ['士業・コンサル', '金融・保険'], pattern: /コンサル|融資|創業|税理|保険|カウンセ|会計|社労士|行政書士|司法書士|弁護士|補助金|銀行|証券/ },
  { id: 'gift', label: '贈り物・お取り寄せ', sub: '名入れ・花・食品・特産', emoji: '🎁', color: '#F5A623', industries: ['小売・販売', '食品製造・卸', '農業・畜産', '製造・加工'], pattern: /彫刻|レジン|名入れ|生花|フラワー|クラフト|きくらげ|ギフト|焼酎|菓子|茶/ },
  { id: 'event', label: 'イベント・余興', sub: '出演・司会・アウトドア', emoji: '🎶', color: '#C8161D', industries: ['映像・写真・イベント'], pattern: /イベント|音楽|三味線|キャンプ|余興|司会|ライブ|演奏|ブライダル|婚活/ },
  { id: 'learn', label: '習い事・教室', sub: '塾・講座・レッスン', emoji: '📚', color: '#DD6420', industries: ['教育・スクール'], pattern: /教室|講師|講座|レッスン|スクール|学習塾|セミナー|研修/ },
  { id: 'food', label: '会食・飲み会', sub: '飲食店・ナイト', emoji: '🍻', color: '#F5A623', industries: ['飲食', 'ナイト'], pattern: /飲食|居酒屋|焼肉|BAR|バー|スナック|辛麺|ダイニング|ダイナー|ラーメン|ラウンジ/ },
]

export const needById = Object.fromEntries(NEEDS.map((n) => [n.id, n]))
export const memberMarker = (member) => needById[member.primaryNeed]

// 会員分類（バッジ）。赤以上が三部会の対象
export const BADGES = {
  ゴールド: { label: 'ゴールド', color: '#F5A623' },
  赤: { label: '赤バッジ', color: '#C8161D' },
  緑: { label: '緑バッジ', color: '#1A1A1A' },
}

const normalizeName = (name = '') => name.replace(/[\s\u3000]+/g, '')

// ポータルの会員 → 画面で使う形
const fromPortal = (m) => ({
  id: m.id,
  name: m.name,
  kana: m.kana,
  company: m.company,
  industry: m.industry,
  description: m.business,
  jobTitle: m.jobTitle,
  badge: m.badge,
  photo: m.photoUrl,
  url: m.urls?.[0],
  address: m.address,
  phoneNumber: m.phone,
  latitude: m.lat,
  longitude: m.lng,
  services: [],
  venue: TARGET_VENUE,
})

/**
 * 会員一覧を組み立てる。portalMembers が null のとき（ポータルを読めなかった）は
 * members.js と restaurants.js の店主から作る。
 */
export const buildDirectory = (portalMembers, stores) => {
  const ownerKey = (s) => normalizeName(s.owner)
  let raw
  if (portalMembers) {
    raw = portalMembers.map(fromPortal)
  } else {
    // 店主で members.js に居ない人は、店の情報から会員カードを作る
    const listed = new Set(fallbackMembers.map((m) => normalizeName(m.name)))
    const owners = new Map()
    for (const s of stores) {
      if (s.owner && !listed.has(ownerKey(s)) && !owners.has(ownerKey(s))) owners.set(ownerKey(s), s)
    }
    raw = [
      ...fallbackMembers,
      ...[...owners.values()].map((s) => ({
        id: `store-${s.id}`,
        name: s.owner,
        company: s.name,
        industry: '飲食',
        description: s.description,
        services: [],
        venue: TARGET_VENUE,
      })),
    ]
  }

  return raw
    .filter((m) => m.venue === TARGET_VENUE)
    .map((m) => {
      const key = normalizeName(m.name)
      const linkedStores = stores.filter((s) => s.ownerIds?.includes(m.id) || (s.owner && ownerKey(s) === key))
      const text = [m.company, m.description, ...(m.services ?? [])].join(' ')
      const byIndustry = NEEDS.filter((n) => n.industries.includes(m.industry)).map((n) => n.id)
      const byText = NEEDS.filter((n) => n.pattern.test(text)).map((n) => n.id)
      const needs = [...new Set([...byIndustry, ...byText, ...(linkedStores.length ? ['food'] : [])])]
      const located = Number.isFinite(m.latitude) && Number.isFinite(m.longitude)
      const anchor = located ? m : linkedStores[0]
      return {
        ...m,
        needs,
        primaryNeed: needs[0] ?? 'biz',
        linkedStores,
        latitude: anchor?.latitude,
        longitude: anchor?.longitude,
        address: m.address ?? anchor?.address,
        phoneNumber: m.phoneNumber ?? linkedStores[0]?.phoneNumber,
        hasLocation: Boolean(anchor),
      }
    })
}

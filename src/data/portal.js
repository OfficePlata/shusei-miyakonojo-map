// セワニンジャ・ポータル（Lark BASE の会員データ）から公開データを読む。
// 住所・電話は会員本人がポータルで「公開」にした人だけ入ってくる。
export const PORTAL_URL = (import.meta.env.VITE_PORTAL_URL ?? 'https://sewaninja-portal.a-sasahala.workers.dev').replace(/\/$/, '')

export const fetchMemberMap = async () => {
  const res = await fetch(`${PORTAL_URL}/api/member-map`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

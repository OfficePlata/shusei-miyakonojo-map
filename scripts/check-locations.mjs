// 店のピンが住所と合っているかを確かめる。
//   npm run check:locations
// restaurants.js の住所を国土地理院の住所検索で引き、登録されている座標とのずれを出す。
// LIMIT_M を超えた店が1つでもあれば終了コード1（手で書いた座標の間違いを公開前に止めるため）。
import { restaurants } from '../src/data/restaurants.js'

const LIMIT_M = 100

const toKey = (address) =>
  address
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .replace(/^(.+?\D)(\d+)(?:街区|番地|番|丁目|-)(\d+).*$/, '$1$2-$3')

const distanceM = (a, b) => {
  const rad = (d) => (d * Math.PI) / 180
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
  return Math.round(6371000 * 2 * Math.asin(Math.sqrt(h)))
}

let bad = 0
for (const r of restaurants) {
  const res = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(toKey(r.address))}`)
  const hit = (await res.json())[0]
  if (!hit) {
    console.log(`？ ${r.name}：住所が見つかりません（${r.address}）`)
    bad++
    continue
  }
  const [lng, lat] = hit.geometry.coordinates
  const d = distanceM({ lat, lng }, { lat: r.latitude, lng: r.longitude })
  const ng = d > LIMIT_M
  if (ng) bad++
  console.log(`${ng ? '✗' : '✓'} ${r.name}：${d}m（${hit.properties.title}）`)
}

console.log(bad ? `\n${bad}件のピンが住所から${LIMIT_M}m以上ずれています` : '\nすべての店のピンが住所と合っています')
process.exit(bad ? 1 : 0)

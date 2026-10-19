export const distanceKm = (a, b) => {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLng = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export const formatDistance = (km) =>
  km < 1.5 ? `徒歩${Math.max(1, Math.round((km * 1000) / 80))}分` : `${km.toFixed(1)}km`

export const routeUrl = (item) =>
  `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`

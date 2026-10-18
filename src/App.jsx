import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, MapPin, Clock, Users, Phone, Map as MapIcon, List, Navigation, X, LocateFixed, Moon, User, Share2 } from 'lucide-react'
import { cityCenter } from './data/restaurants.js'
import {
  stores, SCENES, CATEGORIES, AREAS, PRICE_BANDS, categoryById, sceneById, formatClose,
} from './data/taxonomy.js'
import RestaurantMap from './components/RestaurantMap.jsx'
import './App.css'

const SORTS = [
  { id: 'default', label: 'おすすめ順' },
  { id: 'late', label: '遅くまで営業' },
  { id: 'near', label: '現在地から近い' },
]

// ── URL ⇔ 絞り込み条件（「三部会」リンクをそのまま共有できる） ──
const readParams = () => {
  const p = new URLSearchParams(window.location.search)
  const list = (k) => (p.get(k) ? p.get(k).split(',') : [])
  return {
    scene: sceneById[p.get('scene')] ? p.get('scene') : null,
    categories: list('type').filter((c) => categoryById[c]),
    area: AREAS.includes(p.get('area')) ? p.get('area') : null,
    price: PRICE_BANDS.some((b) => b.id === p.get('price')) ? p.get('price') : null,
    q: p.get('q') ?? '',
  }
}

const writeParams = ({ scene, categories, area, price, q }) => {
  const p = new URLSearchParams()
  if (scene) p.set('scene', scene)
  if (categories.length) p.set('type', categories.join(','))
  if (area) p.set('area', area)
  if (price) p.set('price', price)
  if (q) p.set('q', q)
  const qs = p.toString()
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
}

const distanceKm = (a, b) => {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLng = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

const formatDistance = (km) =>
  km < 1.5 ? `徒歩${Math.max(1, Math.round((km * 1000) / 80))}分` : `${km.toFixed(1)}km`

const Chip = ({ active, onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`shrink-0 rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold transition-colors ${
      active ? 'bg-ink text-brand' : 'bg-paper text-ink hover:bg-brand-sub/30'
    } ${className}`}
  >
    {children}
  </button>
)

const StoreImage = ({ store, className, alt = '' }) => {
  const [failed, setFailed] = useState(false)
  const cat = categoryById[store.category]
  if (!store.hasImage || failed) return <span className={`grid h-full place-items-center ${className}`}>{cat.emoji}</span>
  return <img src={store.imageUrl} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
}

const SceneTag = ({ id, active }) => (
  <span
    className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
      active ? 'bg-brand-accent text-paper' : 'bg-brand/40 text-ink'
    }`}
  >
    {sceneById[id].emoji}
    {sceneById[id].label}
  </span>
)

function StoreCard({ store, scene, selected, distance, onSelect }) {
  const cat = categoryById[store.category]
  return (
    <button
      type="button"
      onClick={() => onSelect(store)}
      className={`flex w-full gap-3 rounded-2xl border-2 bg-paper p-3 text-left transition ${
        selected ? 'border-brand-accent shadow-[4px_4px_0_#DD6420]' : 'border-transparent shadow-sm hover:border-ink'
      }`}
    >
      <div
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl"
        style={{ background: cat.color }}
      >
        <StoreImage key={store.id} store={store} className="text-3xl" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-black leading-tight">{store.name}</h3>
          {distance !== undefined && (
            <span className="shrink-0 text-xs font-bold text-brand-accent">{formatDistance(distance)}</span>
          )}
        </div>
        <p className="mt-0.5 text-xs font-medium text-ink/70">
          {store.genre}・{store.area.replace(/（.*）/, '')}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-medium">
          {store.closeHour && (
            <span className="inline-flex items-center gap-1">
              <Moon className="h-3 w-3" />〜{formatClose(store.closeHour)}
            </span>
          )}
          {store.priceRangeDinner && <span>{store.priceRangeDinner}</span>}
          {store.capacity && <span>{store.capacity}席</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {store.scenes.map((s) => (
            <SceneTag key={s} id={s} active={s === scene} />
          ))}
        </div>
      </div>
    </button>
  )
}

function StoreDetail({ store, distance, onClose }) {
  const cat = categoryById[store.category]
  const route = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`
  return (
    <div className="flex max-h-full flex-col overflow-hidden rounded-t-3xl bg-paper shadow-2xl md:rounded-3xl">
      <div className="relative h-40 shrink-0" style={{ background: cat.color }}>
        <StoreImage key={store.id} store={store} alt={store.name} className="text-6xl" />
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-paper text-ink shadow"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="absolute bottom-3 left-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-brand">
          {cat.emoji} {cat.label}
        </span>
      </div>
      <div className="overflow-y-auto p-5">
        <h2 className="font-display text-xl leading-snug">{store.name}</h2>
        <p className="mt-1 text-sm font-medium text-ink/70">{store.genre}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {store.scenes.map((s) => (
            <SceneTag key={s} id={s} />
          ))}
        </div>
        {store.description && <p className="mt-4 text-sm font-medium leading-relaxed">{store.description}</p>}

        <dl className="mt-4 space-y-2 text-sm font-medium">
          <div className="flex gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <dd>
              {store.address}
              {distance !== undefined && <span className="ml-2 font-bold text-brand-accent">{formatDistance(distance)}</span>}
            </dd>
          </div>
          {store.openingHours && (
            <div className="flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <dd>
                {store.openingHours}
                {store.closingDay && <span className="ml-2 text-ink/60">定休：{store.closingDay}</span>}
              </dd>
            </div>
          )}
          {(store.priceRangeDinner || store.capacity) && (
            <div className="flex gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0" />
              <dd>
                {store.priceRangeDinner && <>夜 {store.priceRangeDinner}</>}
                {store.priceRangeLunch && <> ／ 昼 {store.priceRangeLunch}</>}
                {store.capacity && <span className="ml-2">最大{store.capacity}名</span>}
              </dd>
            </div>
          )}
          {store.owner && (
            <div className="flex gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0" />
              <dd>会員：{store.owner} さん</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {store.phoneNumber ? (
            <a
              href={`tel:${store.phoneNumber}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-accent py-3 text-sm font-black text-paper"
            >
              <Phone className="h-4 w-4" />電話する
            </a>
          ) : (
            <span className="flex items-center justify-center rounded-xl bg-ink/10 py-3 text-sm font-bold text-ink/50">
              電話番号未登録
            </span>
          )}
          <a
            href={route}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-black text-brand"
          >
            <Navigation className="h-4 w-4" />ルート案内
          </a>
        </div>
      </div>
    </div>
  )
}

function App() {
  const initial = useMemo(readParams, [])
  const [scene, setScene] = useState(initial.scene)
  const [categories, setCategories] = useState(initial.categories)
  const [area, setArea] = useState(initial.area)
  const [price, setPrice] = useState(initial.price)
  const [searchTerm, setSearchTerm] = useState(initial.q)
  const [sort, setSort] = useState('default')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [mobileView, setMobileView] = useState('list')
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    writeParams({ scene, categories, area, price, q: searchTerm })
  }, [scene, categories, area, price, searchTerm])

  const locate = useCallback(() => {
    if (!navigator.geolocation) return alert('この端末では現在地を取得できません')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude })
        setSort('near')
        setLocating(false)
      },
      () => {
        alert('現在地を取得できませんでした。位置情報の許可を確認してください。')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const changeSort = (id) => {
    if (id === 'near' && !userLocation) return locate()
    setSort(id)
  }

  const toggleCategory = (id) =>
    setCategories((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]))

  const resetFilters = () => {
    setScene(null)
    setCategories([])
    setArea(null)
    setPrice(null)
    setSearchTerm('')
  }

  const distances = useMemo(() => {
    if (!userLocation) return {}
    return Object.fromEntries(stores.map((s) => [s.id, distanceKm(userLocation, s)]))
  }, [userLocation])

  const filteredRestaurants = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const list = stores.filter((s) => {
      if (scene && !s.scenes.includes(scene)) return false
      if (categories.length && !categories.includes(s.category)) return false
      if (area && s.area !== area) return false
      if (price && s.priceBand !== price) return false
      if (q) {
        const hay = [s.name, s.genre, s.description, s.specialFeatures, s.owner, s.address].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (sort === 'late') return [...list].sort((a, b) => (b.closeHour ?? 0) - (a.closeHour ?? 0))
    if (sort === 'near' && userLocation) return [...list].sort((a, b) => distances[a.id] - distances[b.id])
    return list
  }, [scene, categories, area, price, searchTerm, sort, userLocation, distances])

  const activeFilterCount = [scene, area, price, searchTerm].filter(Boolean).length + categories.length

  const share = async () => {
    const url = window.location.href
    const title = `守成クラブ都城MAP${scene ? `｜${sceneById[scene].label}のお店` : ''}`
    try {
      if (navigator.share) await navigator.share({ title, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }
    } catch {
      // 共有をキャンセルした場合は何もしない
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* ヘッダー */}
      <header className="shrink-0 px-4 pb-3 pt-4 md:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wide">信頼でつなぐ商売繁盛の絆</p>
            <h1 className="font-display text-2xl leading-tight md:text-3xl">守成クラブ都城MAP</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-paper px-3 py-1 text-xs font-bold sm:inline">
              宮崎県・都城会場 在籍会員のお店
            </span>
            <button
              type="button"
              onClick={share}
              className="flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-brand"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? 'コピーしました' : '共有'}
            </button>
          </div>
        </div>

        {/* シーン（メインの入口） */}
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {SCENES.map((s) => {
            const active = scene === s.id
            const count = stores.filter((st) => st.scenes.includes(s.id)).length
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => setScene(active ? null : s.id)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 border-ink px-3 py-2 text-left transition ${
                  active ? 'bg-ink text-brand shadow-[3px_3px_0_#DD6420]' : 'bg-paper text-ink hover:-translate-y-0.5'
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span>
                  <span className="block text-sm font-black leading-tight">
                    {s.label}
                    <span className={`ml-1 text-xs ${active ? 'text-brand-sub' : 'text-brand-accent'}`}>{count}</span>
                  </span>
                  <span className={`block text-[11px] font-medium ${active ? 'text-paper/80' : 'text-ink/60'}`}>{s.sub}</span>
                </span>
              </button>
            )
          })}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row md:gap-4 md:px-6 md:pb-6">
        {/* 左：絞り込み＋リスト */}
        <section
          className={`flex min-h-0 flex-1 flex-col md:w-[440px] md:flex-none ${mobileView === 'map' ? 'hidden md:flex' : 'flex'}`}
        >
          <div className="space-y-2 px-4 pb-2 md:px-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="店名・会員名・キーワードで検索"
                className="w-full rounded-xl border-2 border-ink bg-paper py-2 pl-9 pr-3 text-sm font-medium outline-none focus:shadow-[3px_3px_0_#DD6420]"
              />
            </div>
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
              {CATEGORIES.map((c) => (
                <Chip key={c.id} active={categories.includes(c.id)} onClick={() => toggleCategory(c.id)}>
                  {c.emoji} {c.label}
                </Chip>
              ))}
              {PRICE_BANDS.map((b) => (
                <Chip key={b.id} active={price === b.id} onClick={() => setPrice(price === b.id ? null : b.id)}>
                  {b.label}
                </Chip>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={area ?? ''}
                onChange={(e) => setArea(e.target.value || null)}
                aria-label="エリア"
                className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-paper px-2 py-1.5 text-sm font-bold"
              >
                <option value="">📍 すべてのエリア</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}（{stores.filter((s) => s.area === a).length}）
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => changeSort(e.target.value)}
                aria-label="並び順"
                className="rounded-xl border-2 border-ink bg-paper px-2 py-1.5 text-sm font-bold"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between text-sm font-bold">
              <span>
                <span className="font-display text-lg">{filteredRestaurants.length}</span> 件
                {scene && <span className="ml-1">（{sceneById[scene].label}向け）</span>}
              </span>
              {activeFilterCount > 0 && (
                <button type="button" onClick={resetFilters} className="text-xs underline underline-offset-2">
                  条件をクリア
                </button>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-24 md:px-0 md:pb-0 md:pr-1">
            {filteredRestaurants.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                scene={scene}
                selected={selectedRestaurant?.id === store.id}
                distance={distances[store.id]}
                onSelect={setSelectedRestaurant}
              />
            ))}
            {filteredRestaurants.length === 0 && (
              <div className="rounded-2xl bg-paper p-6 text-center text-sm font-bold">
                条件に合うお店がありません
                <button type="button" onClick={resetFilters} className="mt-3 block w-full rounded-xl bg-ink py-2 text-brand">
                  条件をクリア
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 右：地図 */}
        <section
          className={`relative min-h-0 flex-1 overflow-hidden md:rounded-3xl md:border-2 md:border-ink ${
            mobileView === 'list' ? 'hidden md:block' : 'block'
          }`}
        >
          <RestaurantMap
            restaurants={filteredRestaurants}
            selectedRestaurant={selectedRestaurant}
            onRestaurantSelect={setSelectedRestaurant}
            center={cityCenter}
            userLocation={userLocation}
          />
          <button
            type="button"
            onClick={locate}
            aria-label="現在地を表示"
            className="absolute right-3 top-3 z-[500] grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-paper shadow"
          >
            <LocateFixed className={`h-5 w-5 ${locating ? 'animate-pulse text-brand-accent' : ''}`} />
          </button>
          <div className="absolute left-14 top-3 z-[500] flex flex-wrap gap-x-2 gap-y-0.5 rounded-xl md:bottom-3 md:left-3 md:top-auto bg-paper/95 px-2 py-1 text-[11px] font-bold shadow">
            {CATEGORIES.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                {c.label}
              </span>
            ))}
          </div>

          {/* PC：地図の上に詳細パネル */}
          {selectedRestaurant && (
            <div className="absolute bottom-4 right-4 top-16 z-[600] hidden w-[360px] md:block">
              <StoreDetail
                store={selectedRestaurant}
                distance={distances[selectedRestaurant.id]}
                onClose={() => setSelectedRestaurant(null)}
              />
            </div>
          )}
        </section>
      </div>

      {/* スマホ：地図／リスト切替 */}
      <div className="fixed bottom-5 left-1/2 z-[700] flex -translate-x-1/2 rounded-full border-2 border-ink bg-paper p-1 shadow-lg md:hidden">
        {[
          { id: 'list', label: 'リスト', icon: <List className="h-4 w-4" /> },
          { id: 'map', label: '地図', icon: <MapIcon className="h-4 w-4" /> },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobileView(id)}
            className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-black ${
              mobileView === id ? 'bg-ink text-brand' : 'text-ink'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* スマホ：詳細ボトムシート */}
      {selectedRestaurant && (
        <div
          className="fixed inset-0 z-[800] flex items-end bg-ink/40 md:hidden"
          onClick={() => setSelectedRestaurant(null)}
        >
          <div className="max-h-[85dvh] w-full" onClick={(e) => e.stopPropagation()}>
            <StoreDetail
              store={selectedRestaurant}
              distance={distances[selectedRestaurant.id]}
              onClose={() => setSelectedRestaurant(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App

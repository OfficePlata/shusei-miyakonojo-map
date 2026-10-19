import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Map as MapIcon, List, LocateFixed, Share2, Users, UtensilsCrossed, Megaphone } from 'lucide-react'
import { cityCenter } from './data/restaurants.js'
import { SCENES, CATEGORIES, PRICE_BANDS, categoryById, sceneById, storeMarker, buildStores, areasOf } from './data/taxonomy.js'
import { NEEDS, needById, memberMarker, buildDirectory } from './data/memberTaxonomy.js'
import { fetchMemberMap, PORTAL_URL } from './data/portal.js'
import MapView from './components/MapView.jsx'
import { Chip, EntryButton } from './components/common.jsx'
import { distanceKm } from './lib/geo.js'
import { StoreCard, StoreDetail } from './components/StoreParts.jsx'
import { MemberCard, MemberDetail } from './components/MemberParts.jsx'
import './App.css'

const MODES = [
  { id: 'members', label: '会員をさがす', icon: <Users className="h-4 w-4" /> },
  { id: 'stores', label: 'お店をさがす', icon: <UtensilsCrossed className="h-4 w-4" /> },
]

const STORE_SORTS = [
  { id: 'default', label: 'おすすめ順' },
  { id: 'late', label: '遅くまで営業' },
  { id: 'near', label: '現在地から近い' },
]

// 会員はポータルからフリガナ順で届く
const MEMBER_SORTS = [
  { id: 'default', label: 'あいうえお順' },
  { id: 'photo', label: '写真のある人から' },
  { id: 'near', label: '現在地から近い' },
]


// ── URL ⇔ 絞り込み条件（「三部会のお店」「住まいの相談」リンクをそのまま共有できる） ──
const readParams = ({ areas, memberById, storeById }) => {
  const p = new URLSearchParams(window.location.search)
  const list = (k) => (p.get(k) ? p.get(k).split(',') : [])
  const scene = sceneById[p.get('scene')] ? p.get('scene') : null
  const categories = list('type').filter((c) => categoryById[c])
  const member = memberById[p.get('member')] ?? null
  const store = storeById[p.get('store')] ?? null
  const storeHint = scene || categories.length || store || p.get('area') || p.get('price')
  return {
    mode: p.get('mode') === 'stores' || (p.get('mode') !== 'members' && storeHint) ? 'stores' : 'members',
    need: needById[p.get('need')] ? p.get('need') : null,
    scene,
    categories,
    area: areas.includes(p.get('area')) ? p.get('area') : null,
    price: PRICE_BANDS.some((b) => b.id === p.get('price')) ? p.get('price') : null,
    q: p.get('q') ?? '',
    selected: member ? { type: 'member', item: member } : store ? { type: 'store', item: store } : null,
  }
}

const writeParams = ({ mode, need, scene, categories, area, price, q, selected }) => {
  const p = new URLSearchParams()
  if (mode === 'stores') {
    p.set('mode', 'stores')
    if (scene) p.set('scene', scene)
    if (categories.length) p.set('type', categories.join(','))
    if (area) p.set('area', area)
    if (price) p.set('price', price)
  } else if (need) p.set('need', need)
  if (q) p.set('q', q)
  if (selected) p.set(selected.type, selected.item.id)
  const qs = p.toString()
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
}

const formatMeetingDate = (ms) => {
  if (!ms) return ''
  const d = new Date(ms)
  return `（${d.getMonth() + 1}/${d.getDate()}）`
}

const copyOrShare = async (title, url) => {
  if (navigator.share) {
    await navigator.share({ title, url })
    return false
  }
  await navigator.clipboard.writeText(url)
  return true
}

// ポータルから会員と三部会の店を読み、読めなければ同梱のデータで動かす
const useMapData = () => {
  const [state, setState] = useState(null)
  useEffect(() => {
    let alive = true
    const done = (portal) => {
      if (!alive) return
      const stores = buildStores(portal?.shops ?? [])
      setState({
        stores,
        directory: buildDirectory(portal?.members ?? null, stores),
        meeting: portal?.meeting ?? null,
        live: Boolean(portal),
      })
    }
    fetchMemberMap().then(done, (err) => {
      console.warn('ポータルを読めなかったため同梱データで表示します', err)
      done(null)
    })
    return () => {
      alive = false
    }
  }, [])
  return state
}

function App() {
  const data = useMapData()
  if (!data) {
    return (
      <div className="grid h-dvh place-items-center text-paper">
        <p className="font-display text-xl">守成クラブ都城MAP</p>
      </div>
    )
  }
  return <Finder {...data} />
}

function Finder({ stores, directory, meeting, live }) {
  const areas = useMemo(() => areasOf(stores), [stores])
  const storeById = useMemo(() => Object.fromEntries(stores.map((s) => [String(s.id), s])), [stores])
  const memberById = useMemo(() => Object.fromEntries(directory.map((m) => [m.id, m])), [directory])
  const ownerOf = (store) => directory.find((m) => m.linkedStores.some((s) => s.id === store.id))
  const initial = useMemo(() => readParams({ areas, memberById, storeById }), [areas, memberById, storeById])
  const [mode, setMode] = useState(initial.mode)
  const [need, setNeed] = useState(initial.need)
  const [scene, setScene] = useState(initial.scene)
  const [categories, setCategories] = useState(initial.categories)
  const [area, setArea] = useState(initial.area)
  const [price, setPrice] = useState(initial.price)
  const [searchTerm, setSearchTerm] = useState(initial.q)
  const [storeSort, setStoreSort] = useState('default')
  const [memberSort, setMemberSort] = useState('default')
  const [selected, setSelected] = useState(initial.selected)
  const [mobileView, setMobileView] = useState('list')
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    writeParams({ mode, need, scene, categories, area, price, q: searchTerm, selected })
  }, [mode, need, scene, categories, area, price, searchTerm, selected])

  const flash = (key) => {
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  const locate = useCallback(() => {
    if (!navigator.geolocation) return alert('この端末では現在地を取得できません')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude })
        setStoreSort('near')
        setMemberSort('near')
        setLocating(false)
      },
      () => {
        alert('現在地を取得できませんでした。位置情報の許可を確認してください。')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const switchMode = (id) => {
    setMode(id)
    setSelected(null)
    setSearchTerm('')
  }

  const openStore = (store) => {
    setMode('stores')
    setSelected({ type: 'store', item: store })
  }
  const openMember = (member) => {
    setMode('members')
    setSelected({ type: 'member', item: member })
  }

  const toggleCategory = (id) =>
    setCategories((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]))

  const resetFilters = () => {
    if (mode === 'stores') {
      setScene(null)
      setCategories([])
      setArea(null)
      setPrice(null)
    } else setNeed(null)
    setSearchTerm('')
  }

  const distances = useMemo(() => {
    if (!userLocation) return {}
    const d = {}
    for (const s of stores) d[`store-${s.id}`] = distanceKm(userLocation, s)
    for (const m of directory) if (m.hasLocation) d[`member-${m.id}`] = distanceKm(userLocation, m)
    return d
  }, [userLocation, stores, directory])

  const q = searchTerm.trim().toLowerCase()

  const filteredStores = useMemo(() => {
    const list = stores.filter((s) => {
      if (scene && !s.scenes.includes(scene)) return false
      if (categories.length && !categories.includes(s.category)) return false
      if (area && s.area !== area) return false
      if (price && s.priceBand !== price) return false
      if (q && ![s.name, s.genre, s.description, s.specialFeatures, s.owner, s.address].join(' ').toLowerCase().includes(q))
        return false
      return true
    })
    if (storeSort === 'late') return [...list].sort((a, b) => (b.closeHour ?? 0) - (a.closeHour ?? 0))
    if (storeSort === 'near' && userLocation)
      return [...list].sort((a, b) => distances[`store-${a.id}`] - distances[`store-${b.id}`])
    return list
  }, [stores, scene, categories, area, price, q, storeSort, userLocation, distances])

  const filteredMembers = useMemo(() => {
    const list = directory.filter((m) => {
      if (need && !m.needs.includes(need)) return false
      if (q && ![m.name, m.company, m.industry, m.description, ...(m.services ?? [])].join(' ').toLowerCase().includes(q))
        return false
      return true
    })
    if (memberSort === 'photo') return [...list].sort((a, b) => Number(Boolean(b.photo)) - Number(Boolean(a.photo)))
    if (memberSort === 'near' && userLocation) {
      const d = (m) => distances[`member-${m.id}`] ?? Infinity
      return [...list].sort((a, b) => d(a) - d(b))
    }
    return list
  }, [directory, need, q, memberSort, userLocation, distances])

  const isStores = mode === 'stores'
  const mapItems = isStores ? filteredStores : filteredMembers.filter((m) => m.hasLocation)
  const resultCount = isStores ? filteredStores.length : filteredMembers.length
  const activeFilterCount = isStores
    ? [scene, area, price, searchTerm].filter(Boolean).length + categories.length
    : [need, searchTerm].filter(Boolean).length
  const sorts = isStores ? STORE_SORTS : MEMBER_SORTS
  const sort = isStores ? storeSort : memberSort
  const setSort = isStores ? setStoreSort : setMemberSort
  const selectedItem = selected && (selected.type === 'store') === isStores ? selected.item : null
  const distanceOf = (type, item) => distances[`${type}-${item.id}`]

  const changeSort = (id) => {
    if (id === 'near' && !userLocation) return locate()
    setSort(id)
  }

  const sharePage = async () => {
    const label = isStores ? (scene ? `｜${sceneById[scene].label}のお店` : '') : need ? `｜${needById[need].label}の会員` : ''
    try {
      if (await copyOrShare(`守成クラブ都城MAP${label}`, window.location.href)) flash('page')
    } catch {
      // 共有をキャンセルした場合は何もしない
    }
  }

  const shareMember = async (member) => {
    const url = `${window.location.origin}${window.location.pathname}?member=${member.id}`
    try {
      if (await copyOrShare(`${member.name}さん（${member.company}）｜守成クラブ都城MAP`, url)) flash(member.id)
    } catch {
      // 共有をキャンセルした場合は何もしない
    }
  }

  const select = (item) => setSelected({ type: isStores ? 'store' : 'member', item })
  const closeDetail = () => setSelected(null)

  const detail = selectedItem
    ? isStores
      ? (
        <StoreDetail
          store={selectedItem}
          distance={distanceOf('store', selectedItem)}
          owner={ownerOf(selectedItem)}
          onOpenOwner={openMember}
          onClose={closeDetail}
        />
      )
      : (
        <MemberDetail
          member={selectedItem}
          distance={distanceOf('member', selectedItem)}
          onOpenStore={openStore}
          onShare={() => shareMember(selectedItem)}
          shared={copied === selectedItem.id}
          onClose={closeDetail}
        />
      )
    : null

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* ヘッダー */}
      <header className="shrink-0 px-4 pb-3 pt-4 text-paper md:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wide text-brand">信頼でつなぐ商売繁盛の絆</p>
            <h1 className="font-display text-2xl leading-tight md:text-3xl">守成クラブ都城MAP</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-paper/15 px-3 py-1 text-xs font-bold sm:inline">
              宮崎県・都城会場 在籍会員
            </span>
            <button
              type="button"
              onClick={sharePage}
              className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-ink"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied === 'page' ? 'コピーしました' : '共有'}
            </button>
          </div>
        </div>

        {/* モード切替 */}
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-ink/25 p-1 md:inline-grid md:w-[440px]">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => switchMode(m.id)}
              aria-pressed={mode === m.id}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-black transition ${
                mode === m.id ? 'bg-paper text-ink shadow' : 'text-paper hover:bg-paper/10'
              }`}
            >
              {m.icon}
              {m.label}
              <span className={`text-xs ${mode === m.id ? 'text-shusei' : 'text-brand'}`}>
                {m.id === 'members' ? directory.length : stores.length}
              </span>
            </button>
          ))}
        </div>

        {/* 入口：会員＝困りごと／お店＝シーン */}
        <p className="mt-3 text-xs font-bold text-paper/90">
          {isStores ? 'どんな場面で使う？' : 'こんな時、会員さんに相談しよう'}
        </p>
        <div className="no-scrollbar -mx-4 mt-1.5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {isStores
            ? SCENES.map((s) => (
              <EntryButton
                key={s.id}
                {...s}
                active={scene === s.id}
                count={stores.filter((st) => st.scenes.includes(s.id)).length}
                onClick={() => setScene(scene === s.id ? null : s.id)}
              />
            ))
            : NEEDS.map((n) => (
              <EntryButton
                key={n.id}
                {...n}
                active={need === n.id}
                count={directory.filter((m) => m.needs.includes(n.id)).length}
                onClick={() => setNeed(need === n.id ? null : n.id)}
              />
            ))}
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
                placeholder={isStores ? '店名・会員名・キーワードで検索' : '「リフォーム」「名入れ」など、やりたいことで検索'}
                className="w-full rounded-xl border-2 border-ink bg-paper py-2 pl-9 pr-3 text-sm font-medium outline-none focus:shadow-[3px_3px_0_#FFD600]"
              />
            </div>
            {isStores && (
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
            )}
            <div className="flex items-center gap-2">
              {isStores && (
                <select
                  value={area ?? ''}
                  onChange={(e) => setArea(e.target.value || null)}
                  aria-label="エリア"
                  className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-paper px-2 py-1.5 text-sm font-bold"
                >
                  <option value="">📍 すべてのエリア</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}（{stores.filter((s) => s.area === a).length}）
                    </option>
                  ))}
                </select>
              )}
              <select
                value={sort}
                onChange={(e) => changeSort(e.target.value)}
                aria-label="並び順"
                className={`rounded-xl border-2 border-ink bg-paper px-2 py-1.5 text-sm font-bold ${isStores ? '' : 'ml-auto'}`}
              >
                {sorts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-paper">
              <span>
                <span className="font-display text-lg">{resultCount}</span> {isStores ? '件' : '人'}
                {isStores && scene && <span className="ml-1">（{sceneById[scene].label}向け）</span>}
                {!isStores && need && <span className="ml-1">（{needById[need].label}）</span>}
              </span>
              {activeFilterCount > 0 && (
                <button type="button" onClick={resetFilters} className="text-xs underline underline-offset-2">
                  条件をクリア
                </button>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-24 md:px-0 md:pb-0 md:pr-1">
            {isStores && scene === 'sanbukai' && (
              <div className="rounded-2xl bg-ink p-3 text-xs font-medium leading-relaxed text-paper">
                <p className="text-sm font-black text-brand">🏮 三部会のお店</p>
                {live ? (
                  <p className="mt-1">
                    {meeting ? `${meeting.name}${formatMeetingDate(meeting.startAt)}` : '次回例会'}
                    に出席する赤バッジ以上の会員のお店です（牟田町周辺・都城駅周辺）。出欠の回答に合わせて自動で入れ替わります。
                  </p>
                ) : (
                  <p className="mt-1">会員データに接続できないため、いまは三部会の判定ができません。時間をおいて開き直してください。</p>
                )}
              </div>
            )}
            {isStores
              ? filteredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  scene={scene}
                  selected={selectedItem?.id === store.id}
                  distance={distanceOf('store', store)}
                  onSelect={select}
                />
              ))
              : filteredMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  need={need}
                  selected={selectedItem?.id === member.id}
                  distance={distanceOf('member', member)}
                  onSelect={select}
                />
              ))}
            {resultCount === 0 && (
              <div className="rounded-2xl bg-paper p-6 text-center text-sm font-bold">
                {isStores ? '条件に合うお店がありません' : 'この分野の会員さんはまだ掲載されていません'}
                <button type="button" onClick={resetFilters} className="mt-3 block w-full rounded-xl bg-ink py-2 text-brand">
                  条件をクリア
                </button>
              </div>
            )}
            {!isStores && (
              <div className="flex gap-3 rounded-2xl border-2 border-dashed border-paper/70 p-4 text-paper">
                <Megaphone className="h-5 w-5 shrink-0 text-brand" />
                <p className="text-xs font-medium leading-relaxed">
                  <span className="block text-sm font-black">住所・電話番号も載せませんか？</span>
                  セワニンジャ・ポータルのホーム「守成クラブ都城MAPの公開設定」で公開にすると、地図にピンが立ち、会員さんから直接連絡が来るようになります。
                  <a href={PORTAL_URL} target="_blank" rel="noreferrer" className="mt-2 block font-black text-brand underline underline-offset-2">
                    ポータルを開く →
                  </a>
                </p>
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
          <MapView
            items={mapItems}
            selected={selectedItem}
            onSelect={select}
            markerOf={isStores ? storeMarker : memberMarker}
            center={cityCenter}
            userLocation={userLocation}
          />
          <button
            type="button"
            onClick={locate}
            aria-label="現在地を表示"
            className="absolute right-3 top-3 z-[500] grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-paper shadow"
          >
            <LocateFixed className={`h-5 w-5 ${locating ? 'animate-pulse text-shusei' : ''}`} />
          </button>
          <div className="absolute left-14 top-3 z-[500] flex max-w-[calc(100%-7.5rem)] flex-wrap gap-x-2 gap-y-0.5 rounded-xl bg-paper/95 px-2 py-1 text-[11px] font-bold shadow md:bottom-3 md:left-3 md:top-auto">
            {isStores
              ? CATEGORIES.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </span>
              ))
              : (
                <span>
                  地図に出るのは所在地を登録した会員のみ（{mapItems.length}／{filteredMembers.length}人）
                </span>
              )}
          </div>

          {/* PC：地図の上に詳細パネル */}
          {detail && <div className="absolute bottom-4 right-4 top-16 z-[600] hidden w-[360px] md:block">{detail}</div>}
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
      {detail && (
        <div className="fixed inset-0 z-[800] flex items-end bg-ink/50 md:hidden" onClick={closeDetail}>
          <div className="max-h-[85dvh] w-full" onClick={(e) => e.stopPropagation()}>
            {detail}
          </div>
        </div>
      )}
    </div>
  )
}

export default App

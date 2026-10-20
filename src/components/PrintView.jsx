import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, ArrowDown, ArrowUp, Printer, Trash2, Link2 } from 'lucide-react'
import { DEFAULT_TITLE, parseKey, printParams, saveList } from '../lib/printList.js'
import '../print.css'

// 印刷リスト（A4 タテ）。上に番号付きの地図、下に番号順の一覧。
// 紙に出る部分は PDF_PRINT_SAFE_RULES に合わせ、影・グラデーション・半透明・破線・写真を使わない。

const SITE_URL = 'https://shusei-miyakonojo-map.pages.dev/'

const PIN = 24
// dx, dy：重なったピンをずらす量（px）
const numberIcon = (n, dx = 0, dy = 0) =>
  L.divIcon({
    className: 'print-pin',
    html: `<span>${n}</span>`,
    iconSize: [PIN, PIN],
    iconAnchor: [PIN / 2 - dx, PIN / 2 - dy],
  })

// 同じビルの店などでピンが重なるときは、先に置いたピンの周りに少しずつずらして全部見えるようにする
const spread = (map, points) => {
  const placed = []
  return points.map((p) => {
    const at = map.latLngToContainerPoint([p.latitude, p.longitude])
    let pos = at
    for (let k = 0; placed.some((q) => q.distanceTo(pos) < PIN + 2) && k < 12; k++) {
      const angle = (k * Math.PI) / 3 - Math.PI / 2
      const r = PIN + 2 + Math.floor(k / 6) * PIN
      pos = L.point(at.x + r * Math.cos(angle), at.y + r * Math.sin(angle))
    }
    placed.push(pos)
    return { ...p, dx: Math.round(pos.x - at.x), dy: Math.round(pos.y - at.y) }
  })
}

// 全部のピンが入るように合わせ、ずらし量を計算して番号ピンを立てる
const NumberedPins = ({ points }) => {
  const map = useMap()
  const [laid, setLaid] = useState([])
  const key = points.map((p) => `${p.no}@${p.latitude},${p.longitude}`).join('|')
  useEffect(() => {
    if (points.length === 0) return undefined
    const relayout = () => setLaid(spread(map, points))
    map.invalidateSize()
    map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude])), { padding: [32, 32], maxZoom: 17 })
    relayout()
    map.on('zoomend', relayout)
    return () => map.off('zoomend', relayout)
    // points は key が同じなら同じ並び
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])
  return laid.map((p) => (
    <Marker key={p.no} position={[p.latitude, p.longitude]} icon={numberIcon(p.no, p.dx, p.dy)} zIndexOffset={-p.no} />
  ))
}

// 印刷用に、地図（タイル＋番号ピン）を1枚の JPEG にまとめる。
// タイル画像の束のまま刷ると PostScript が膨らむため（PDF_PRINT_SAFE_RULES：1ページ5MB以下）。
// 2倍で描くので、紙の上でおよそ190ppi。失敗したら null（そのまま地図を刷る）
const snapshotMap = (container) => {
  try {
    const box = container.getBoundingClientRect()
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(box.width * scale)
    canvas.height = Math.round(box.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, box.width, box.height)
    for (const img of container.querySelectorAll('.leaflet-tile-pane img.leaflet-tile-loaded')) {
      const r = img.getBoundingClientRect()
      ctx.drawImage(img, r.left - box.left, r.top - box.top, r.width, r.height)
    }
    for (const pin of container.querySelectorAll('.print-pin span')) {
      const r = pin.getBoundingClientRect()
      const x = r.left - box.left + r.width / 2
      const y = r.top - box.top + r.height / 2
      ctx.beginPath()
      ctx.arc(x, y, r.width / 2 - 1, 0, Math.PI * 2)
      ctx.fillStyle = '#C8161D'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#FFFFFF'
      ctx.stroke()
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 12px "Noto Sans JP", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(pin.textContent, x, y + 0.5)
    }
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch {
    // タイルが CORS で読めなかったときなど
    return null
  }
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

// 1行分の中身（お店／会員）
const storeLines = (s, owner) => ({
  name: s.name,
  sub: [s.genre, owner ? `店主 ${owner.name}さん` : null].filter(Boolean).join('・'),
  address: s.address,
  hours: [s.openingHours, s.closingDay && `定休：${s.closingDay}`].filter(Boolean).join('　'),
  phone: s.phoneNumber,
})

const memberLines = (m) => ({
  name: `${m.name}さん`,
  sub: [m.company, m.industry].filter(Boolean).join('・'),
  address: m.address,
  hours: m.linkedStores.length ? `お店：${m.linkedStores.map((s) => s.name).join('、')}` : '',
  phone: m.phoneNumber,
})

export default function PrintView({ stores, directory, initialKeys, initialTitle, onBack }) {
  const [keys, setKeys] = useState(initialKeys)
  const [title, setTitle] = useState(initialTitle || DEFAULT_TITLE)
  const [copied, setCopied] = useState(false)
  const mapBox = useRef(null)
  const snapImg = useRef(null)

  // 印刷の直前に地図を1枚の画像に差し替える（ボタンでも Ctrl+P でも）
  const prepareMap = () => {
    const box = mapBox.current
    const url = box && snapshotMap(box.querySelector('.leaflet-container'))
    if (!box || !snapImg.current) return Promise.resolve()
    box.classList.toggle('has-snap', Boolean(url))
    if (!url) return Promise.resolve()
    snapImg.current.src = url
    return snapImg.current.decode().catch(() => {})
  }
  useEffect(() => {
    const before = () => {
      prepareMap()
    }
    window.addEventListener('beforeprint', before)
    return () => window.removeEventListener('beforeprint', before)
  }, [])
  const printNow = async () => {
    await prepareMap()
    window.print()
  }

  const storeById = useMemo(() => Object.fromEntries(stores.map((s) => [String(s.id), s])), [stores])
  const memberById = useMemo(() => Object.fromEntries(directory.map((m) => [m.id, m])), [directory])
  const ownerOf = (store) => directory.find((m) => m.linkedStores.some((s) => s.id === store.id))

  // 見つからない（掲載が外れた）ものは黙って落とす
  const rows = keys
    .map((key) => {
      const { type, id } = parseKey(key)
      const item = type === 'store' ? storeById[id] : memberById[id]
      if (!item) return null
      const located = Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
      return { key, type, item, located, lines: type === 'store' ? storeLines(item, ownerOf(item)) : memberLines(item) }
    })
    .filter(Boolean)
    .map((r, i) => ({ ...r, no: i + 1 }))
  const points = rows.filter((r) => r.located).map((r) => ({ no: r.no, latitude: r.item.latitude, longitude: r.item.longitude }))

  useEffect(() => {
    saveList(keys)
    window.history.replaceState(null, '', `?${printParams(keys, title)}`)
  }, [keys, title])

  useEffect(() => {
    const prev = document.title
    document.title = title
    return () => {
      document.title = prev
    }
  }, [title])

  const move = (key, d) =>
    setKeys((cur) => {
      const i = cur.indexOf(key)
      const j = i + d
      if (i < 0 || j < 0 || j >= cur.length) return cur
      const next = [...cur]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  const remove = (key) => setKeys((cur) => cur.filter((k) => k !== key))

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // コピーできない環境では何もしない
    }
  }

  return (
    <div className="print-root">
      {/* 画面だけの操作バー */}
      <div className="print-toolbar no-print">
        <button type="button" onClick={onBack} className="print-btn">
          <ArrowLeft className="h-4 w-4" />
          MAPに戻る
        </button>
        <span className="print-toolbar__count">{rows.length}件</span>
        <button type="button" onClick={copyLink} className="print-btn" disabled={rows.length === 0}>
          <Link2 className="h-4 w-4" />
          {copied ? 'コピーしました' : 'リンクをコピー'}
        </button>
        <button
          type="button"
          onClick={() => window.confirm('リストを空にしますか？') && setKeys([])}
          className="print-btn"
          disabled={rows.length === 0}
        >
          <Trash2 className="h-4 w-4" />
          全部外す
        </button>
        <button type="button" onClick={printNow} className="print-btn print-btn--primary" disabled={rows.length === 0}>
          <Printer className="h-4 w-4" />
          印刷する（A4タテ）
        </button>
      </div>

      <div className="print-scroll">
        <article className="print-sheet">
          <header className="print-head">
            <input
              className="print-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={40}
              aria-label="リストの題名"
            />
            <p className="print-meta">
              守成クラブ都城MAP（{SITE_URL}）より・{today()} 作成
            </p>
          </header>

          {rows.length === 0 ? (
            <p className="print-empty no-print">
              リストが空です。MAPに戻り、お店・会員の詳細で「印刷リストに追加」を押してください。
            </p>
          ) : (
            <>
              {points.length > 0 && (
                <div className="print-map" ref={mapBox}>
                  <MapContainer
                    center={[points[0].latitude, points[0].longitude]}
                    zoom={15}
                    zoomControl={false}
                    fadeAnimation={false}
                    zoomAnimation={false}
                    markerZoomAnimation={false}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      crossOrigin="anonymous"
                    />
                    <NumberedPins points={points} />
                  </MapContainer>
                  <img ref={snapImg} alt="" className="print-map-snap" />
                </div>
              )}

              <table className="print-table">
                <thead>
                  <tr>
                    <th className="print-col-no">No.</th>
                    <th>名前</th>
                    <th>住所・営業時間</th>
                    <th className="print-col-tel">電話</th>
                    <th className="print-col-ctl no-print" aria-label="操作" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.key}>
                      <td className="print-col-no">
                        <span className="print-no">{r.no}</span>
                      </td>
                      <td>
                        <strong className="print-name">{r.lines.name}</strong>
                        {r.lines.sub && <span className="print-sub">{r.lines.sub}</span>}
                      </td>
                      <td>
                        {r.lines.address || <span className="print-sub">住所の掲載なし</span>}
                        {!r.located && r.lines.address && <span className="print-sub">（地図なし）</span>}
                        {r.lines.hours && <span className="print-sub">{r.lines.hours}</span>}
                      </td>
                      <td className="print-col-tel">{r.lines.phone || '—'}</td>
                      <td className="print-col-ctl no-print">
                        <button type="button" aria-label="上へ" onClick={() => move(r.key, -1)} disabled={i === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label="下へ" onClick={() => move(r.key, 1)} disabled={i === rows.length - 1}>
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label="リストから外す" onClick={() => remove(r.key)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="print-foot">
                掲載内容は変わることがあります。最新の情報は守成クラブ都城MAPでご確認ください。地図 © OpenStreetMap contributors
              </p>
            </>
          )}
        </article>
      </div>
    </div>
  )
}

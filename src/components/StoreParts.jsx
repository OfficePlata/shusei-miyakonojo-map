import { useState } from 'react'
import { MapPin, Clock, Users, Phone, Navigation, Moon, User } from 'lucide-react'
import { categoryById, sceneById, formatClose } from '../data/taxonomy.js'
import { formatDistance, routeUrl } from '../lib/geo.js'
import { DetailShell, ActionLink } from './common.jsx'

const StoreImage = ({ store, className, alt = '' }) => {
  const [failed, setFailed] = useState(false)
  const cat = categoryById[store.category]
  if (!store.hasImage || failed) return <span className={`grid h-full place-items-center ${className}`}>{cat.emoji}</span>
  return <img src={store.imageUrl} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
}

const SceneTag = ({ id, active }) => (
  <span
    className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
      active ? 'bg-shusei text-paper' : 'bg-brand/50 text-ink'
    }`}
  >
    {sceneById[id].emoji}
    {sceneById[id].label}
  </span>
)

export function StoreCard({ store, scene, selected, distance, onSelect }) {
  const cat = categoryById[store.category]
  return (
    <button
      type="button"
      onClick={() => onSelect(store)}
      className={`flex w-full gap-3 rounded-2xl border-2 bg-paper p-3 text-left transition ${
        selected ? 'border-ink shadow-[4px_4px_0_#FFD600]' : 'border-transparent shadow-sm hover:border-ink'
      }`}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ background: cat.color }}>
        <StoreImage key={store.id} store={store} className="text-3xl" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-black leading-tight">{store.name}</h3>
          {distance !== undefined && (
            <span className="shrink-0 text-xs font-bold text-shusei">{formatDistance(distance)}</span>
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

export function StoreDetail({ store, distance, owner, onOpenOwner, onClose }) {
  const cat = categoryById[store.category]
  return (
    <DetailShell
      color={cat.color}
      visual={<StoreImage key={store.id} store={store} alt={store.name} className="text-6xl" />}
      badge={`${cat.emoji} ${cat.label}`}
      onClose={onClose}
    >
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
            {distance !== undefined && <span className="ml-2 font-bold text-shusei">{formatDistance(distance)}</span>}
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
      </dl>

      {owner && (
        <button
          type="button"
          onClick={() => onOpenOwner(owner)}
          className="mt-4 flex w-full items-center gap-2 rounded-xl border-2 border-ink px-3 py-2 text-left text-sm font-bold hover:bg-brand"
        >
          <User className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">オーナー：{owner.name}さん</span>
          <span className="shrink-0 text-xs text-shusei">プロフィール →</span>
        </button>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {store.phoneNumber ? (
          <ActionLink href={`tel:${store.phoneNumber}`} icon={<Phone className="h-4 w-4" />}>
            電話する
          </ActionLink>
        ) : (
          <span className="flex items-center justify-center rounded-xl bg-ink/10 py-3 text-sm font-bold text-ink/50">
            電話番号未登録
          </span>
        )}
        <ActionLink href={routeUrl(store)} icon={<Navigation className="h-4 w-4" />} dark external>
          ルート案内
        </ActionLink>
      </div>
    </DetailShell>
  )
}

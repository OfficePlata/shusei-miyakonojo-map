import { useState } from 'react'
import { MapPin, Phone, Globe, Share2, Store, MessageCircle } from 'lucide-react'
import { needById, BADGES } from '../data/memberTaxonomy.js'
import { formatDistance } from '../lib/geo.js'
import { DetailShell, ActionLink } from './common.jsx'

const initialOf = (name = '') => name.trim().charAt(0)

const Avatar = ({ member, size }) => {
  const [failed, setFailed] = useState(false)
  const need = needById[member.primaryNeed]
  const showPhoto = member.photo && !failed
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border-2 border-ink ${size}`}
      style={{ background: need.color }}
    >
      {showPhoto ? (
        <img src={member.photo} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full place-items-center font-display text-paper">{initialOf(member.name)}</span>
      )}
    </div>
  )
}

const BadgeChip = ({ badge }) => {
  const b = BADGES[badge]
  if (!b) return null
  return (
    <span className="inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-black text-paper" style={{ background: b.color }}>
      {b.label}
    </span>
  )
}

const NeedTag = ({ id, active }) => {
  const n = needById[id]
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
        active ? 'bg-shusei text-paper' : 'bg-brand/50 text-ink'
      }`}
    >
      {n.emoji}
      {n.label}
    </span>
  )
}

export function MemberCard({ member, need, selected, distance, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(member)}
      className={`flex w-full gap-3 rounded-2xl border-2 bg-paper p-3 text-left transition ${
        selected ? 'border-ink shadow-[4px_4px_0_#FFD600]' : 'border-transparent shadow-sm hover:border-ink'
      }`}
    >
      <Avatar member={member} size="h-14 w-14 text-xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-black leading-tight">
            {member.name}
            <span className="ml-0.5 text-xs font-bold">さん</span>
          </h3>
          {distance !== undefined && (
            <span className="shrink-0 text-xs font-bold text-shusei">{formatDistance(distance)}</span>
          )}
        </div>
        <p className="flex items-center gap-1 text-xs font-bold text-ink/70">
          <BadgeChip badge={member.badge} />
          <span className="truncate">
            {member.company}・{member.industry}
          </span>
        </p>
        {member.services?.length > 0 ? (
          <p className="mt-1 line-clamp-2 text-xs font-medium">{member.services.join(' ／ ')}</p>
        ) : (
          member.description && <p className="mt-1 line-clamp-2 text-xs font-medium">{member.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {member.needs.map((n) => (
            <NeedTag key={n} id={n} active={n === need} />
          ))}
        </div>
      </div>
    </button>
  )
}

export function MemberDetail({ member, distance, onOpenStore, onShare, shared, onClose }) {
  const need = needById[member.primaryNeed]
  return (
    <DetailShell
      color={need.color}
      visual={
        <div className="grid h-full place-items-center">
          <Avatar member={member} size="h-24 w-24 text-4xl" />
        </div>
      }
      badge={`${need.emoji} ${need.label}`}
      onClose={onClose}
    >
      <p className="flex items-center gap-1.5 text-xs font-bold text-ink/60">
        <BadgeChip badge={member.badge} />
        {member.industry}
        {member.jobTitle && <span>・{member.jobTitle}</span>}
      </p>
      <h2 className="font-display text-xl leading-snug">
        {member.name}
        <span className="ml-1 text-sm">さん</span>
      </h2>
      <p className="mt-0.5 text-sm font-bold">{member.company}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {member.needs.map((n) => (
          <NeedTag key={n} id={n} />
        ))}
      </div>
      {member.description && <p className="mt-4 whitespace-pre-line text-sm font-medium leading-relaxed">{member.description}</p>}

      {member.services?.length > 0 && (
        <div className="mt-4 rounded-2xl bg-brand/40 p-3">
          <p className="text-xs font-black">こんな相談・依頼ができます</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {member.services.map((s) => (
              <li key={s} className="rounded-full bg-paper px-2.5 py-1 text-xs font-bold">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {member.address && (
        <p className="mt-4 flex gap-2 text-sm font-medium">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {member.address}
            {distance !== undefined && <span className="ml-2 font-bold text-shusei">{formatDistance(distance)}</span>}
          </span>
        </p>
      )}

      {member.linkedStores.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-black">運営しているお店</p>
          {member.linkedStores.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onOpenStore(s)}
              className="flex w-full items-center gap-2 rounded-xl border-2 border-ink px-3 py-2 text-left text-sm font-bold hover:bg-brand"
            >
              <Store className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{s.name}</span>
              <span className="text-xs text-shusei">お店を見る →</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {member.phoneNumber && (
          <ActionLink href={`tel:${member.phoneNumber}`} icon={<Phone className="h-4 w-4" />}>
            電話する
          </ActionLink>
        )}
        {member.url && (
          <ActionLink href={member.url} icon={<Globe className="h-4 w-4" />} dark external>
            ホームページ
          </ActionLink>
        )}
        <button
          type="button"
          onClick={onShare}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 border-ink py-3 text-sm font-black ${
            member.phoneNumber && member.url ? 'col-span-2' : member.phoneNumber || member.url ? '' : 'col-span-2'
          }`}
        >
          <Share2 className="h-4 w-4" />
          {shared ? 'リンクをコピーしました' : '知り合いに紹介する'}
        </button>
      </div>

      <p className="mt-4 flex gap-2 rounded-xl bg-ink/5 p-3 text-xs font-medium leading-relaxed">
        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          相談するときは例会で声をかけるか、紹介者を通して「守成クラブ都城MAPを見ました」と伝えてください。会員同士のご縁がつながります。
        </span>
      </p>
    </DetailShell>
  )
}

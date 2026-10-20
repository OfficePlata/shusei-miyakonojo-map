import { X, Printer, Check } from 'lucide-react'

export const Chip = ({ active, onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`shrink-0 rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold transition-colors ${
      active ? 'bg-ink text-brand' : 'bg-paper text-ink hover:bg-brand'
    } ${className}`}
  >
    {children}
  </button>
)

// 詳細パネルの「印刷リストに追加」
export const PrintToggle = ({ active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-ink py-2 text-sm font-black ${
      active ? 'bg-ink text-brand' : 'bg-paper text-ink hover:bg-brand'
    }`}
  >
    {active ? <Check className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
    {active ? '印刷リストに追加済み（押すと外す）' : '印刷リストに追加'}
  </button>
)

// 大きなシーン／困りごとボタン（ヘッダーの横スクロール）
export const EntryButton = ({ active, onClick, emoji, label, sub, count }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 border-ink px-3 py-2 text-left transition ${
      active ? 'bg-ink text-paper shadow-[3px_3px_0_#FFD600]' : 'bg-paper text-ink hover:-translate-y-0.5'
    } ${count === 0 && !active ? 'opacity-60' : ''}`}
  >
    <span className="text-2xl">{emoji}</span>
    <span>
      <span className="block text-sm font-black leading-tight">
        {label}
        <span className={`ml-1 text-xs ${active ? 'text-brand' : 'text-shusei'}`}>{count}</span>
      </span>
      <span className={`block text-[11px] font-medium ${active ? 'text-paper/80' : 'text-ink/60'}`}>{sub}</span>
    </span>
  </button>
)

// 詳細パネルの外枠（上部のビジュアル＋閉じるボタン＋本文）
export const DetailShell = ({ color, visual, badge, onClose, children }) => (
  <div className="flex max-h-full flex-col overflow-hidden rounded-t-3xl bg-paper shadow-2xl md:rounded-3xl">
    <div className="relative h-36 shrink-0" style={{ background: color }}>
      {visual}
      <button
        type="button"
        onClick={onClose}
        aria-label="閉じる"
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-paper text-ink shadow"
      >
        <X className="h-5 w-5" />
      </button>
      {badge && (
        <span className="absolute bottom-3 left-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-brand">{badge}</span>
      )}
    </div>
    <div className="overflow-y-auto p-5">{children}</div>
  </div>
)

export const ActionLink = ({ href, icon, children, dark = false, external = false }) => (
  <a
    href={href}
    {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black ${
      dark ? 'bg-ink text-brand' : 'bg-shusei text-paper'
    }`}
  >
    {icon}
    {children}
  </a>
)

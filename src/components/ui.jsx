import React, { useState } from 'react'
import { X, Search, ChevronDown, Inbox } from 'lucide-react'

// ── Cards ────────────────────────────────────────────────────────────────────
export function Card({ className = '', children, ...rest }) {
  return <div className={`card ${className}`} {...rest}>{children}</div>
}

export function CardHeader({ title, sub, right, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-3 px-5 pt-4 pb-3 ${className}`}>
      <div>
        <h3 className="font-semibold text-[15px] text-ink">{title}</h3>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

// ── Badges & chips ───────────────────────────────────────────────────────────
const TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  navy: 'bg-navy-50 text-navy-700 border-navy-200',
  lime: 'bg-lime-50 text-lime-700 border-lime-200'
}
export function Badge({ tone = 'slate', children, className = '' }) {
  return <span className={`chip ${TONES[tone] || TONES.slate} ${className}`}>{children}</span>
}

export const STATUS_TONES = {
  placed: 'emerald', self_employed: 'violet', apprentice: 'sky', higher_ed: 'indigo',
  unemployed: 'amber', not_placed: 'orange', dropped_out: 'rose', re_engaged: 'blue',
  in_training: 'teal', not_tracked: 'slate'
}
export function OutcomeBadge({ status }) {
  return <Badge tone={STATUS_TONES[status?.key] || 'slate'}>{status?.label || '—'}</Badge>
}

export const VER_TONES = {
  verified: 'emerald', pending: 'amber', partially_verified: 'sky', rejected: 'rose', employer_unreachable: 'slate'
}
export const VER_LABELS = {
  verified: 'Verified', pending: 'Pending', partially_verified: 'Partially verified',
  rejected: 'Rejected', employer_unreachable: 'Employer unreachable'
}
export function VerificationBadge({ status }) {
  return <Badge tone={VER_TONES[status] || 'slate'}>{VER_LABELS[status] || status}</Badge>
}

export function ConsentBadge({ learner }) {
  const map = {
    active: { tone: 'emerald', label: 'Consent active' },
    revoked: { tone: 'rose', label: 'Consent revoked' },
    expired: { tone: 'amber', label: 'Consent expired' },
    missing: { tone: 'slate', label: 'No consent' }
  }
  const m = map[learner.consentStatus] || map.missing
  return <Badge tone={m.tone}>{m.label}</Badge>
}

// ── KPI stat card ────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, tone = 'navy', onClick }) {
  return (
    <Card className={`p-4 flex items-center gap-3.5 ${onClick ? 'cursor-pointer hover:border-navy-300' : ''}`} onClick={onClick}>
      {Icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${TONES[tone] || TONES.navy}`}>
          <Icon size={19} strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[22px] font-bold leading-tight text-ink">{value}</div>
        <div className="text-[12px] text-slate-500 font-medium truncate" title={label}>{label}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </Card>
  )
}

// ── Table helpers ────────────────────────────────────────────────────────────
export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto scroll-thin ${className}`}>
      <table className="w-full min-w-full border-collapse">{children}</table>
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, hint, action }) {
  return (
    <div className="py-12 flex flex-col items-center text-center px-6">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Icon size={22} className="text-slate-400" />
      </div>
      <p className="font-semibold text-slate-600">{title}</p>
      {hint && <p className="text-[13px] text-slate-400 mt-1 max-w-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, sub, children, wide = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 backdrop-blur-[2px] p-4 sm:p-8" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`card w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} my-auto`}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-ink">{title}</h3>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ── Form primitives ──────────────────────────────────────────────────────────
export function Field({ label, children, hint, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

export function Select({ options = [], value, onChange, placeholder = 'All', className = '', allowAll = true }) {
  return (
    <div className="relative">
      <select
        className={`input appearance-none pr-8 ${className}`}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {allowAll && <option value="all">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  )
}

export function TextInput({ value, onChange, placeholder, type = 'text', className = '' }) {
  return <input type={type} className={`input ${className}`} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input className="input pl-9" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

// ── Progress / meters ────────────────────────────────────────────────────────
export function ProgressBar({ value, tone = 'bg-navy-600', className = '', height = 'h-2' }) {
  return (
    <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height} ${className}`}>
      <div className={`${height} ${tone} rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

// ── Banner ───────────────────────────────────────────────────────────────────
export function Banner({ tone = 'info', title, children, icon: Icon }) {
  const tones = {
    info: 'bg-navy-50 border-navy-200 text-navy-800',
    warn: 'bg-amber-50 border-amber-300 text-amber-800',
    danger: 'bg-rose-50 border-rose-300 text-rose-800',
    success: 'bg-emerald-50 border-emerald-300 text-emerald-800'
  }
  return (
    <div className={`rounded-lg border px-4 py-3 flex gap-3 items-start text-[13px] ${tones[tone]}`}>
      {Icon && <Icon size={17} className="mt-0.5 shrink-0" />}
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-slate-200 -mt-2 mb-4 overflow-x-auto scroll-thin">
      {tabs.map(t => (
        <button key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3.5 py-2 text-[13.5px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${active === t.id ? 'border-navy-700 text-navy-800' : 'border-transparent text-slate-500 hover:text-navy-700'}`}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 text-[11px] text-slate-400">({t.count})</span>}
        </button>
      ))}
    </div>
  )
}

export function Avatar({ name, size = 'md' }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const s = size === 'sm' ? 'w-7 h-7 text-[10.5px]' : 'w-9 h-9 text-xs'
  const palette = ['bg-navy-100 text-navy-700', 'bg-emerald-100 text-emerald-700', 'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700', 'bg-sky-100 text-sky-700', 'bg-rose-100 text-rose-700']
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length
  return <div className={`${s} rounded-full flex items-center justify-center font-bold shrink-0 ${palette[idx]}`}>{initials}</div>
}

export function KV({ label, children, masked = false }) {
  return (
    <div className="py-1.5">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className={`text-[13.5px] text-ink mt-0.5 ${masked ? 'text-slate-400 italic' : ''}`}>{children}</div>
    </div>
  )
}

export function Stepper({ steps, current }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-1.5 text-[12.5px] font-semibold ${i <= current ? 'text-navy-800' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] border ${i < current ? 'bg-navy-700 text-white border-navy-700' : i === current ? 'border-navy-700 text-navy-800' : 'border-slate-300'}`}>{i < current ? '✓' : i + 1}</span>
            {s}
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-px ${i < current ? 'bg-navy-700' : 'bg-slate-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState(null)
  const show = (text) => { setToast(text); setTimeout(() => setToast(null), 2600) }
  const node = toast ? (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] bg-ink text-white text-[13px] px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{toast}
    </div>
  ) : null
  return { show, node }
}

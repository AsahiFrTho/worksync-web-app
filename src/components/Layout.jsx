import React, { useMemo, useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, PhoneCall, BadgeCheck, Puzzle, BarChart3,
  Building2, ShieldCheck, Settings as SettingsIcon, Search, Menu, X, LogOut, RefreshCw, ChevronDown
} from 'lucide-react'
import { useStore, ROLE_META } from '../data/store'
import { displayName } from '../data/compute'
import { Avatar } from './ui'

const NAV = [
  { section: 'Overview', items: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analytics', label: 'Analytics & Impact', icon: BarChart3 }
  ]},
  { section: 'Learners', items: [
    { to: '/learners', label: 'Learners', icon: Users },
    { to: '/followups', label: 'Follow-ups', icon: PhoneCall }
  ]},
  { section: 'Verification', items: [
    { to: '/verification', label: 'Employer Verification', icon: BadgeCheck },
    { to: '/skillgaps', label: 'Skill Gaps', icon: Puzzle }
  ]},
  { section: 'Accountability', items: [
    { to: '/scorecard', label: 'Provider Scorecard', icon: Building2 },
    { to: '/dataquality', label: 'Data Quality', icon: ShieldCheck }
  ]},
  { section: '', items: [
    { to: '/settings', label: 'Settings', icon: SettingsIcon }
  ]}
]

function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5 px-4 h-14 shrink-0">
      <div className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center shrink-0">
        <svg width="18" height="18" viewBox="0 0 32 32"><path d="M16 5l3.4 6.9 7.6 1.1-5.5 5.3 1.3 7.6L16 22.3l-6.8 3.6 1.3-7.6L5 13l7.6-1.1z" fill="#f4b41a"/></svg>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-extrabold text-[15px] text-navy-900 tracking-tight">KaushalSetu</div>
          <div className="text-[10.5px] text-slate-400 font-medium">कौशल सेतु · Skill Bridge</div>
        </div>
      )}
    </div>
  )
}

function GlobalSearch() {
  const db = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const boxRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const results = useMemo(() => {
    if (!q.trim()) return []
    const t = q.toLowerCase()
    return db.learners.filter(l =>
      l.name.toLowerCase().includes(t) || l.uniqueLearnerId.toLowerCase().includes(t)
    ).slice(0, 6)
  }, [q, db.learners])

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className="input pl-9 bg-slate-50"
        placeholder="Search learner by name or ID…"
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && q && (
        <div className="absolute top-full mt-1.5 w-full card py-1.5 z-40 max-h-80 overflow-y-auto scroll-thin">
          {results.length === 0 && <p className="px-4 py-3 text-[13px] text-slate-400">No learners match “{q}”.</p>}
          {results.map(l => (
            <button key={l.id}
              className="w-full text-left px-3.5 py-2 hover:bg-navy-50 flex items-center gap-2.5"
              onClick={() => { nav(`/learners/${l.id}`); setQ(''); setOpen(false) }}>
              <Avatar name={displayName(l)} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-ink truncate">{displayName(l)}</div>
                <div className="text-[11px] text-slate-400">{l.uniqueLearnerId} · {l.district}</div>
              </div>
              {l.consentStatus !== 'active' && <span className="text-[10px] text-slate-400 italic">masked</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function RoleSwitcher() {
  const { role, setRole } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  if (!role) return null
  const meta = ROLE_META[role]
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white pl-1.5 pr-2.5 py-1.5 hover:border-navy-300">
        <Avatar name={meta.user} size="sm" />
        <div className="text-left leading-tight hidden sm:block">
          <div className="text-[12.5px] font-semibold text-ink">{meta.short}</div>
          <div className="text-[10.5px] text-slate-400">{meta.user}</div>
        </div>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-72 card p-1.5 z-40">
          <p className="px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Switch demo role</p>
          {Object.entries(ROLE_META).map(([key, m]) => (
            <button key={key}
              onClick={() => { setRole(key); setOpen(false) }}
              className={`w-full text-left px-2.5 py-2 rounded-lg flex gap-2.5 items-start ${key === role ? 'bg-navy-50' : 'hover:bg-slate-50'}`}>
              <Avatar name={m.user} size="sm" />
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold text-ink">{m.label}</div>
                <div className="text-[11px] text-slate-400">{m.user} · {m.org}</div>
              </div>
              {key === role && <span className="ml-auto text-navy-700 text-xs font-bold">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { role, logout, settings, resetData } = useStore()
  const nav = useNavigate()

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-60 bg-white border-r border-slate-200 z-40 flex flex-col transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <Logo />
          <button className="lg:hidden p-2 mr-2 text-slate-400" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto scroll-thin pb-4">
          {NAV.map((g, i) => (
            <div key={i} className="mb-1">
              {g.section && <p className="px-4 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{g.section}</p>}
              {g.items.map(item => (
                <NavLink key={item.to} to={item.to}
                  className={({ isActive }) => `flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-lg text-[13.5px] font-medium ${isActive ? 'bg-navy-50 text-navy-800' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'}`}>
                  <item.icon size={16.5} strokeWidth={2} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button onClick={() => { if (confirm('Reset all demo data to the original sample dataset?')) { resetData() } }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12.5px] text-slate-500 hover:bg-slate-50">
            <RefreshCw size={14} /> Reset demo data
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 bg-ink/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 h-14 flex items-center gap-3 px-4 lg:px-6">
          <button className="lg:hidden p-1.5 text-slate-500" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2.5">
            <span className="hidden md:inline text-[11px] text-slate-400 font-medium">{settings.programName}</span>
            <RoleSwitcher />
            <button onClick={() => { logout(); nav('/') }} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 max-w-[1500px] w-full mx-auto">
          <Outlet />
        </main>
        <footer className="px-6 py-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-200 bg-white/60">
          <span>KaushalSetu · demo build for skilling ecosystem · consent-first learner tracking</span>
          <span className="hidden sm:inline">Data is sample data, stored locally in your browser</span>
        </footer>
      </div>
    </div>
  )
}

import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Plus, PhoneCall, ShieldCheck, Lock, UserCheck, ArrowUpDown } from 'lucide-react'
import { useStore } from '../data/store'
import {
  employmentStatus, enrollmentFor, consentActive, displayName, followUpsFor, verificationsFor,
  fmtDate, daysBetween, todayStr, STATUS_LABELS, providerOf, courseOf
} from '../data/compute'
import { Card, Table, Badge, OutcomeBadge, ConsentBadge, VerificationBadge, SearchInput, Select, EmptyState, useToast, Avatar } from '../components/ui'
import AddOutcomeModal from '../components/AddOutcomeModal'
import { ConsentModal, FollowUpScheduleModal } from '../components/LearnerModals'

export function nextFollowUp(db, learnerId) {
  const fus = followUpsFor(db, learnerId).filter(f => f.status === 'scheduled')
  return fus.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] || null
}
export function lastContact(db, learnerId) {
  const done = followUpsFor(db, learnerId).filter(f => f.status === 'completed').map(f => f.completedAt || f.dueDate)
  const learner = db.learners.find(l => l.id === learnerId)
  return [learner?.updatedAt, ...done].filter(Boolean).sort().pop()
}

export default function Learners() {
  const db = useStore()
  const nav = useNavigate()
  const { addFollowUp } = useStore()
  const { show, node } = useToast()
  const [search, setSearch] = useState('')
  const [consentFilter, setConsentFilter] = useState('all')
  const [sortKey, setSortKey] = useState('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [outcomeModal, setOutcomeModal] = useState(null)
  const [consentModal, setConsentModal] = useState(null)
  const [fuModal, setFuModal] = useState(null)

  const rows = useMemo(() => {
    const t = search.toLowerCase()
    let list = db.learners.filter(l =>
      (!t || l.name.toLowerCase().includes(t) || l.uniqueLearnerId.toLowerCase().includes(t)) &&
      (consentFilter === 'all' || l.consentStatus === consentFilter)
    )
    const val = (l) => {
      switch (sortKey) {
        case 'name': return displayName(l)
        case 'course': return courseOf(db, l.id)?.name || ''
        case 'provider': return providerOf(db, l.id)?.name || ''
        case 'district': return l.district
        case 'outcome': return employmentStatus(db, l.id).label
        case 'contact': return lastContact(db, l.id) || ''
        case 'followup': return nextFollowUp(db, l.id)?.dueDate || '9999'
        default: return l.uniqueLearnerId
      }
    }
    return [...list].sort((a, b) => {
      const va = val(a), vb = val(b)
      const c = String(va).localeCompare(String(vb), undefined, { numeric: true })
      return sortAsc ? c : -c
    })
  }, [db, search, consentFilter, sortKey, sortAsc])

  const markContacted = (l) => {
    addFollowUp({ learnerId: l.id, dueDate: todayStr(), status: 'completed', completedAt: todayStr(), channel: 'Call', reason: 'Quick contact logged', contactAttemptCount: 1 })
    show(`${displayName(l)} marked as contacted today`)
  }

  const th = (key, label, className = '') => (
    <th className={`th ${className} cursor-pointer hover:text-navy-700 select-none`} onClick={() => { if (sortKey === key) setSortAsc(!sortAsc); else { setSortKey(key); setSortAsc(true) } }}>
      {label} {sortKey === key && <ArrowUpDown size={11} className="inline text-navy-600" />}
    </th>
  )

  return (
    <div>
      {node}
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Learners</h1>
          <p className="text-[13px] text-slate-500">{rows.length} learners · consent-first records · click a row to open the full profile</p>
        </div>
        <div className="flex gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name or ID…" className="w-64" />
          <Select value={consentFilter} onChange={setConsentFilter} placeholder="All consent"
            options={['active', 'expired', 'revoked', 'missing'].map(s => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
        </div>
      </div>

      <Card>
        <Table className="min-w-[1150px]">
          <thead>
            <tr>
              {th('id', 'Learner ID')}
              {th('name', 'Name')}
              <th className="th">Consent</th>
              {th('course', 'Course')}
              {th('provider', 'Provider')}
              {th('district', 'District')}
              <th className="th">Batch</th>
              {th('outcome', 'Latest outcome')}
              <th className="th">Last contact</th>
              {th('followup', 'Next follow-up')}
              <th className="th">Verification</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(l => {
              const st = employmentStatus(db, l.id)
              const e = enrollmentFor(db, l.id)
              const nf = nextFollowUp(db, l.id)
              const lc = lastContact(db, l.id)
              const vers = verificationsFor(db, l.id)
              const latestVer = [...vers].sort((a, b) => (b.verifiedAt || b.startDate || '').localeCompare(a.verifiedAt || a.startDate || ''))[0]
              const masked = !consentActive(l)
              const overdue = nf && nf.dueDate < todayStr()
              return (
                <tr key={l.id} className="hover:bg-navy-50/40 cursor-pointer group" onClick={ev => { if (!ev.target.closest('button')) nav(`/learners/${l.id}`) }}>
                  <td className="td font-medium text-navy-800">{l.uniqueLearnerId}</td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      {!masked && <Avatar name={l.name} size="sm" />}
                      <div>
                        <div className="font-medium text-ink flex items-center gap-1">
                          {displayName(l)}
                          {masked && <Lock size={11} className="text-slate-400" />}
                        </div>
                        <div className="text-[11px] text-slate-400">{l.gender} · {l.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td"><ConsentBadge learner={l} /></td>
                  <td className="td">{courseOf(db, l.id)?.name || '—'}</td>
                  <td className="td text-[13px]">{providerOf(db, l.id)?.name || '—'}</td>
                  <td className="td">{l.district}</td>
                  <td className="td text-[12.5px] font-mono">{e?.batchName || '—'}</td>
                  <td className="td"><OutcomeBadge status={st} /></td>
                  <td className="td text-[13px]">{lc ? fmtDate(lc) : '—'}</td>
                  <td className="td text-[13px]">
                    {nf ? (
                      <span className={overdue ? 'text-rose-600 font-medium' : 'text-slate-600'}>
                        {fmtDate(nf.dueDate)}{overdue && ' · overdue'}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="td">{latestVer ? <VerificationBadge status={latestVer.verificationStatus} /> : <span className="text-slate-300 text-[12px]">Not needed</span>}</td>
                  <td className="td text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <div className="inline-flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconBtn title="View profile" onClick={() => nav(`/learners/${l.id}`)}><Eye size={14} /></IconBtn>
                      <IconBtn title="Add outcome" onClick={() => setOutcomeModal(l)}><Plus size={14} /></IconBtn>
                      <IconBtn title="Schedule follow-up" onClick={() => setFuModal(l)}><PhoneCall size={14} /></IconBtn>
                      <IconBtn title="Update consent" onClick={() => setConsentModal(l)}><ShieldCheck size={14} /></IconBtn>
                      <IconBtn title="Mark as contacted" onClick={() => markContacted(l)}><UserCheck size={14} /></IconBtn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        {!rows.length && <EmptyState title="No learners match your search" hint="Try a different name or learner ID, or clear the consent filter." />}
      </Card>

      <AddOutcomeModal open={!!outcomeModal} onClose={() => setOutcomeModal(null)} learner={outcomeModal} />
      {consentModal && <ConsentModal open={!!consentModal} onClose={() => setConsentModal(null)} learner={consentModal} />}
      {fuModal && <FollowUpScheduleModal open={!!fuModal} onClose={() => setFuModal(null)} learner={fuModal} />}
    </div>
  )
}

function IconBtn({ children, title, onClick }) {
  return <button title={title} onClick={onClick} className="p-1.5 rounded-md text-slate-400 hover:text-navy-700 hover:bg-navy-50">{children}</button>
}

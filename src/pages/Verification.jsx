import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, XCircle, FileSearch, Flag, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { useStore, ROLE_META } from '../data/store'
import { displayName, consentActive, fmtDate, fmtMoney } from '../data/compute'
import { VERIFICATION_METHODS } from '../data/seed'
import { Card, Badge, VerificationBadge, Tabs, Modal, Field, Select, TextInput, ProgressBar, EmptyState, useToast } from '../components/ui'

function ActionModal({ record, mode, onClose }) {
  const db = useStore()
  const { verifyEmployer, requestEvidence, flagEmployer } = useStore()
  const { show, node } = useToast()
  const [method, setMethod] = useState(record?.verificationMethod || VERIFICATION_METHODS[0])
  const [remarks, setRemarks] = useState(record?.verifierRemarks || '')
  const [confidence, setConfidence] = useState(record?.confidenceScore || 90)

  if (!record) return null
  const learner = db.learners.find(l => l.id === record.learnerId)

  const submit = () => {
    if (mode === 'approve') {
      verifyEmployer(record.id, { status: 'verified', method, remarks, confidence })
      show(`Approved — ${record.employerName} verified`)
    } else if (mode === 'reject') {
      verifyEmployer(record.id, { status: 'rejected', method, remarks, confidence: 20 })
      show(`Rejected — outcome marked unverifiable`)
    } else if (mode === 'evidence') {
      requestEvidence(record.id, remarks)
      show('Evidence requested from provider')
    } else if (mode === 'flag') {
      flagEmployer(record.id, !record.flagged)
      show(record.flagged ? 'Flag removed' : 'Marked as duplicate / suspicious')
    }
    onClose()
  }

  const titles = {
    approve: ['Approve employer record', 'Confirm employment details are genuine'],
    reject: ['Reject employer record', 'Record the reason so providers can fix the source data'],
    evidence: ['Request more evidence', 'Ask the linked provider for documents'],
    flag: [record.flagged ? 'Remove flag' : 'Flag as duplicate / suspicious', 'Flags surface patterns across fake or duplicated employers']
  }

  return (
    <Modal open onClose={onClose} title={titles[mode][0]} sub={`${record.employerName} · ${learner ? displayName(learner) : ''} · ${fmtMoney(record.wage)}/mo`}>
      {node}
      <div className="grid sm:grid-cols-2 gap-3">
        {mode !== 'flag' && (
          <Field label="Verification method">
            <Select allowAll={false} value={method} onChange={setMethod}
              options={VERIFICATION_METHODS.map(m => ({ value: m, label: m }))} />
          </Field>
        )}
        {mode === 'approve' && (
          <Field label="Confidence score" hint="0–100, how sure are you?">
            <TextInput type="number" value={confidence} onChange={setConfidence} />
          </Field>
        )}
        {(mode !== 'flag') && (
          <Field label="Verifier remarks" className="sm:col-span-2">
            <textarea className="input min-h-[70px]" value={remarks} onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. HR confirmed role and wage on call; offer letter on file." />
          </Field>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className={mode === 'approve' ? 'btn-primary' : mode === 'reject' ? 'btn bg-rose-600 text-white hover:bg-rose-500' : 'btn-primary'} onClick={submit}>
          {mode === 'approve' && <CheckCircle2 size={14} />}
          {mode === 'reject' && <XCircle size={14} />}
          {titles[mode][0]}
        </button>
      </div>
    </Modal>
  )
}

export default function Verification() {
  const db = useStore()
  const [tab, setTab] = useState('pending')
  const [action, setAction] = useState(null) // {record, mode}

  const grouped = useMemo(() => {
    const g = { pending: [], partially_verified: [], employer_unreachable: [], verified: [], rejected: [] }
    db.employerVerifications.forEach(v => (g[v.verificationStatus] || g.pending).push(v))
    Object.values(g).forEach(a => a.sort((x, y) => (y.startDate || '').localeCompare(x.startDate || '')))
    return g
  }, [db.employerVerifications])

  const tabs = [
    { id: 'pending', label: 'Pending', count: grouped.pending.length },
    { id: 'partially_verified', label: 'Partially verified', count: grouped.partially_verified.length },
    { id: 'employer_unreachable', label: 'Unreachable', count: grouped.employer_unreachable.length },
    { id: 'verified', label: 'Verified', count: grouped.verified.length },
    { id: 'rejected', label: 'Rejected', count: grouped.rejected.length }
  ]
  const list = grouped[tab] || []
  const flaggedCount = db.employerVerifications.filter(v => v.flagged).length

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Employer Verification</h1>
          <p className="text-[13px] text-slate-500">
            {grouped.pending.length + grouped.partially_verified.length} records awaiting action · verified placements feed the “verified placement rate” metric
          </p>
        </div>
        {flaggedCount > 0 && (
          <Badge tone="rose"><ShieldAlert size={12} /> {flaggedCount} flagged as duplicate / suspicious</Badge>
        )}
      </div>

      <Card>
        <div className="px-5 pt-4">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr>
                <th className="th">Employer</th>
                <th className="th">Learner</th>
                <th className="th">Job role</th>
                <th className="th">Start date</th>
                <th className="th">Wage</th>
                <th className="th">Status</th>
                <th className="th">Method</th>
                <th className="th">Confidence</th>
                <th className="th">Verifier remarks</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(v => {
                const learner = db.learners.find(l => l.id === v.learnerId)
                return (
                  <tr key={v.id} className={`hover:bg-navy-50/40 ${v.flagged ? 'bg-rose-50/50' : ''}`}>
                    <td className="td font-medium text-ink">
                      {v.employerName}
                      {v.flagged && <Badge tone="rose" className="ml-1.5">flagged</Badge>}
                    </td>
                    <td className="td">
                      <Link to={`/learners/${v.learnerId}`} className="text-navy-700 hover:underline font-medium">
                        {learner ? displayName(learner) : '—'}
                      </Link>
                      {!consentActive(learner) && <span className="ml-1 text-[10px] text-slate-400 italic">(masked)</span>}
                    </td>
                    <td className="td">{v.jobRole || '—'}</td>
                    <td className="td text-[13px]">{fmtDate(v.startDate)}</td>
                    <td className="td font-medium">{fmtMoney(v.wage)}</td>
                    <td className="td"><VerificationBadge status={v.verificationStatus} /></td>
                    <td className="td text-[13px]">{v.verificationMethod || '—'}</td>
                    <td className="td w-32">
                      {v.confidenceScore !== null && v.confidenceScore !== undefined ? (
                        <div>
                          <span className="text-[12.5px] font-semibold">{v.confidenceScore}%</span>
                          <ProgressBar value={v.confidenceScore} height="h-1.5" className="mt-1"
                            tone={v.confidenceScore >= 80 ? 'bg-emerald-500' : v.confidenceScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'} />
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="td text-[12px] text-slate-500 max-w-[220px]">
                      {v.verifierRemarks || '—'}
                      {v.verifiedBy && <div className="text-[10.5px] text-slate-400 mt-0.5">by {v.verifiedBy} · {fmtDate(v.verifiedAt)}</div>}
                    </td>
                    <td className="td text-right whitespace-nowrap">
                      {['pending', 'partially_verified', 'employer_unreachable'].includes(v.verificationStatus) ? (
                        <div className="inline-flex gap-1">
                          <button className="btn-primary btn-sm" onClick={() => setAction({ record: v, mode: 'approve' })}><BadgeCheck size={13} /> Approve</button>
                          <button className="btn bg-rose-600 text-white hover:bg-rose-500 btn-sm" onClick={() => setAction({ record: v, mode: 'reject' })}>Reject</button>
                          <button className="btn-secondary btn-sm" title="Request more evidence" onClick={() => setAction({ record: v, mode: 'evidence' })}><FileSearch size={13} /></button>
                          <button className="btn-secondary btn-sm" title="Flag duplicate / suspicious" onClick={() => setAction({ record: v, mode: 'flag' })}><Flag size={13} /></button>
                        </div>
                      ) : (
                        <div className="inline-flex gap-1">
                          <button className="btn-secondary btn-sm" onClick={() => setAction({ record: v, mode: 'evidence' })}>Re-open</button>
                          <button className="btn-secondary btn-sm" title="Flag duplicate / suspicious" onClick={() => setAction({ record: v, mode: 'flag' })}><Flag size={13} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!list.length && <EmptyState icon={BadgeCheck} title="Nothing here" hint="Records move between tabs as verifiers act on them." />}
      </Card>

      {action && <ActionModal record={action.record} mode={action.mode} onClose={() => setAction(null)} />}
    </div>
  )
}

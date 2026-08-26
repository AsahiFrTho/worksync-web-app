import React, { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Plus, PhoneCall, ShieldCheck, ShieldAlert, Lock, MapPin, Phone, Mail,
  StickyNote, BadgeCheck, Clock
} from 'lucide-react'
import { useStore } from '../data/store'
import {
  employmentStatus, enrollmentFor, providerOf, courseOf, eventsFor, followUpsFor, verificationsFor,
  skillGapsFor, learnerTimeline, consentActive, displayName, fmtDate, fmtMoney, currentMonthlyIncome,
  STATUS_LABELS, todayStr, daysBetween
} from '../data/compute'
import { Card, CardHeader, Badge, OutcomeBadge, ConsentBadge, VerificationBadge, KV, Banner, Modal, Field, TextInput, Avatar } from '../components/ui'
import AddOutcomeModal from '../components/AddOutcomeModal'
import { ConsentModal, FollowUpScheduleModal } from '../components/LearnerModals'

export default function LearnerProfile() {
  const { id } = useParams()
  const db = useStore()
  const { addLearnerNote, updateLearnerContact } = useStore()
  const [outcomeOpen, setOutcomeOpen] = useState(false)
  const [fuOpen, setFuOpen] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  const learner = db.learners.find(l => l.id === id)
  if (!learner) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">Learner not found.</p>
        <Link to="/learners" className="btn-primary mt-4 inline-flex">Back to learners</Link>
      </Card>
    )
  }

  const masked = !consentActive(learner)
  const st = employmentStatus(db, learner.id)
  const e = enrollmentFor(db, learner.id)
  const timeline = useMemo(() => learnerTimeline(db, learner.id), [db, learner.id])
  const evts = eventsFor(db, learner.id)
  const fus = followUpsFor(db, learner.id)
  const vers = verificationsFor(db, learner.id)
  const gaps = skillGapsFor(db, learner.id)
  const employmentHistory = evts.filter(o => ['wage_employment', 'job_change', 'self_employment', 'apprenticeship', 'wage_update'].includes(o.outcomeType))
  const reasonEvents = evts.filter(o => o.reasonCode)
  const income = currentMonthlyIncome(db, learner.id)

  return (
    <div>
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {!masked && <Avatar name={learner.name} />}
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              {displayName(learner)}
              {masked && <Lock size={15} className="text-slate-400" />}
            </h1>
            <p className="text-[13px] text-slate-500">
              {learner.uniqueLearnerId} · {courseOf(db, learner.id)?.name} · {providerOf(db, learner.id)?.name}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <OutcomeBadge status={st} />
              <ConsentBadge learner={learner} />
              <Badge tone="slate">{learner.district}{learner.block ? ` · ${learner.block}` : ''}</Badge>
              {income !== null && <Badge tone="lime">{fmtMoney(income)}/month</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => setOutcomeOpen(true)}><Plus size={14} /> Add outcome</button>
          <button className="btn-secondary" onClick={() => setFuOpen(true)}><PhoneCall size={14} /> Follow-up</button>
          <button className="btn-secondary" onClick={() => setConsentOpen(true)}><ShieldCheck size={14} /> Consent</button>
        </div>
      </div>

      {masked && (
        <div className="mb-4">
          <Banner tone={learner.consentStatus === 'revoked' ? 'danger' : 'warn'} icon={ShieldAlert}
            title={`Privacy protection active — consent is ${learner.consentStatus}`}>
            Personal details (name, phone, email, exact location) are hidden for this learner.
            {learner.consentStatus === 'revoked' ? ' The learner has opted out of direct contact.' :
              learner.consentStatus === 'expired' ? ' Renew consent to resume full tracking.' :
                ' Collect consent during the next field visit or call.'}
            {learner.consentStatus !== 'revoked' && <button className="underline font-semibold ml-1" onClick={() => setConsentOpen(true)}>Update consent →</button>}
          </Banner>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-4">
        {/* timeline (main) */}
        <Card className="lg:col-span-3">
          <CardHeader title="Learner timeline" sub={`${timeline.length} events · enrolment → training → placement → follow-ups`} />
          <div className="px-5 pb-5 max-h-[640px] overflow-y-auto scroll-thin">
            {timeline.length === 0 && <p className="text-[13px] text-slate-400">No events yet.</p>}
            <div className="relative">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-3 relative pb-5 last:pb-0">
                  {i < timeline.length - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200" />}
                  <div className={`w-8 h-8 rounded-full ${t.color} text-white flex items-center justify-center text-[14px] shrink-0 ring-4 ring-slate-50 z-10`}>{t.icon}</div>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-semibold text-[13.5px] text-ink">{t.title}</span>
                      <span className="text-[11.5px] text-slate-400 font-medium">{fmtDate(t.date)}</span>
                      {t.date > todayStr() && <Badge tone="sky">scheduled</Badge>}
                    </div>
                    {t.desc && <p className="text-[12.5px] text-slate-500 mt-0.5 leading-snug">{t.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* right column */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader title="Basic profile" right={
              <button className="text-[12px] font-medium text-navy-700 hover:underline" onClick={() => setContactOpen(true)}>Edit contact</button>
            } />
            <div className="px-5 pb-4 grid grid-cols-2 gap-x-4">
              <KV label="Phone" masked={masked}>{masked ? 'Hidden — no consent' : `+91 ${learner.phone}`}</KV>
              <KV label="Alternate phone" masked={masked}>{masked ? '—' : (learner.alternatePhone ? `+91 ${learner.alternatePhone}` : '—')}</KV>
              <KV label="Email" masked={masked}>{masked ? '—' : learner.email}</KV>
              <KV label="District / Block" masked={masked && true}>{learner.district}{learner.block ? ' · ' + learner.block : ''}</KV>
              <KV label="Gender">{learner.gender}</KV>
              <KV label="Category">{learner.category}</KV>
              <KV label="Record updated">{fmtDate(learner.updatedAt)} <span className="text-slate-400">({daysBetween(learner.updatedAt, todayStr())} days ago)</span></KV>
              <KV label="Status">{learner.status === 'in-training' ? 'In training' : 'Tracked'}</KV>
            </div>
            {learner.phoneNote && (
              <div className="mx-5 mb-4 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex gap-1.5 items-center">
                <Phone size={13} className="shrink-0" /> {learner.phoneNote}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Consent record" />
            <div className="px-5 pb-4 grid grid-cols-2 gap-x-4">
              <KV label="Status"><ConsentBadge learner={learner} /></KV>
              <KV label="Consent date">{learner.consentDate ? fmtDate(learner.consentDate) : '—'}</KV>
              <KV label="Method">{learner.consentMethod || '—'}</KV>
              <KV label="Last updated">{learner.consentLastUpdated ? fmtDate(learner.consentLastUpdated) : '—'}</KV>
              <KV label="Purposes" className="col-span-2">
                {learner.consentPurpose?.length
                  ? <span className="inline-flex flex-wrap gap-1 mt-1">{learner.consentPurpose.map(p => <Badge key={p} tone="emerald">{p}</Badge>)}</span>
                  : '—'}
              </KV>
            </div>
          </Card>

          <Card>
            <CardHeader title="Enrolment details" />
            <div className="px-5 pb-4 grid grid-cols-2 gap-x-4">
              <KV label="Batch"><span className="font-mono text-[12.5px]">{e?.batchName}</span></KV>
              <KV label="Enrolled">{fmtDate(e?.enrollmentDate)}</KV>
              <KV label="Training period">{fmtDate(e?.trainingStartDate)} → {fmtDate(e?.trainingEndDate)}</KV>
              <KV label="Assessment">{e?.assessmentStatus || '—'}</KV>
              <KV label="Certification">{e?.certificationStatus || '—'}</KV>
              <KV label="Sector">{courseOf(db, learner.id)?.sector}</KV>
            </div>
          </Card>

          <Card>
            <CardHeader title="Employment & income history" sub="Longitudinal record — not just latest placement" />
            <div className="pb-3">
              {employmentHistory.length === 0 && <p className="text-[13px] text-slate-400 px-5 pb-3">No employment records yet.</p>}
              {employmentHistory.map(o => (
                <div key={o.id} className="px-5 py-2.5 border-t border-slate-100 first:border-t-0 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-ink">
                      {o.employerName || o.selfEmploymentBusinessName || 'Wage update'}
                      {o.jobRole ? ` — ${o.jobRole}` : o.selfEmploymentNature ? ` — ${o.selfEmploymentNature}` : ''}
                    </div>
                    <div className="text-[11.5px] text-slate-400">
                      {fmtDate(o.eventDate)} · {o.outcomeType === 'wage_update' ? 'income revision' : o.employmentType || ''}
                      {o.relevanceToTraining && ` · relevance: ${o.relevanceToTraining}`}
                    </div>
                  </div>
                  <div className="text-[13px] font-semibold text-emerald-700 shrink-0">
                    {fmtMoney(o.monthlyWage || o.selfEmploymentIncome)}{o.monthlyWage || o.selfEmploymentIncome ? <span className="text-[10px] font-normal text-slate-400">/mo</span> : ''}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Verification status" right={<Link to="/verification" className="text-[12px] font-medium text-navy-700 hover:underline">Verify →</Link>} />
            <div className="pb-4">
              {vers.length === 0 && <p className="text-[13px] text-slate-400 px-5">No employer verification needed for current status.</p>}
              {vers.map(v => (
                <div key={v.id} className="px-5 py-2.5 border-t border-slate-100 first:border-t-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-ink">{v.employerName}</span>
                    <VerificationBadge status={v.verificationStatus} />
                  </div>
                  <div className="text-[11.5px] text-slate-400 mt-0.5">
                    {v.jobRole} · {fmtMoney(v.wage)}/mo
                    {v.confidenceScore && ` · confidence ${v.confidenceScore}%`}
                    {v.verifierRemarks && ` · “${v.verifierRemarks}”`}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Skill gaps & reason codes" />
            <div className="px-5 pb-4">
              {gaps.length ? (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {gaps.map(g => (
                    <Badge key={g.id} tone={g.severity === 'high' ? 'rose' : g.severity === 'medium' ? 'amber' : 'slate'}>
                      {g.skillName} · {g.reportedBy}
                    </Badge>
                  ))}
                </div>
              ) : <p className="text-[13px] text-slate-400">No skill gaps reported.</p>}
              {reasonEvents.length ? reasonEvents.map((r, i) => (
                <div key={i} className="text-[12.5px] text-slate-600 mt-2 flex gap-1.5">
                  <Badge tone="orange">{r.reasonCode}</Badge>
                  <span className="text-slate-400">{STATUS_LABELS[({ dropout: 'dropped_out', unemployed: 'unemployed', not_placed: 'not_placed' })[r.outcomeType]]?.label} · {fmtDate(r.eventDate)}</span>
                </div>
              )) : <p className="text-[12.5px] text-slate-400 mt-1">No non-placement reason codes.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Notes" right={
              <button className="text-[12px] font-medium text-navy-700 hover:underline" onClick={() => setNoteOpen(true)}>Add note</button>
            } />
            <div className="px-5 pb-4">
              {learner.notes ? learner.notes.split('\n').map((n, i) => n.trim() && (
                <p key={i} className="text-[13px] text-slate-600 leading-relaxed mb-1.5 flex gap-1.5"><StickyNote size={13} className="text-slate-300 shrink-0 mt-0.5" />{n}</p>
              )) : <p className="text-[13px] text-slate-400">No notes yet.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Contact history" sub={`${fus.length} follow-ups`} />
            <div className="pb-4">
              {fus.length === 0 && <p className="text-[13px] text-slate-400 px-5">No follow-ups yet.</p>}
              {fus.map(f => (
                <div key={f.id} className="px-5 py-2.5 border-t border-slate-100 first:border-t-0 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-medium text-ink flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-400" />{f.reason}
                    </div>
                    <div className="text-[11.5px] text-slate-400">{f.channel} · due {fmtDate(f.dueDate)}{f.contactAttemptCount ? ` · ${f.contactAttemptCount} attempt(s)` : ''}</div>
                  </div>
                  <Badge tone={f.status === 'completed' ? 'emerald' : f.dueDate < todayStr() ? 'rose' : 'amber'}>{f.status === 'completed' ? 'done' : f.dueDate < todayStr() ? 'overdue' : 'scheduled'}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* modals */}
      <AddOutcomeModal open={outcomeOpen} onClose={() => setOutcomeOpen(false)} learner={learner} />
      {fuOpen && <FollowUpScheduleModal open={fuOpen} onClose={() => setFuOpen(false)} learner={learner} />}
      {consentOpen && <ConsentModal open={consentOpen} onClose={() => setConsentOpen(false)} learner={learner} />}
      {noteOpen && <AddNoteModal open={noteOpen} onClose={() => setNoteOpen(false)} learner={learner} onSave={addLearnerNote} />}
      {contactOpen && <EditContactModal open={contactOpen} onClose={() => setContactOpen(false)} learner={learner} onSave={updateLearnerContact} />}
    </div>
  )
}

function AddNoteModal({ open, onClose, learner, onSave }) {
  const [note, setNote] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Add note" sub={learner.name}>
      <Field label="Note"><textarea className="input min-h-[90px]" value={note} onChange={e => setNote(e.target.value)} placeholder="Context that helps the next person who calls…" /></Field>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => { if (note.trim()) onSave(learner.id, note.trim()); onClose() }}>Save note</button>
      </div>
    </Modal>
  )
}

function EditContactModal({ open, onClose, learner, onSave }) {
  const [phone, setPhone] = useState(learner.phone)
  const [alt, setAlt] = useState(learner.alternatePhone || '')
  const [block, setBlock] = useState(learner.block || '')
  const [note, setNote] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Update contact & location" sub={learner.name}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Phone"><TextInput value={phone} onChange={setPhone} /></Field>
        <Field label="Alternate phone"><TextInput value={alt} onChange={setAlt} /></Field>
        <Field label="Block / area"><TextInput value={block} onChange={setBlock} /></Field>
        <Field label="Reason for change"><TextInput value={note} onChange={setNote} placeholder="e.g. learner relocated" /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => { onSave(learner.id, { phone, alternatePhone: alt, block, phoneNote: note || learner.phoneNote, locationChanged: !!note }); onClose() }}>Save</button>
      </div>
    </Modal>
  )
}

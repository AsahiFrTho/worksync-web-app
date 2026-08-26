import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PhoneCall, PhoneOff, CalendarClock, MessageSquare, BellRing, Smartphone, Mail, MessageCircle, Phone, Zap } from 'lucide-react'
import { useStore } from '../data/store'
import { followUpBuckets, employmentStatus, courseOf, providerOf, displayName, consentActive, fmtDate, todayStr, daysBetween } from '../data/compute'
import { Card, CardHeader, Badge, OutcomeBadge, Tabs, Modal, Field, Select, TextInput, EmptyState, useToast, Avatar, Banner } from '../components/ui'

const CHANNEL_ICON = { Call: Phone, SMS: Smartphone, WhatsApp: MessageCircle, IVR: Zap, Email: Mail, 'Field visit': PhoneCall }
const REMINDER_TONES = { scheduled: 'slate', sent: 'sky', responded: 'emerald', failed: 'rose' }

function ContactModal({ fu, onClose }) {
  const db = useStore()
  const { markContacted } = useStore()
  const { show, node } = useToast()
  const learner = db.learners.find(l => l.id === fu?.learnerId)
  const [notes, setNotes] = useState('')
  const [empStatus, setEmpStatus] = useState('')
  const [nextDate, setNextDate] = useState('')
  const [phone, setPhone] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [block, setBlock] = useState('')
  const [locationNote, setLocationNote] = useState('')
  if (!fu || !learner) return null
  const masked = !consentActive(learner)

  const save = () => {
    markContacted(fu.id, {
      notes, employmentStatus: empStatus, nextDate: nextDate || undefined,
      phone: phone || undefined, alternatePhone: altPhone, block: block || undefined, locationNote
    })
    show(`Follow-up completed${empStatus ? ` · status updated to ${empStatus}` : ''}`)
    onClose()
  }

  return (
    <Modal open onClose={onClose} wide title="Log contact" sub={`${displayName(learner)} · ${fu.reason}`}>
      {node}
      {masked && <Banner tone="warn" className="mb-3">Consent is {learner.consentStatus} — avoid sharing personal details on this call.</Banner>}
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Current employment status (quick update)">
          <Select value={empStatus} onChange={setEmpStatus} placeholder="No change"
            options={['Employed', 'Self-employed', 'Unemployed', 'Apprentice', 'Higher education', 'In training'].map(s => ({ value: s, label: s }))} />
        </Field>
        <Field label="Schedule next follow-up"><TextInput type="date" value={nextDate} onChange={setNextDate} /></Field>
        <Field label="Call notes" className="sm:col-span-2">
          <textarea className="input min-h-[70px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="What did the learner say?" />
        </Field>
      </div>
      <details className="mt-3 border border-slate-200 rounded-lg px-4 py-3">
        <summary className="text-[13px] font-semibold text-slate-600 cursor-pointer">Contact / location changed? (optional)</summary>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <Field label="New phone"><TextInput value={phone} onChange={setPhone} placeholder={masked ? 'hidden (no consent)' : learner.phone} /></Field>
          <Field label="Alternate phone"><TextInput value={altPhone} onChange={setAltPhone} placeholder="Add alternate number" /></Field>
          <Field label="New block / area"><TextInput value={block} onChange={setBlock} placeholder={learner.block} /></Field>
          <Field label="Reason"><TextInput value={locationNote} onChange={setLocationNote} placeholder="e.g. relocated for family work" /></Field>
        </div>
      </details>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save}><PhoneCall size={14} /> Mark contacted</button>
      </div>
    </Modal>
  )
}

function FollowUpCard({ fu, db, onContact, onUnreachable, onSchedule }) {
  const learner = db.learners.find(l => l.id === fu.learnerId)
  if (!learner) return null
  const st = employmentStatus(db, learner.id)
  const overdue = fu.status === 'scheduled' && fu.dueDate < todayStr()
  const ChannelIcon = CHANNEL_ICON[fu.channel] || Phone
  return (
    <div className={`px-4 py-3.5 border-t first:border-t-0 ${overdue ? 'bg-rose-50/40' : ''}`}>
      <div className="flex items-start gap-3">
        {!consentActive(learner) ? (
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0">🔒</div>
        ) : <Avatar name={learner.name} />}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link to={`/learners/${learner.id}`} className="font-semibold text-[14px] text-navy-800 hover:underline">{displayName(learner)}</Link>
            <OutcomeBadge status={st} />
            {overdue && <Badge tone="rose">{Math.abs(daysBetween(fu.dueDate, todayStr()))}d overdue</Badge>}
            {fu.dueDate === todayStr() && <Badge tone="amber">due today</Badge>}
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {courseOf(db, learner.id)?.name} · {providerOf(db, learner.id)?.name} · {learner.district}
          </p>
          <p className="text-[13px] text-slate-600 mt-1.5"><span className="font-medium">Reason:</span> {fu.reason}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12px] text-slate-500">
            <span className="inline-flex items-center gap-1"><ChannelIcon size={12} /> prefers {fu.channel}</span>
            <span>Attempts: <b className="text-slate-700">{fu.contactAttemptCount}</b></span>
            <span>Due: <b className={overdue ? 'text-rose-600' : 'text-slate-700'}>{fmtDate(fu.dueDate)}</b></span>
            {fu.nextActionDate && <span>Next: {fmtDate(fu.nextActionDate)}</span>}
            <span className="text-slate-400">{fu.assignedTo}</span>
          </div>
          {fu.notes && <p className="text-[12px] text-slate-500 italic mt-1.5 bg-slate-50 rounded px-2.5 py-1.5">“{fu.notes}”</p>}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {fu.status !== 'completed' ? (<>
            <button className="btn-primary btn-sm" onClick={() => onContact(fu)}><PhoneCall size={13} /> Contacted</button>
            <button className="btn-secondary btn-sm" onClick={() => onUnreachable(fu)}><PhoneOff size={13} /> Unreachable</button>
            <button className="btn-ghost btn-sm" onClick={() => onSchedule(fu)}><CalendarClock size={13} /> Reschedule</button>
          </>) : (
            <Badge tone="emerald">completed {fu.completedAt ? fmtDate(fu.completedAt) : ''}</Badge>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FollowUps() {
  const db = useStore()
  const { markUnreachable, scheduleFollowUp } = useStore()
  const { show, node } = useToast()
  const [tab, setTab] = useState('overdue')
  const [contactFu, setContactFu] = useState(null)
  const [schedFu, setSchedFu] = useState(null)
  const [schedDate, setSchedDate] = useState('')

  const buckets = useMemo(() => followUpBuckets(db), [db])
  const reminders = db.automatedReminders
    .slice()
    .sort((a, b) => b.sendDate.localeCompare(a.sendDate))
    .slice(0, 8)

  const tabs = [
    { id: 'overdue', label: 'Overdue', count: buckets.overdue.length },
    { id: 'today', label: 'Due today', count: buckets.today.length },
    { id: 'upcoming', label: 'Upcoming', count: buckets.upcoming.length },
    { id: 'completed', label: 'Recently completed', count: buckets.completed.length }
  ]
  const list = buckets[tab] || []

  const onUnreachable = (fu) => {
    markUnreachable(fu.id, 'Learner unreachable on call.')
    show('Marked unreachable — retry scheduled in 7 days')
  }

  return (
    <div>
      {node}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink">Follow-up queue</h1>
        <p className="text-[13px] text-slate-500">Longitudinal tracking lives here — one call per learner keeps outcomes fresh.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <div className="px-5 pt-4">
              <Tabs tabs={tabs} active={tab} onChange={setTab} />
            </div>
            {list.length ? list.map(fu => (
              <FollowUpCard key={fu.id} fu={fu} db={db}
                onContact={setContactFu} onUnreachable={onUnreachable}
                onSchedule={fu => { setSchedFu(fu); setSchedDate(fu.dueDate) }} />
            )) : (
              <EmptyState icon={tab === 'completed' ? PhoneCall : CalendarClock}
                title={tab === 'overdue' ? 'Nothing overdue — great job!' : tab === 'today' ? 'No follow-ups due today' : tab === 'upcoming' ? 'No upcoming follow-ups scheduled' : 'No completed follow-ups yet'}
                hint="Follow-ups are created automatically when outcomes are recorded with the follow-up flag." />
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Automated reminders" sub="Simulated multi-channel nudges (demo)" right={<Badge tone="navy">simulated</Badge>} />
            <div className="pb-3">
              {reminders.map(r => {
                const learner = db.learners.find(l => l.id === r.learnerId)
                const Icon = CHANNEL_ICON[r.channel] || Smartphone
                return (
                  <div key={r.id} className="px-5 py-2.5 border-t border-slate-100 first:border-t-0 flex items-center gap-2.5">
                    <Icon size={14} className="text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-ink truncate">{displayName(learner)} · {r.channel}</div>
                      <div className="text-[11px] text-slate-400">{fmtDate(r.sendDate)}</div>
                    </div>
                    <Badge tone={REMINDER_TONES[r.status]}>{r.status}</Badge>
                  </div>
                )
              })}
            </div>
            <p className="px-5 pb-4 text-[11.5px] text-slate-400 flex gap-1.5">
              <BellRing size={13} className="shrink-0 mt-0.5" />
              In production these would go out over SMS / WhatsApp / email / IVR gateways. This demo simulates delivery states only.
            </p>
          </Card>

          <Card>
            <CardHeader title="Why follow-ups matter" />
            <div className="px-5 pb-4 text-[12.5px] text-slate-500 leading-relaxed space-y-2">
              <p>Each completed follow-up refreshes the learner’s outcome record — improving retention metrics, wage progression data and the programme’s data completeness score.</p>
              <p>Tip: use <b>“Contacted”</b> to update employment status in the same step — it takes under a minute.</p>
            </div>
          </Card>
        </div>
      </div>

      {contactFu && <ContactModal fu={contactFu} onClose={() => setContactFu(null)} />}
      {schedFu && (
        <Modal open onClose={() => setSchedFu(null)} title="Reschedule follow-up" sub={displayName(db.learners.find(l => l.id === schedFu.learnerId))}>
          <Field label="New due date"><TextInput type="date" value={schedDate} onChange={setSchedDate} /></Field>
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn-secondary" onClick={() => setSchedFu(null)}>Cancel</button>
            <button className="btn-primary" onClick={() => { scheduleFollowUp(schedFu.id, schedDate); show('Follow-up rescheduled'); setSchedFu(null) }}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { Save, Settings as Cog, MapPin, BookOpen, Building2, Tag, Tags, Users, ShieldCheck, CalendarClock, Bell } from 'lucide-react'
import { useStore } from '../data/store'
import { Card, CardHeader, Badge, Field, TextInput, useToast, KV } from '../components/ui'

function ListEditor({ label, items, onChange, placeholder, icon: Icon }) {
  const [val, setVal] = useState('')
  return (
    <div>
      <label className="label flex items-center gap-1.5">{Icon && <Icon size={13} className="text-slate-400" />} {label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[30px] p-2 border border-slate-200 rounded-lg bg-slate-50/60">
        {items.map((it, i) => (
          <button key={i} title="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Badge tone="navy" className="cursor-pointer hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200">{it} ✕</Badge>
          </button>
        ))}
        {!items.length && <span className="text-[12px] text-slate-400">List is empty</span>}
      </div>
      <div className="flex gap-2">
        <input className="input" value={val} placeholder={placeholder}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onChange([...items, val.trim()]); setVal('') } }} />
        <button className="btn-secondary" onClick={() => { if (val.trim()) { onChange([...items, val.trim()]); setVal('') } }}>Add</button>
      </div>
    </div>
  )
}

export default function Settings() {
  const { settings, updateSettings, users, providers, courses } = useStore()
  const { show, node } = useToast()
  const [draft, setDraft] = useState({ ...settings })
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))

  const save = () => { updateSettings(draft); show('Settings saved (stored in this browser)') }

  return (
    <div>
      {node}
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Settings</h1>
          <p className="text-[13px] text-slate-500">Programme configuration — demo values, editable and stored locally</p>
        </div>
        <button className="btn-primary" onClick={save}><Save size={14} /> Save changes</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Programme" right={<Cog size={16} className="text-slate-300" />} />
          <div className="px-5 pb-5 space-y-3">
            <Field label="Programme name"><TextInput value={draft.programName} onChange={v => set('programName', v)} /></Field>
            <Field label="Data retention period (months)" hint="How long learner records are kept after last activity">
              <TextInput type="number" value={draft.retentionPeriodMonths} onChange={v => set('retentionPeriodMonths', Number(v))} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Reference lists" sub="Used across forms, filters and tags" />
          <div className="px-5 pb-5 space-y-4">
            <ListEditor label="Districts" icon={MapPin} items={draft.districts} onChange={v => set('districts', v)} placeholder="Add district…" />
            <ListEditor label="Outcome reason codes" icon={Tag} items={draft.reasonCodes} onChange={v => set('reasonCodes', v)} placeholder="Add reason code…" />
            <ListEditor label="Skill tags" icon={Tags} items={draft.skillTags} onChange={v => set('skillTags', v)} placeholder="Add skill tag…" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Providers" right={<Building2 size={16} className="text-slate-300" />} />
          <div className="px-5 pb-5">
            {providers.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                <div>
                  <div className="text-[13.5px] font-medium text-ink">{p.name}</div>
                  <div className="text-[11.5px] text-slate-400">{p.id} · {p.district}</div>
                </div>
                <Badge tone="emerald">{p.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Courses" right={<BookOpen size={16} className="text-slate-300" />} />
          <div className="px-5 pb-5">
            {courses.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                <div>
                  <div className="text-[13.5px] font-medium text-ink">{c.name}</div>
                  <div className="text-[11.5px] text-slate-400">{c.sector} · {c.durationHours} hours</div>
                </div>
                <Badge tone="emerald">{c.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Users & roles" right={<Users size={16} className="text-slate-300" />} />
          <div className="px-5 pb-5">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                <div>
                  <div className="text-[13.5px] font-medium text-ink">{u.name}</div>
                  <div className="text-[11.5px] text-slate-400">{u.organization}</div>
                </div>
                <Badge tone="navy">{u.role}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Consent policy" right={<ShieldCheck size={16} className="text-emerald-500" />} />
          <div className="px-5 pb-5">
            <textarea className="input min-h-[120px] text-[13px]" value={draft.consentPolicy} onChange={e => set('consentPolicy', e.target.value)} />
            <p className="text-[11.5px] text-slate-400 mt-2">Shown to learners at consent collection and referenced in the learner profile.</p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Notification rules" sub="Simulated automated reminders" right={<Bell size={16} className="text-slate-300" />} />
          <div className="px-5 pb-5 grid sm:grid-cols-2 gap-4">
            <Field label="Reminder channels (simulated)">
              <ListEditor items={draft.notificationRules.channels} onChange={v => set('notificationRules', { ...draft.notificationRules, channels: v })} placeholder="Add channel…" />
            </Field>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[13px] text-slate-600">
                <input type="checkbox" className="accent-navy-700 w-4 h-4" checked={draft.notificationRules.followUpSameDay}
                  onChange={e => set('notificationRules', { ...draft.notificationRules, followUpSameDay: e.target.checked })} />
                Auto-remind coordinators about follow-ups due today
              </label>
              <Field label="Overdue digest">
                <TextInput value={draft.notificationRules.overdueDigest} onChange={v => set('notificationRules', { ...draft.notificationRules, overdueDigest: v })} />
              </Field>
              <Field label="Consent expiry reminder (days before)">
                <TextInput type="number" value={draft.notificationRules.consentExpiryReminderDays}
                  onChange={v => set('notificationRules', { ...draft.notificationRules, consentExpiryReminderDays: Number(v) })} />
              </Field>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex justify-end">
        <button className="btn-primary" onClick={save}><Save size={14} /> Save changes</button>
      </div>
    </div>
  )
}

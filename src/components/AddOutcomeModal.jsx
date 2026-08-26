import React, { useMemo, useState } from 'react'
import { Briefcase, Store, Wrench, GraduationCap, UserX, CircleSlash, DoorOpen, RefreshCw, TrendingUp, RotateCcw } from 'lucide-react'
import { useStore } from '../data/store'
import { Modal, Field, Select, TextInput, Stepper, Badge, useToast } from './ui'
import { SKILL_TAGS, REASON_CODES, COURSES } from '../data/seed'
import { courseOf, fmtDate, todayStr, addDays } from '../data/compute'

const TYPE_DEFS = [
  { id: 'wage_employment', label: 'Wage Employment', icon: Briefcase, tone: 'border-emerald-500 bg-emerald-50 text-emerald-800', desc: 'Learner took a salaried job' },
  { id: 'self_employment', label: 'Self-Employment', icon: Store, tone: 'border-violet-500 bg-violet-50 text-violet-800', desc: 'Started a business / own work' },
  { id: 'apprenticeship', label: 'Apprenticeship', icon: Wrench, tone: 'border-sky-500 bg-sky-50 text-sky-800', desc: 'Apprentice with an employer' },
  { id: 'higher_education', label: 'Higher Education', icon: GraduationCap, tone: 'border-indigo-500 bg-indigo-50 text-indigo-800', desc: 'Joined further studies' },
  { id: 'job_change', label: 'Job Change', icon: RefreshCw, tone: 'border-teal-500 bg-teal-50 text-teal-800', desc: 'Moved to a new employer' },
  { id: 'wage_update', label: 'Wage Update', icon: TrendingUp, tone: 'border-lime-600 bg-lime-50 text-lime-800', desc: 'Wage / income revision only' },
  { id: 'unemployed', label: 'Unemployed', icon: UserX, tone: 'border-amber-500 bg-amber-50 text-amber-800', desc: 'Seeking work' },
  { id: 'not_placed', label: 'Not Placed', icon: CircleSlash, tone: 'border-orange-500 bg-orange-50 text-orange-800', desc: 'Not placed after training' },
  { id: 'dropout', label: 'Dropout / Attrition', icon: DoorOpen, tone: 'border-rose-500 bg-rose-50 text-rose-800', desc: 'Left the programme / job' }
]

export default function AddOutcomeModal({ open, onClose, learner }) {
  const { addOutcome, enrollments } = useStore()
  const { show, node } = useToast()
  const [step, setStep] = useState(0)
  const [type, setType] = useState(null)
  const [form, setForm] = useState({})
  const [skills, setSkills] = useState([])
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [followUp, setFollowUp] = useState(false)
  const [followUpDate, setFollowUpDate] = useState(addDays(todayStr(), 30))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const enrollment = useMemo(() => enrollments.find(e => e.learnerId === learner?.id), [enrollments, learner])

  if (!learner) return null
  const reset = () => { setStep(0); setType(null); setForm({}); setSkills([]); setTags([]); setFollowUp(false) }
  const close = () => { reset(); onClose() }

  const def = TYPE_DEFS.find(d => d.id === type)
  const dateLabel = { wage_employment: 'Job start date', self_employment: 'Business start date', apprenticeship: 'Apprenticeship start date', job_change: 'New job start date', wage_update: 'Effective date' }[type] || 'Date'

  const needsReason = ['unemployed', 'not_placed', 'dropout'].includes(type)
  const canSubmit = type && form.eventDate &&
    (needsReason ? form.reasonCode : true) &&
    (['wage_employment', 'job_change'].includes(type) ? form.employerName && form.monthlyWage : true) &&
    (type === 'self_employment' ? form.selfEmploymentBusinessName : true)

  const submit = () => {
    const payload = {
      learnerId: learner.id, outcomeType: type,
      eventDate: form.eventDate,
      employerName: form.employerName || '', jobRole: form.jobRole || '',
      monthlyWage: form.monthlyWage ? Number(form.monthlyWage) : null,
      employmentType: form.employmentType || 'Full-time', workLocation: form.workLocation || '',
      skillsUsed: skills, relevanceToTraining: form.relevanceToTraining || '',
      selfEmploymentBusinessName: form.selfEmploymentBusinessName || '',
      selfEmploymentNature: form.selfEmploymentNature || '',
      selfEmploymentIncome: form.selfEmploymentIncome ? Number(form.selfEmploymentIncome) : null,
      selfEmploymentSupport: form.selfEmploymentSupport || '',
      apprenticeshipRole: form.apprenticeshipRole || form.jobRole || '',
      apprenticeshipStipend: form.apprenticeshipStipend ? Number(form.apprenticeshipStipend) : null,
      apprenticeshipDurationMonths: form.apprenticeshipDurationMonths || null,
      apprenticeshipMentor: form.apprenticeshipMentor || '',
      apprenticeshipProgress: form.apprenticeshipProgress || 'Ongoing',
      reasonCode: form.reasonCode || '',
      notes: form.notes || '', tags,
      followUpRequired: followUp, followUpDate
    }
    const evt = addOutcome(payload)
    const queued = ['wage_employment', 'job_change'].includes(type) && form.employerName
    show(`Outcome recorded${queued ? ' · employer verification queued' : ''}${followUp ? ' · follow-up scheduled' : ''}`)
    close()
    return evt
  }

  const SkillPicker = () => (
    <div className="flex flex-wrap gap-1.5">
      {[...new Set([...SKILL_TAGS, ...(courseOf(useStore.getState(), learner.id)?.name === 'Self-Employed Tailor' ? ['Stitching techniques'] : [])])].map(s => (
        <button key={s} type="button" onClick={() => setSkills(sk => sk.includes(s) ? sk.filter(x => x !== s) : [...sk, s])}>
          <Badge tone={skills.includes(s) ? 'navy' : 'slate'} className="cursor-pointer">{skills.includes(s) ? '✓ ' : '+ '}{s}</Badge>
        </button>
      ))}
    </div>
  )

  return (
    <Modal open={open} onClose={close} wide title="Add outcome" sub={`${learner.name} · ${learner.uniqueLearnerId}${enrollment ? ' · ' + enrollment.batchName : ''}`}>
      {node}
      <Stepper steps={['Outcome type', 'Details']} current={step} />

      {step === 0 && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TYPE_DEFS.map(d => (
              <button key={d.id} onClick={() => { setType(d.id); if (!form.eventDate) set('eventDate', todayStr()) }}
                className={`text-left rounded-xl border-2 p-3 transition-all ${type === d.id ? d.tone : 'border-slate-200 hover:border-slate-300'}`}>
                <d.icon size={17} className="mb-1.5" />
                <div className="text-[13px] font-semibold leading-tight">{d.label}</div>
                <div className="text-[11px] opacity-70 mt-0.5 leading-snug">{d.desc}</div>
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <Field label={dateLabel}>
              <TextInput type="date" value={form.eventDate || ''} onChange={v => set('eventDate', v)} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn-primary" disabled={!type} onClick={() => setStep(1)} style={{ opacity: type ? 1 : 0.5 }}>Continue →</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            {def && <Badge tone="navy"><def.icon size={12} className="inline" /> {def.label}</Badge>}
            <span className="text-[12px] text-slate-400">{fmtDate(form.eventDate)}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {['wage_employment', 'job_change'].includes(type) && (<>
              <Field label="Employer name *"><TextInput value={form.employerName || ''} onChange={v => set('employerName', v)} placeholder="e.g. Sundaram Auto Components" /></Field>
              <Field label="Job role *"><TextInput value={form.jobRole || ''} onChange={v => set('jobRole', v)} placeholder="e.g. CNC Operator" /></Field>
              <Field label="Monthly wage (₹) *"><TextInput type="number" value={form.monthlyWage || ''} onChange={v => set('monthlyWage', v)} placeholder="e.g. 14000" /></Field>
              <Field label="Employment type">
                <Select allowAll={false} value={form.employmentType || 'Full-time'} onChange={v => set('employmentType', v)}
                  options={['Full-time', 'Part-time', 'Contract', 'Temporary'].map(t => ({ value: t, label: t }))} />
              </Field>
              <Field label="Work location"><TextInput value={form.workLocation || ''} onChange={v => set('workLocation', v)} placeholder="e.g. Nashik" /></Field>
              <Field label="Relevance to training">
                <Select allowAll={false} value={form.relevanceToTraining || 'high'} onChange={v => set('relevanceToTraining', v)}
                  options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
              </Field>
            </>)}

            {type === 'self_employment' && (<>
              <Field label="Business name *"><TextInput value={form.selfEmploymentBusinessName || ''} onChange={v => set('selfEmploymentBusinessName', v)} placeholder="e.g. Sai Tailoring Unit" /></Field>
              <Field label="Nature of work"><TextInput value={form.selfEmploymentNature || ''} onChange={v => set('selfEmploymentNature', v)} placeholder="e.g. Stitching & alteration" /></Field>
              <Field label="Estimated monthly income (₹)"><TextInput type="number" value={form.selfEmploymentIncome || ''} onChange={v => set('selfEmploymentIncome', v)} /></Field>
              <Field label="Location"><TextInput value={form.workLocation || ''} onChange={v => set('workLocation', v)} /></Field>
              <Field label="Support received, if any" className="sm:col-span-2"><TextInput value={form.selfEmploymentSupport || ''} onChange={v => set('selfEmploymentSupport', v)} placeholder="e.g. Toolkit + ₹5,000 seed grant" /></Field>
            </>)}

            {type === 'apprenticeship' && (<>
              <Field label="Employer name *"><TextInput value={form.employerName || ''} onChange={v => set('employerName', v)} /></Field>
              <Field label="Apprenticeship role"><TextInput value={form.apprenticeshipRole || ''} onChange={v => set('apprenticeshipRole', v)} /></Field>
              <Field label="Monthly stipend (₹)"><TextInput type="number" value={form.apprenticeshipStipend || ''} onChange={v => set('apprenticeshipStipend', v)} /></Field>
              <Field label="Duration (months)"><TextInput type="number" value={form.apprenticeshipDurationMonths || ''} onChange={v => set('apprenticeshipDurationMonths', v)} /></Field>
              <Field label="Mentor name (optional)"><TextInput value={form.apprenticeshipMentor || ''} onChange={v => set('apprenticeshipMentor', v)} /></Field>
              <Field label="Progress status">
                <Select allowAll={false} value={form.apprenticeshipProgress || 'Ongoing'} onChange={v => set('apprenticeshipProgress', v)}
                  options={['Ongoing', 'Completed', 'Discontinued'].map(t => ({ value: t, label: t }))} />
              </Field>
            </>)}

            {needsReason && (
              <Field label="Reason code *" className="sm:col-span-2" hint="Standard reason codes help programme teams act on patterns.">
                <Select allowAll={false} value={form.reasonCode || ''} onChange={v => set('reasonCode', v)} placeholder="Select reason"
                  options={useStore.getState().settings.reasonCodes.map(r => ({ value: r, label: r }))} />
              </Field>
            )}

            {type === 'higher_education' && (
              <Field label="Details" className="sm:col-span-2"><TextInput value={form.notes || ''} onChange={v => set('notes', v)} placeholder="e.g. Diploma in Mechanical Engineering" /></Field>
            )}

            {['wage_employment', 'job_change', 'self_employment', 'apprenticeship'].includes(type) && (
              <Field label="Skills used on the job" className="sm:col-span-2"><SkillPicker /></Field>
            )}

            {type === 'wage_update' && (
              <Field label={form.selfFlag ? 'New monthly income (₹)' : 'New monthly wage / income (₹) *'}>
                <TextInput type="number" value={form.monthlyWage || ''} onChange={v => set('monthlyWage', v)} placeholder="e.g. 15500" />
              </Field>
            )}

            <Field label="Notes" className="sm:col-span-2"><TextInput value={form.notes || ''} onChange={v => set('notes', v)} placeholder="Optional context for this outcome" /></Field>

            <Field label="Custom tags" className="sm:col-span-2">
              <div className="flex flex-wrap gap-1.5 items-center">
                {tags.map(t => (
                  <button key={t} onClick={() => setTags(ts => ts.filter(x => x !== t))}><Badge tone="teal">{t} ✕</Badge></button>
                ))}
                <input className="input flex-1 min-w-[140px] py-1.5 text-[13px]" value={tagInput} placeholder="Add tag + Enter"
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { setTags(ts => [...new Set([...ts, tagInput.trim()])]); setTagInput('') } }} />
              </div>
            </Field>
          </div>

          <label className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
            <input type="checkbox" checked={followUp} onChange={e => setFollowUp(e.target.checked)} className="accent-navy-700 w-4 h-4" />
            <span className="text-[13px] font-medium text-slate-700">Schedule a follow-up</span>
            {followUp && (
              <input type="date" className="input py-1 ml-2 w-auto" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
            )}
          </label>

          <div className="flex justify-between gap-2 mt-4">
            <button className="btn-secondary" onClick={() => setStep(0)}>← Back</button>
            <button className="btn-primary" disabled={!canSubmit} style={{ opacity: canSubmit ? 1 : 0.5 }} onClick={submit}>Save outcome</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

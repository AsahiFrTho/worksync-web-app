import React, { useState } from 'react'
import { useStore } from '../data/store'
import { Modal, Field, Select, TextInput, Badge, useToast } from './ui'
import { todayStr } from '../data/compute'

export function ConsentModal({ open, onClose, learner }) {
  const updateConsent = useStore(s => s.updateConsent)
  const { show, node } = useToast()
  const [status, setStatus] = useState(learner?.consentStatus || 'missing')
  const [method, setMethod] = useState(learner?.consentMethod || 'Form')
  const [date, setDate] = useState(learner?.consentDate || todayStr())
  const [purposes, setPurposes] = useState(learner?.consentPurpose?.length ? learner.consentPurpose : ['Outcome tracking'])

  if (!learner) return null
  const PURPOSES = ['Outcome tracking', 'Employer verification', 'Analytics']
  const save = () => {
    updateConsent(learner.id, {
      consentStatus: status,
      consentGiven: status === 'active',
      consentMethod: status === 'active' ? method : learner.consentMethod,
      consentDate: status === 'active' ? date : learner.consentDate,
      consentPurpose: status === 'active' ? purposes : learner.consentPurpose
    })
    show(status === 'active' ? 'Consent recorded — full record now visible' : `Consent marked ${status}`)
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Update consent" sub={`${learner.name} · ${learner.uniqueLearnerId}`}>
      {node}
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Consent status">
          <Select allowAll={false} value={status} onChange={setStatus}
            options={[{ value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }, { value: 'revoked', label: 'Revoked' }, { value: 'missing', label: 'Not given' }]} />
        </Field>
        <Field label="Consent method">
          <Select allowAll={false} value={method} onChange={setMethod}
            options={['Form', 'SMS', 'Call', 'In-person'].map(m => ({ value: m, label: m }))} />
        </Field>
        <Field label="Consent date"><TextInput type="date" value={date} onChange={setDate} /></Field>
        <Field label="Consent purpose" className="sm:col-span-2">
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PURPOSES.map(p => (
              <button key={p} onClick={() => setPurposes(ps => ps.includes(p) ? ps.filter(x => x !== p) : [...ps, p])}>
                <Badge tone={purposes.includes(p) ? 'emerald' : 'slate'} className="cursor-pointer">{purposes.includes(p) ? '✓ ' : '+ '}{p}</Badge>
              </button>
            ))}
          </div>
        </Field>
      </div>
      <p className="text-[12px] text-slate-400 mt-3">If consent is not active, this learner’s personal details stay hidden — analytics show aggregate / pseudonymised data only.</p>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save}>Save consent</button>
      </div>
    </Modal>
  )
}

export function FollowUpScheduleModal({ open, onClose, learner }) {
  const addFollowUp = useStore(s => s.addFollowUp)
  const { show, node } = useToast()
  const [dueDate, setDueDate] = useState(todayStr())
  const [channel, setChannel] = useState('Call')
  const [reason, setReason] = useState('')
  if (!learner) return null
  const save = () => {
    addFollowUp({ learnerId: learner.id, dueDate, channel, reason: reason || 'Manual follow-up', assignedTo: 'Me' })
    show('Follow-up scheduled')
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Schedule follow-up" sub={learner.name}>
      {node}
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Due date"><TextInput type="date" value={dueDate} onChange={setDueDate} /></Field>
        <Field label="Channel">
          <Select allowAll={false} value={channel} onChange={setChannel}
            options={['Call', 'SMS', 'WhatsApp', 'IVR', 'Field visit'].map(c => ({ value: c, label: c }))} />
        </Field>
        <Field label="Reason" className="sm:col-span-2"><TextInput value={reason} onChange={setReason} placeholder="e.g. 3-month wage check" /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save}>Schedule</button>
      </div>
    </Modal>
  )
}

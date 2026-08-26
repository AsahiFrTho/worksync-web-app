import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildSeedData } from './seed'

const today = () => new Date().toISOString().slice(0, 10)
const addDays = (dstr, n) => new Date(new Date(dstr + 'T12:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10)

export const ROLE_META = {
  admin: { label: 'Admin — Programme Officer', short: 'Admin', user: 'Meera Deshpande', org: 'Skill Development Mission', landing: '/dashboard', tone: 'bg-navy-800' },
  provider: { label: 'Training Provider Staff', short: 'Provider Staff', user: 'Rahul Kulkarni', org: 'Nashik Skill Academy', landing: '/dashboard', tone: 'bg-emerald-700' },
  coordinator: { label: 'Field Coordinator', short: 'Coordinator', user: 'Sunita Wagh', org: 'Field Team — Nashik Division', landing: '/followups', tone: 'bg-amber-600' },
  verifier: { label: 'Employer Verifier', short: 'Verifier', user: 'Arjun Pawar', org: 'Employer Verification Cell', landing: '/verification', tone: 'bg-violet-700' }
}

const seedOnce = buildSeedData()
let idCounters = {
  O: seedOnce.outcomeEvents.length, F: seedOnce.followUps.length,
  V: seedOnce.employerVerifications.length, S: seedOnce.skillGaps.length,
  R: seedOnce.automatedReminders.length
}
const nextId = (p) => `${p}${++idCounters[p] + 1000}`

export const useStore = create(persist((set, get) => ({
  ...seedOnce,
  role: null,

  login: (role) => set({ role }),
  logout: () => set({ role: null }),
  setRole: (role) => set({ role }),

  // ── Outcomes ───────────────────────────────────────────────────────────
  addOutcome: (payload) => {
    const evt = {
      id: nextId('O'), createdAt: today(), source: payload.source || 'Coordinator',
      verifiedStatus: 'not_required', tags: payload.tags || [], ...payload
    }
    const needsVerification = ['wage_employment', 'job_change'].includes(payload.outcomeType) && payload.employerName
    if (needsVerification) evt.verifiedStatus = 'pending'
    const newVerification = needsVerification ? {
      id: nextId('V'), outcomeEventId: evt.id, learnerId: payload.learnerId,
      employerName: payload.employerName, jobRole: payload.jobRole || '',
      startDate: payload.eventDate, wage: payload.monthlyWage || null,
      verificationStatus: 'pending', verificationMethod: '', verifierRemarks: 'New outcome — awaiting verification.',
      confidenceScore: null, verifiedBy: '', verifiedAt: '', flagged: false
    } : null

    const newFollowUp = payload.followUpRequired ? {
      id: nextId('F'), learnerId: payload.learnerId,
      dueDate: payload.followUpDate || addDays(today(), 30),
      assignedTo: ROLE_META[get().role || 'coordinator'].user, channel: 'Call',
      status: 'scheduled', contactAttemptCount: 0,
      reason: `Follow-up after ${payload.outcomeType.replace('_', ' ')} recorded`,
      notes: '', nextActionDate: '', outcomeUpdated: true, createdAt: today(), employmentStatus: ''
    } : null

    set(s => ({
      outcomeEvents: [...s.outcomeEvents, evt],
      employerVerifications: newVerification ? [...s.employerVerifications, newVerification] : s.employerVerifications,
      followUps: newFollowUp ? [...s.followUps, newFollowUp] : s.followUps,
      learners: s.learners.map(l => l.id === payload.learnerId ? { ...l, updatedAt: today(), status: l.status === 'in-training' ? 'tracked' : l.status } : l)
    }))
    return evt
  },

  // ── Consent ────────────────────────────────────────────────────────────
  updateConsent: (learnerId, patch) => set(s => ({
    learners: s.learners.map(l => l.id === learnerId
      ? { ...l, ...patch, consentLastUpdated: today() } : l)
  })),

  // ── Follow-ups ─────────────────────────────────────────────────────────
  markContacted: (followUpId, { notes, employmentStatus, nextDate, phone, alternatePhone, block, locationNote }) => {
    const fu = get().followUps.find(f => f.id === followUpId)
    if (!fu) return
    const statusMap = {
      'Employed': 'wage_employment', 'Self-employed': 'self_employment', 'Unemployed': 'unemployed',
      'Apprentice': 'apprenticeship', 'Higher education': 'higher_education'
    }
    let newEvt = null
    if (employmentStatus && statusMap[employmentStatus]) {
      newEvt = {
        id: nextId('O'), learnerId: fu.learnerId, outcomeType: statusMap[employmentStatus],
        eventDate: today(), notes: `Status updated during follow-up call: ${employmentStatus}.${notes ? ' ' + notes : ''}`,
        source: 'Follow-up call', verifiedStatus: 'not_required', tags: []
      }
    }
    set(s => ({
      followUps: s.followUps.map(f => f.id === followUpId ? {
        ...f, status: 'completed', completedAt: today(),
        contactAttemptCount: f.contactAttemptCount + 1,
        notes: notes || f.notes, nextActionDate: nextDate || '',
        employmentStatus: employmentStatus || f.employmentStatus
      } : f),
      outcomeEvents: newEvt ? [...s.outcomeEvents, newEvt] : s.outcomeEvents,
      learners: s.learners.map(l => l.id === fu.learnerId ? {
        ...l, updatedAt: today(),
        phone: phone || l.phone, alternatePhone: alternatePhone !== undefined ? alternatePhone : l.alternatePhone,
        block: block || l.block,
        phoneNote: locationNote || phone ? (locationNote || '') : l.phoneNote,
        locationChanged: block ? true : l.locationChanged
      } : l)
    }))
  },

  markUnreachable: (followUpId, note) => set(s => ({
    followUps: s.followUps.map(f => f.id === followUpId ? {
      ...f, contactAttemptCount: f.contactAttemptCount + 1,
      nextActionDate: addDays(today(), 7),
      notes: [f.notes, note || 'Learner unreachable.'].filter(Boolean).join(' ')
    } : f)
  })),

  scheduleFollowUp: (followUpId, date) => set(s => ({
    followUps: s.followUps.map(f => f.id === followUpId ? { ...f, dueDate: date, nextActionDate: date } : f)
  })),

  addFollowUp: (payload) => set(s => ({
    followUps: [...s.followUps, {
      id: nextId('F'), status: 'scheduled', contactAttemptCount: 0, notes: '',
      nextActionDate: '', outcomeUpdated: false, createdAt: today(), ...payload
    }]
  })),

  // ── Employer verification ──────────────────────────────────────────────
  verifyEmployer: (id, { status, method, remarks, confidence, flag }) => set(s => ({
    employerVerifications: s.employerVerifications.map(v => {
      if (v.id !== id) return v
      const done = ['verified', 'rejected', 'partially_verified'].includes(status)
      return {
        ...v, verificationStatus: status,
        verificationMethod: method || v.verificationMethod,
        verifierRemarks: remarks !== undefined && remarks !== '' ? remarks : v.verifierRemarks,
        confidenceScore: confidence !== undefined && confidence !== null && confidence !== '' ? Number(confidence) : (status === 'verified' ? 90 : status === 'rejected' ? 20 : v.confidenceScore),
        verifiedBy: done ? ROLE_META[get().role || 'verifier'].user : v.verifiedBy,
        verifiedAt: done ? today() : v.verifiedAt,
        flagged: flag !== undefined ? flag : v.flagged
      }
    }),
    outcomeEvents: s.outcomeEvents.map(o => {
      const v = s.employerVerifications.find(x => x.id === id)
      if (!v || o.id !== v.outcomeEventId) return o
      const map = { verified: 'verified', rejected: 'rejected', partially_verified: 'partially_verified', pending: 'pending', employer_unreachable: 'unreachable' }
      return { ...o, verifiedStatus: map[status] || o.verifiedStatus }
    })
  })),

  requestEvidence: (id, remarks) => set(s => ({
    employerVerifications: s.employerVerifications.map(v => v.id === id
      ? { ...v, verifierRemarks: `Evidence requested: ${remarks || 'payslip / offer letter'}`, verificationStatus: v.verificationStatus === 'pending' ? 'partially_verified' : v.verificationStatus }
      : v)
  })),

  flagEmployer: (id, flagged) => set(s => ({
    employerVerifications: s.employerVerifications.map(v => v.id === id ? { ...v, flagged } : v)
  })),

  // ── Learner ────────────────────────────────────────────────────────────
  updateLearnerContact: (learnerId, patch) => set(s => ({
    learners: s.learners.map(l => l.id === learnerId ? { ...l, ...patch, updatedAt: today() } : l)
  })),
  addLearnerNote: (learnerId, note) => set(s => ({
    learners: s.learners.map(l => l.id === learnerId
      ? { ...l, notes: [l.notes, note].filter(Boolean).join('\n') } : l)
  })),
  addSkillGaps: (learnerId, courseId, skills, reportedBy = 'learner', severity = 'medium') => set(s => ({
    skillGaps: [...s.skillGaps, ...skills.map(sk => ({ id: nextId('S'), learnerId, courseId, skillName: sk, reportedBy, severity, notes: '' }))]
  })),

  // ── Settings / admin ───────────────────────────────────────────────────
  updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),
  resetData: () => set({ ...buildSeedData(), role: get().role })
}), {
  name: 'kaushalsetu-db-v1',
  version: 1
}))

// ── Derived metrics & selectors for KaushalSetu ─────────────────────────────
import { OUTCOME_TYPES } from './seed.js'

export const todayStr = () => new Date().toISOString().slice(0, 10)
const DAY = 86400000
export const addDays = (dstr, n) => new Date(new Date(dstr + 'T12:00:00Z').getTime() + n * DAY).toISOString().slice(0, 10)
export const addMonths = (dstr, m) => {
  const d = new Date(dstr + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + m); return d.toISOString().slice(0, 10)
}
export const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / DAY)
export const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d + 'T12:00:00Z')
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
export const fmtDateShort = (d) => {
  if (!d) return '—'
  const dt = new Date(d + 'T12:00:00Z')
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
export const fmtMoney = (n) => (n === null || n === undefined || n === '' || isNaN(Number(n))) ? '—' : '₹' + Number(n).toLocaleString('en-IN')
export const pct = (a, b, digits = 0) => (b === 0 ? 0 : Math.round((a / b) * 100 * 10 ** digits) / 10 ** digits)

// ── Employment status ────────────────────────────────────────────────────────
const STATUS_DEFINING = ['wage_employment', 'self_employment', 'apprenticeship', 'higher_education', 'unemployed', 'not_placed', 'dropout', 'job_change', 're_engagement']

export const STATUS_LABELS = {
  placed: { label: 'Placed (Wage Job)', color: 'emerald', key: 'placed' },
  self_employed: { label: 'Self-Employed', color: 'violet', key: 'self_employed' },
  apprentice: { label: 'Apprenticeship', color: 'sky', key: 'apprentice' },
  higher_ed: { label: 'Higher Education', color: 'indigo', key: 'higher_ed' },
  unemployed: { label: 'Unemployed', color: 'amber', key: 'unemployed' },
  not_placed: { label: 'Not Placed', color: 'orange', key: 'not_placed' },
  dropped_out: { label: 'Dropped Out', color: 'rose', key: 'dropped_out' },
  re_engaged: { label: 'Re-engaged', color: 'blue', key: 're_engaged' },
  in_training: { label: 'In Training', color: 'teal', key: 'in_training' },
  not_tracked: { label: 'Not Tracked', color: 'slate', key: 'not_tracked' }
}

export function eventsFor(db, learnerId) {
  return db.outcomeEvents.filter(o => o.learnerId === learnerId).sort((a, b) => a.eventDate.localeCompare(b.eventDate))
}

export function enrollmentFor(db, learnerId) {
  return db.enrollments.find(e => e.learnerId === learnerId)
}
export function providerOf(db, learnerId) {
  const e = enrollmentFor(db, learnerId); return db.providers.find(p => p.id === e?.providerId)
}
export function courseOf(db, learnerId) {
  const e = enrollmentFor(db, learnerId); return db.courses.find(c => c.id === e?.courseId)
}
export function verificationsFor(db, learnerId) {
  return db.employerVerifications.filter(v => v.learnerId === learnerId)
}
export function followUpsFor(db, learnerId) {
  return db.followUps.filter(f => f.learnerId === learnerId)
}
export function skillGapsFor(db, learnerId) {
  return db.skillGaps.filter(s => s.learnerId === learnerId)
}

export function employmentStatus(db, learnerId) {
  const evts = eventsFor(db, learnerId).filter(o => STATUS_DEFINING.includes(o.outcomeType))
  const learner = db.learners.find(l => l.id === learnerId)
  if (!evts.length) {
    if (learner?.status === 'in-training') return STATUS_LABELS.in_training
    return STATUS_LABELS.not_tracked
  }
  const last = evts[evts.length - 1]
  const map = {
    wage_employment: 'placed', job_change: 'placed', self_employment: 'self_employed',
    apprenticeship: 'apprentice', higher_education: 'higher_ed', unemployed: 'unemployed',
    not_placed: 'not_placed', dropout: 'dropped_out', re_engagement: 're_engaged'
  }
  return STATUS_LABELS[map[last.outcomeType]] || STATUS_LABELS.not_tracked
}

export function latestWageEvent(db, learnerId) {
  const wageEvts = eventsFor(db, learnerId).filter(o => o.monthlyWage || o.selfEmploymentIncome)
  return wageEvts[wageEvts.length - 1] || null
}
export function currentMonthlyIncome(db, learnerId) {
  const e = latestWageEvent(db, learnerId)
  if (!e) return null
  return e.selfEmploymentIncome || e.monthlyWage
}
export function placementEvent(db, learnerId) {
  return eventsFor(db, learnerId).find(o => ['wage_employment', 'job_change'].includes(o.outcomeType)) || null
}
export function firstPlacement(db, learnerId) {
  return eventsFor(db, learnerId).find(o => o.outcomeType === 'wage_employment') || null
}

// ── Consent / privacy ────────────────────────────────────────────────────────
export const consentActive = (l) => l.consentStatus === 'active'
export const displayName = (l) => consentActive(l) ? l.name : `Learner ${l.uniqueLearnerId}`
export const maskValue = (l, value) => consentActive(l) ? value : '—'
export const canSeePersonal = (l) => consentActive(l)

// ── Filters ─────────────────────────────────────────────────────────────────
export const DEFAULT_FILTERS = { provider: 'all', course: 'all', district: 'all', batch: 'all', gender: 'all', category: 'all', period: 'all', outcome: 'all' }

export function applyFilters(db, filters = {}) {
  const f = { ...DEFAULT_FILTERS, ...filters }
  const cutoff = f.period !== 'all' ? addMonths(todayStr(), -Number(f.period)) : null
  return db.learners.filter(l => {
    const e = enrollmentFor(db, l.id)
    if (!e) return false
    if (f.provider !== 'all' && e.providerId !== f.provider) return false
    if (f.course !== 'all' && e.courseId !== f.course) return false
    if (f.batch !== 'all' && e.batchName !== f.batch) return false
    if (f.district !== 'all' && l.district !== f.district) return false
    if (f.gender !== 'all' && l.gender !== f.gender) return false
    if (f.category !== 'all' && l.category !== f.category) return false
    if (cutoff && e.enrollmentDate < cutoff) return false
    if (f.outcome !== 'all') {
      const st = employmentStatus(db, l.id)
      if (st.key !== f.outcome && !(f.outcome === 'placed' && st.key === 'placed')) return false
    }
    return true
  })
}

// ── KPIs ─────────────────────────────────────────────────────────────────────
export function kpis(db, filters = {}) {
  const learners = applyFilters(db, filters)
  const ids = learners.map(l => l.id)
  const evts = db.outcomeEvents.filter(o => ids.includes(o.learnerId))
  const fus = db.followUps.filter(f => ids.includes(f.learnerId))
  const vers = db.employerVerifications.filter(v => ids.includes(v.learnerId))
  const today = todayStr()

  const count = (key) => learners.filter(l => employmentStatus(db, l.id).key === key).length
  const placed = count('placed'), selfEmp = count('self_employed'), appr = count('apprentice')

  // wage progression: learners with a first wage & a later wage
  let wageGrowths = []
  ids.forEach(id => {
    const wageEvts = evts.filter(o => o.learnerId === id && o.monthlyWage).sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    if (wageEvts.length >= 2) {
      const first = wageEvts[0].monthlyWage, lastW = wageEvts[wageEvts.length - 1].monthlyWage
      if (first > 0) wageGrowths.push((lastW - first) / first)
    }
  })
  const avgWageGrowth = wageGrowths.length ? wageGrowths.reduce((a, b) => a + b, 0) / wageGrowths.length : 0

  // retention at 3 months
  const ret = retention(db, 3, ids)

  const needFollowUp = fus.filter(f => f.status === 'scheduled' && f.dueDate <= today).length
  const pendingVer = vers.filter(v => ['pending', 'employer_unreachable'].includes(v.verificationStatus)).length

  return {
    total: learners.length,
    consented: learners.filter(consentActive).length,
    placed, selfEmp, appr,
    needFollowUp, pendingVer,
    avgWageGrowth,
    retention3: ret.rate,
    completeness: completenessScore(db, learners)
  }
}

// ── Retention ────────────────────────────────────────────────────────────────
const POSITIVE_EVT = ['wage_employment', 'job_change', 'self_employment', 'wage_update']
const NEGATIVE_EVT = ['unemployed', 'dropout', 'not_placed']

// Retention at month m after first placement.
// A learner counts as *tracked* if there is evidence (employment event, wage update,
// or a completed follow-up confirming employment) within ±75 days of the checkpoint,
// or a negative event (unemployed/dropout) in that window. Otherwise: not tracked.
export function retention(db, months, learnerIds = null) {
  const today = todayStr()
  const scope = (learnerIds ? db.learners.filter(l => learnerIds.includes(l.id)) : db.learners)
  let eligible = 0, retained = 0, tracked = 0
  scope.forEach(l => {
    const fp = firstPlacement(db, l.id)
    if (!fp) return
    const due = addMonths(fp.eventDate, months)
    if (due > today) return // not yet due
    eligible++
    const lo = addDays(due, -75), hi = addDays(due, 75)
    const inWin = (d) => d >= lo && d <= hi
    const evidence = db.outcomeEvents.some(o => o.learnerId === l.id && o.id !== fp.id &&
      POSITIVE_EVT.includes(o.outcomeType) && inWin(o.eventDate)) ||
      db.followUps.some(f => f.learnerId === l.id && f.status === 'completed' &&
        ['Employed', 'Self-employed'].includes(f.employmentStatus) && inWin(f.completedAt || f.dueDate))
    const negative = db.outcomeEvents.some(o => o.learnerId === l.id &&
      NEGATIVE_EVT.includes(o.outcomeType) && o.eventDate > fp.eventDate && o.eventDate <= hi)
    if (evidence || negative) {
      tracked++
      if (evidence && !negative) retained++
    }
  })
  return { months, eligible, tracked, retained, rate: tracked ? pct(retained, tracked) : 0 }
}

// ── Completeness ─────────────────────────────────────────────────────────────
export function learnerChecks(db, l) {
  const e = enrollmentFor(db, l.id)
  const st = employmentStatus(db, l.id)
  const fus = followUpsFor(db, l.id)
  const vers = verificationsFor(db, l.id)
  const latestUpdate = [
    l.updatedAt, ...eventsFor(db, l.id).map(o => o.eventDate),
    ...fus.filter(f => f.status === 'completed').map(f => f.completedAt || f.dueDate),
    ...vers.map(v => v.verifiedAt).filter(Boolean)
  ].filter(Boolean).sort().pop()
  return {
    consent: consentActive(l),
    phone: !!l.phone && !l.phoneNote?.includes('switched off'),
    outcome: st.key !== 'not_tracked' && st.key !== 'in_training' ? true : st.key === 'in_training',
    employmentDetails: ['placed', 'apprentice'].includes(st.key)
      ? vers.some(v => ['verified', 'partially_verified'].includes(v.verificationStatus))
      : true,
    wage: ['placed', 'apprentice', 'self_employed'].includes(st.key) ? currentMonthlyIncome(db, l.id) !== null : true,
    fresh: latestUpdate ? daysBetween(latestUpdate, todayStr()) <= 90 : false
  }
}

export function completenessScore(db, learners) {
  if (!learners.length) return 0
  let total = 0
  learners.forEach(l => {
    const c = learnerChecks(db, l)
    const pass = Object.values(c).filter(Boolean).length
    total += pass / 6
  })
  return Math.round((total / learners.length) * 100)
}

// ── Charts ───────────────────────────────────────────────────────────────────
export function outcomeDistribution(db, filters = {}) {
  const learners = applyFilters(db, filters)
  const dist = {}
  learners.forEach(l => {
    const st = employmentStatus(db, l.id)
    dist[st.key] = (dist[st.key] || 0) + 1
  })
  const order = ['placed', 'self_employed', 'apprentice', 'unemployed', 'not_placed', 'dropped_out', 'higher_ed', 're_engaged', 'in_training', 'not_tracked']
  return order.filter(k => dist[k]).map(k => ({ name: STATUS_LABELS[k].label, key: k, value: dist[k] }))
}

const monthKey = (d) => d.slice(0, 7)
const monthLabel = (k) => new Date(k + '-01T12:00:00Z').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })

export function lastNMonths(n) {
  const keys = []
  let d = todayStr()
  for (let i = n - 1; i >= 0; i--) keys.push(monthKey(addMonths(d, -i)))
  return keys
}

export function placementTrend(db, filters = {}) {
  const learners = applyFilters(db, filters)
  const ids = new Set(learners.map(l => l.id))
  const keys = lastNMonths(15)
  const counts = Object.fromEntries(keys.map(k => [k, 0]))
  db.outcomeEvents.forEach(o => {
    if (o.outcomeType === 'wage_employment' && ids.has(o.learnerId)) {
      const k = monthKey(o.eventDate)
      if (counts[k] !== undefined) counts[k]++
    }
  })
  return keys.map(k => ({ month: monthLabel(k), placements: counts[k] }))
}

export function wageProgressionSeries(db, filters = {}) {
  const learners = applyFilters(db, filters)
  const ids = new Set(learners.map(l => l.id))
  const keys = lastNMonths(15)
  const buckets = Object.fromEntries(keys.map(k => [k, []]))
  db.outcomeEvents.forEach(o => {
    const w = o.monthlyWage || o.selfEmploymentIncome
    if (w && ids.has(o.learnerId)) {
      const k = monthKey(o.eventDate)
      if (buckets[k]) buckets[k].push(w)
    }
  })
  return keys.map(k => ({
    month: monthLabel(k),
    wage: buckets[k].length ? Math.round(buckets[k].reduce((a, b) => a + b, 0) / buckets[k].length) : null,
    n: buckets[k].length
  })).filter(d => d.wage !== null)
}

export function retentionSeries(db, filters = {}) {
  const learners = applyFilters(db, filters)
  const ids = learners.map(l => l.id)
  return [1, 3, 6, 12].map(m => {
    const r = retention(db, m, ids)
    return { month: `${m} mo`, rate: r.rate, eligible: r.eligible, tracked: r.tracked }
  })
}

export function topSkillGaps(db, filters = {}, groupBy = null) {
  const learners = applyFilters(db, filters)
  const ids = new Set(learners.map(l => l.id))
  const counts = {}
  db.skillGaps.forEach(s => {
    if (!ids.has(s.learnerId)) return
    if (groupBy === 'employer' && s.reportedBy !== 'employer') return
    if (groupBy === 'learner' && s.reportedBy !== 'learner') return
    const k = groupBy === 'course' ? (db.courses.find(c => c.id === s.courseId)?.name || '?') : groupBy === 'district' ? (db.learners.find(l => l.id === s.learnerId)?.district || '?') : s.skillName
    counts[k] = counts[k] || { high: 0, medium: 0, low: 0, total: 0 }
    counts[k][s.severity] = (counts[k][s.severity] || 0) + 1
    counts[k].total++
  })
  return Object.entries(counts).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total)
}

export function reasonCounts(db, filters = {}, types = ['dropout', 'unemployed', 'not_placed']) {
  const learners = applyFilters(db, filters)
  const ids = new Set(learners.map(l => l.id))
  const counts = {}
  db.outcomeEvents.forEach(o => {
    if (ids.has(o.learnerId) && types.map(t => ({ dropout: 'dropout', unemployed: 'unemployed', not_placed: 'not_placed' })[t]).includes(o.outcomeType) && o.reasonCode) {
      counts[o.reasonCode] = (counts[o.reasonCode] || 0) + 1
    }
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

function groupStats(db, learners, keyFn) {
  const groups = {}
  learners.forEach(l => {
    const k = keyFn(l)
    groups[k] = groups[k] || { learners: [] }
    groups[k].learners.push(l)
  })
  return Object.entries(groups).map(([name, g]) => {
    const ids = g.learners.map(l => l.id)
    const placed = g.learners.filter(l => ['placed'].includes(employmentStatus(db, l.id).key)).length
    const vers = db.employerVerifications.filter(v => ids.includes(v.learnerId))
    const verifiedPlaced = g.learners.filter(l =>
      ['placed'].includes(employmentStatus(db, l.id).key) &&
      vers.some(v => ['verified'].includes(v.verificationStatus))).length
    const evts = db.outcomeEvents.filter(o => ids.includes(o.learnerId) && o.monthlyWage)
    const wageByLearner = {}
    evts.forEach(o => {
      if (!wageByLearner[o.learnerId]) wageByLearner[o.learnerId] = []
      wageByLearner[o.learnerId].push(o.monthlyWage)
    })
    let growths = Object.values(wageByLearner).filter(w => w.length >= 2).map(w => (w[w.length - 1] - w[0]) / w[0])
    return {
      name,
      total: g.learners.length,
      placed,
      placementRate: pct(placed, g.learners.length),
      verifiedRate: pct(verifiedPlaced, placed),
      wageGrowth: growths.length ? Math.round((growths.reduce((a, b) => a + b, 0) / growths.length) * 100) : 0,
      completeness: completenessScore(db, g.learners)
    }
  })
}

export function providerComparison(db, filters = {}) {
  return groupStats(db, applyFilters(db, filters), l => providerOf(db, l.id)?.name || '—')
    .sort((a, b) => b.total - a.total)
}
export function courseComparison(db, filters = {}) {
  return groupStats(db, applyFilters(db, filters), l => courseOf(db, l.id)?.name || '—')
    .sort((a, b) => b.total - a.total)
}
export function districtComparison(db, filters = {}) {
  return groupStats(db, applyFilters(db, filters), l => l.district)
    .sort((a, b) => b.total - a.total)
}

// ── Provider scorecards ──────────────────────────────────────────────────────
export function providerScorecards(db) {
  return db.providers.map(p => {
    const learners = db.learners.filter(l => providerOf(db, l.id)?.id === p.id)
    const ids = learners.map(l => l.id)
    const placedLearners = learners.filter(l => employmentStatus(db, l.id).key === 'placed')
    const vers = db.employerVerifications.filter(v => ids.includes(v.learnerId))
    const verifiedPlaced = placedLearners.filter(l => vers.some(v => v.learnerId === l.id && v.verificationStatus === 'verified'))
    const fus = db.followUps.filter(f => ids.includes(f.learnerId))
    const completedFu = fus.filter(f => f.status === 'completed')
    const ret3 = retention(db, 3, ids)
    const gaps = db.skillGaps.filter(s => ids.includes(s.learnerId))
    const highGaps = gaps.filter(g => g.severity === 'high').length
    const gapScore = learners.length ? Math.max(15, 100 - highGaps * 15) : 100

    const m = {
      learners: learners.length,
      placementRate: pct(placedLearners.length, learners.length),
      verifiedRate: pct(verifiedPlaced.length, placedLearners.length || 1),
      retentionRate: ret3.rate,
      wageGrowth: avgWageGrowthFor(db, ids),
      completeness: completenessScore(db, learners),
      followUpRate: pct(completedFu.length, fus.length),
      employerVerRate: pct(vers.filter(v => v.verificationStatus === 'verified').length, vers.length || 1),
      gapScore
    }
    const composite = (m.placementRate * 0.25 + m.verifiedRate * 0.15 + m.retentionRate * 0.15 + m.completeness * 0.15 +
      m.followUpRate * 0.1 + m.employerVerRate * 0.1 + m.gapScore * 0.1)
    m.composite = Math.round(composite)
    m.badge = m.composite >= 68 ? 'Strong' : m.composite >= 62 ? 'Improving' : 'Needs attention'
    return { provider: p, ...m }
  })
}

function avgWageGrowthFor(db, ids) {
  let growths = []
  ids.forEach(id => {
    const wageEvts = db.outcomeEvents.filter(o => o.learnerId === id && o.monthlyWage).sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    if (wageEvts.length >= 2) growths.push((wageEvts[wageEvts.length - 1].monthlyWage - wageEvts[0].monthlyWage) / wageEvts[0].monthlyWage)
  })
  return growths.length ? Math.round((growths.reduce((a, b) => a + b, 0) / growths.length) * 100) : 0
}

// ── Follow-up queue ──────────────────────────────────────────────────────────
export function followUpBuckets(db) {
  const today = todayStr()
  const scheduled = db.followUps.filter(f => f.status === 'scheduled')
  return {
    overdue: scheduled.filter(f => f.dueDate < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    today: scheduled.filter(f => f.dueDate === today),
    upcoming: scheduled.filter(f => f.dueDate > today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    completed: db.followUps.filter(f => f.status === 'completed').sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
  }
}

// ── Data quality ─────────────────────────────────────────────────────────────
export function dataQualityIssues(db) {
  const today = todayStr()
  const issues = []
  const push = (type, learner, detail, action, actionTo) => issues.push({ type, learner, detail, action, actionTo })
  db.learners.forEach(l => {
    const st = employmentStatus(db, l.id)
    const checks = learnerChecks(db, l)
    if (!checks.consent) push('consent', l, `Consent ${l.consentStatus}`, 'Collect / renew consent', 'coordinator')
    if (!checks.outcome) push('outcome', l, 'No outcome recorded after training', 'Add outcome', 'coordinator')
    if (l.phoneNote?.includes('switched off') || !checks.phone) push('phone', l, l.phoneNote || 'Phone missing', 'Update contact number', 'coordinator')
    if (['placed', 'apprentice'].includes(st.key)) {
      const vers = verificationsFor(db, l.id)
      const unverified = vers.filter(v => !['verified', 'rejected'].includes(v.verificationStatus))
      if (unverified.length) push('employer', l, `${unverified.length} unverified employer record(s)`, 'Verify employer', 'verifier')
      if (!checks.wage) push('wage', l, 'Wage / income information missing', 'Add outcome update', 'coordinator')
    }
    if (!checks.fresh) push('stale', l, 'No update in over 90 days', 'Schedule follow-up', 'coordinator')
  })
  return issues
}

// ── Timeline ─────────────────────────────────────────────────────────────────
export const TIMELINE_STYLES = {
  enrollment: { icon: '📝', color: 'bg-slate-400', label: 'Enrolled' },
  training_start: { icon: '🎓', color: 'bg-teal-500', label: 'Training started' },
  assessment: { icon: '📋', color: 'bg-teal-500', label: 'Assessment' },
  certification: { icon: '🏅', color: 'bg-emerald-500', label: 'Certified' },
  wage_employment: { icon: '💼', color: 'bg-emerald-600', label: 'Wage placement' },
  self_employment: { icon: '🧵', color: 'bg-violet-600', label: 'Self-employment' },
  apprenticeship: { icon: '🔧', color: 'bg-sky-600', label: 'Apprenticeship' },
  higher_education: { icon: '📚', color: 'bg-indigo-500', label: 'Higher education' },
  unemployed: { icon: '⏸️', color: 'bg-amber-500', label: 'Unemployed' },
  not_placed: { icon: '❌', color: 'bg-orange-500', label: 'Not placed' },
  dropout: { icon: '🚪', color: 'bg-rose-600', label: 'Dropped out' },
  job_change: { icon: '🔄', color: 'bg-teal-600', label: 'Job change' },
  wage_update: { icon: '📈', color: 'bg-lime-600', label: 'Wage update' },
  re_engagement: { icon: '🔁', color: 'bg-blue-500', label: 'Re-engaged' },
  follow_up: { icon: '📞', color: 'bg-navy-500', label: 'Follow-up call' },
  field_visit: { icon: '🚶', color: 'bg-navy-600', label: 'Field visit' },
  verification: { icon: '✅', color: 'bg-emerald-500', label: 'Employer verification' },
  consent: { icon: '🛡️', color: 'bg-saffron-500', label: 'Consent update' },
  contact_update: { icon: '📱', color: 'bg-slate-500', label: 'Contact updated' }
}

export function learnerTimeline(db, learnerId) {
  const l = db.learners.find(x => x.id === learnerId)
  const e = enrollmentFor(db, learnerId)
  const items = []
  const add = (date, type, title, desc) => { if (date) items.push({ date, type, title, desc, ...TIMELINE_STYLES[type] || {} }) }

  if (e) {
    add(e.enrollmentDate, 'enrollment', 'Enrolled', `${courseOf(db, learnerId)?.name} at ${providerOf(db, learnerId)?.name} (Batch ${e.batchName})`)
    add(e.trainingStartDate, 'training_start', 'Training started')
    if (e.assessmentStatus && e.assessmentStatus !== 'Pending') add(addDays(e.trainingEndDate, 7), 'assessment', `Assessment ${e.assessmentStatus.toLowerCase()}`)
    if (e.certificationStatus === 'Certified') add(addDays(e.trainingEndDate, 14), 'certification', 'Certification completed')
  }
  eventsFor(db, learnerId).forEach(o => {
    const t = OUTCOME_TYPES[o.outcomeType]?.label || o.outcomeType
    let desc = ''
    if (o.employerName) desc += `${o.jobRole || o.apprenticeshipRole || ''} at ${o.employerName}`.trim() + (o.monthlyWage ? ` · ${fmtMoney(o.monthlyWage)}/mo` : '')
    else if (o.selfEmploymentBusinessName) desc += `${o.selfEmploymentBusinessName}` + (o.selfEmploymentIncome ? ` · ${fmtMoney(o.selfEmploymentIncome)}/mo` : '')
    if (o.reasonCode) desc = `Reason: ${o.reasonCode}`
    if (o.notes && !desc) desc = o.notes
    add(o.eventDate, o.outcomeType === 'wage_employment' ? 'wage_employment' : o.outcomeType, t, desc)
  })
  followUpsFor(db, learnerId).forEach(f => {
    const type = f.channel === 'Field visit' ? 'field_visit' : 'follow_up'
    const status = f.status === 'completed' ? 'completed' : f.dueDate < todayStr() ? 'overdue' : 'scheduled'
    add(f.status === 'completed' ? (f.completedAt || f.dueDate) : f.dueDate, type,
      `${f.channel} follow-up (${status})`, [f.reason, f.notes].filter(Boolean).join(' — '))
  })
  verificationsFor(db, learnerId).forEach(v => {
    if (v.verifiedAt) add(v.verifiedAt, 'verification', `Employer ${v.verificationStatus.replace('_', ' ')}: ${v.employerName}`, `${v.verificationMethod} · confidence ${v.confidenceScore}%${v.verifierRemarks ? ' · ' + v.verifierRemarks : ''}`)
  })
  if (l) {
    if (l.consentDate) add(l.consentDate, 'consent', `Consent given (${l.consentMethod})`, l.consentPurpose?.join(', '))
    if (l.consentLastUpdated && l.consentLastUpdated !== l.consentDate) {
      const verb = l.consentStatus === 'revoked' ? 'Consent revoked' : l.consentStatus === 'expired' ? 'Consent expired' : 'Consent updated'
      add(l.consentLastUpdated, 'consent', verb)
    }
    if (l.locationChanged) add(l.updatedAt, 'contact_update', 'Location / contact updated', l.phoneNote || '')
  }
  return items.sort((a, b) => b.date.localeCompare(a.date))
}

// ── Insights ─────────────────────────────────────────────────────────────────
export function generateInsights(db) {
  const out = []
  const courses = courseComparison(db)
  const districts = districtComparison(db)
  const providers = providerComparison(db)

  // course: high placement but low retention
  courses.forEach(c => {
    if (c.placementRate >= 60 && c.placed >= 3) {
      const courseLearners = db.learners.filter(l => courseOf(db, l.id)?.name === c.name).map(l => l.id)
      const r3 = retention(db, 3, courseLearners)
      if (r3.tracked >= 2 && r3.rate < 70) {
        out.push({ tone: 'warn', text: `${c.name} has high placement (${c.placementRate}%) but retention drops to ${r3.rate}% after 3 months — review employer quality and post-placement support.` })
      }
    }
  })
  // district skill gap
  const dg = topSkillGaps(db, {}, 'district')
  const cg = topSkillGaps(db, {}, 'course')
  dg.forEach(d => {
    const high = db.skillGaps.filter(s => s.severity === 'high' && db.learners.find(l => l.id === s.learnerId)?.district === d.name).length
    if (high >= 2) out.push({ tone: 'warn', text: `${d.name} shows a large skill gap in ${cg.length ? '' : ''}${topSkillInDistrict(db, d.name) || 'key skills'} — consider bridge modules with local employers.` })
  })
  // provider unverified
  providers.forEach(p => {
    const learners = db.learners.filter(l => providerOf(db, l.id)?.name === p.name).map(l => l.id)
    const vers = db.employerVerifications.filter(v => learners.includes(v.learnerId))
    const unverified = vers.filter(v => !['verified', 'rejected'].includes(v.verificationStatus)).length
    if (vers.length && unverified / vers.length > 0.4) {
      out.push({ tone: 'warn', text: `${p.name} has a high share of unverified employer records (${unverified}/${vers.length}) — verification drive needed.` })
    }
  })
  // strongest self-employment course
  const seByCourse = {}
  db.learners.forEach(l => {
    if (employmentStatus(db, l.id).key === 'self_employed') {
      const c = courseOf(db, l.id)?.name
      seByCourse[c] = (seByCourse[c] || 0) + 1
    }
  })
  const seEntries = Object.entries(seByCourse).sort((a, b) => b[1] - a[1])
  if (seEntries.length && seEntries[0][1] >= 2) {
    out.push({ tone: 'good', text: `Self-employment outcomes are strongest in ${seEntries[0][0]} (${seEntries[0][1]} learners) — replicate its toolkit + market-linkage support in other courses.` })
  }
  // wage growth star
  if (providers.length) {
    const star = [...providers].sort((a, b) => b.wageGrowth - a.wageGrowth)[0]
    if (star && star.wageGrowth > 0) out.push({ tone: 'good', text: `${star.name} learners show the best average wage growth (+${star.wageGrowth}% within a year of placement).` })
  }
  // consent coverage
  const noConsent = db.learners.filter(l => !consentActive(l)).length
  if (noConsent > 0) out.push({ tone: 'info', text: `${noConsent} learners have missing, expired or revoked consent — their data is hidden from person-level views and appears only in aggregates.` })
  // follow-up pressure
  const b = followUpBuckets(db)
  if (b.overdue.length) out.push({ tone: 'warn', text: `${b.overdue.length} follow-ups are overdue — oldest from ${fmtDate(b.overdue[0].dueDate)}. Clearing these improves retention data.` })

  return out.slice(0, 7)
}

function topSkillInDistrict(db, district) {
  const counts = {}
  db.skillGaps.forEach(s => {
    const l = db.learners.find(x => x.id === s.learnerId)
    if (l?.district === district) counts[s.skillName] = (counts[s.skillName] || 0) + 1
  })
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return top ? top[0] : null
}

// ── Analytics metrics (full page) ────────────────────────────────────────────
export function analyticsMetrics(db, filters) {
  const learners = applyFilters(db, filters)
  const ids = learners.map(l => l.id)
  const evts = db.outcomeEvents.filter(o => ids.includes(o.learnerId))
  const vers = db.employerVerifications.filter(v => ids.includes(v.learnerId))
  const fus = db.followUps.filter(f => ids.includes(f.learnerId))

  const placedLearners = learners.filter(l => employmentStatus(db, l.id).key === 'placed')
  const verifiedPlaced = placedLearners.filter(l => vers.some(v => v.learnerId === l.id && v.verificationStatus === 'verified'))
  const relevantJobs = evts.filter(o => o.relevanceToTraining === 'high').length
  const relevantLearners = new Set(evts.filter(o => o.relevanceToTraining === 'high').map(o => o.learnerId)).size
  const apprLearners = learners.filter(l => employmentStatus(db, l.id).key === 'apprentice' || eventsFor(db, l.id).some(o => o.outcomeType === 'apprenticeship'))
  const apprConverted = apprLearners.filter(l => eventsFor(db, l.id).some(o => o.outcomeType === 'wage_employment' && o.notes?.includes('Converted')))
  const wages = evts.filter(o => o.monthlyWage && o.outcomeType === 'wage_employment').map(o => o.monthlyWage)

  return {
    placementRate: pct(placedLearners.length, learners.length),
    verifiedPlacementRate: pct(verifiedPlaced.length, placedLearners.length || 1),
    retention: [1, 3, 6, 12].map(m => retention(db, m, ids)),
    avgPlacementWage: wages.length ? Math.round(wages.reduce((a, b) => a + b, 0) / wages.length) : 0,
    wageGrowth: avgWageGrowthFor(db, ids),
    relevantJobShare: pct(relevantLearners, placedLearners.length || 1),
    selfEmpRate: pct(learners.filter(l => employmentStatus(db, l.id).key === 'self_employed').length, learners.length),
    apprConversion: pct(apprConverted.length, apprLearners.length || 1),
    followUpCompletion: pct(fus.filter(f => f.status === 'completed').length, fus.length),
    consentCoverage: pct(learners.filter(consentActive).length, learners.length),
    employerVerRate: pct(vers.filter(v => v.verificationStatus === 'verified').length, vers.length || 1),
    completeness: completenessScore(db, learners)
  }
}

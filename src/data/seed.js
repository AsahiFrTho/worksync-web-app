// ── KaushalSetu demo data ────────────────────────────────────────────────────
// Deterministic, realistic sample data for a Maharashtra skilling programme.
// Dates are generated relative to "today" so the demo always looks current.

const DAY = 86400000

// Small seeded PRNG so generated details (phones, wages, jitter) are stable
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260826)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const between = (lo, hi) => lo + rnd() * (hi - lo)
const intBetween = (lo, hi) => Math.round(between(lo, hi))

const iso = (d) => d.toISOString().slice(0, 10)
const addDays = (dstr, n) => iso(new Date(new Date(dstr + 'T12:00:00Z').getTime() + n * DAY))
const addMonths = (dstr, m) => {
  const d = new Date(dstr + 'T12:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + m)
  return iso(d)
}
const TODAY = iso(new Date())
const ago = (days) => addDays(TODAY, -days)
const agoDays = ago
const agoMonths = (m, jitter = 0) => addDays(addMonths(TODAY, -m), jitter)

// ── Static reference data ───────────────────────────────────────────────────
export const PROVIDERS = [
  { id: 'P1', name: 'Nashik Skill Academy', district: 'Nashik', status: 'active' },
  { id: 'P2', name: 'Vidarbha Training Institute', district: 'Nagpur', status: 'active' },
  { id: 'P3', name: 'Pune Kaushal Kendra', district: 'Pune', status: 'active' }
]

export const COURSES = [
  { id: 'C1', name: 'Retail Sales Associate', sector: 'Retail', durationHours: 200, status: 'active' },
  { id: 'C2', name: 'CNC Machine Operator', sector: 'Manufacturing', durationHours: 300, status: 'active' },
  { id: 'C3', name: 'Digital Services Assistant', sector: 'IT-ITeS', durationHours: 240, status: 'active' },
  { id: 'C4', name: 'Self-Employed Tailor', sector: 'Apparel', durationHours: 180, status: 'active' }
]

export const USERS = [
  { id: 'U1', name: 'Meera Deshpande', role: 'admin', organization: 'Skill Development Mission' },
  { id: 'U2', name: 'Rahul Kulkarni', role: 'provider', organization: 'Nashik Skill Academy' },
  { id: 'U3', name: 'Sunita Wagh', role: 'coordinator', organization: 'Field Team — Nashik Division' },
  { id: 'U4', name: 'Arjun Pawar', role: 'verifier', organization: 'Employer Verification Cell' }
]

export const REASON_CODES = [
  'Relocation', 'Health issue', 'Family responsibility', 'Course mismatch', 'Low wage offer',
  'No local opportunity', 'Transport issue', 'Awaiting better opportunity', 'Not interested',
  'Employer not verified', 'Other'
]

export const SKILL_TAGS = [
  'Digital payments', 'Customer handling', 'Machine operation', 'Communication', 'Basic computer skills',
  'Safety compliance', 'Sales skills', 'Data entry', 'Tool handling', 'Soft skills'
]

export const OUTCOME_TYPES = {
  wage_employment: { label: 'Wage Employment', short: 'Placed', color: '#059669' },
  self_employment: { label: 'Self-Employment', short: 'Self-Emp', color: '#7c3aed' },
  apprenticeship: { label: 'Apprenticeship', short: 'Apprentice', color: '#0284c7' },
  higher_education: { label: 'Higher Education', short: 'Higher Ed', color: '#4f46e5' },
  unemployed: { label: 'Unemployed', short: 'Unemployed', color: '#d97706' },
  not_placed: { label: 'Not Placed', short: 'Not Placed', color: '#ea580c' },
  dropout: { label: 'Dropout / Attrition', short: 'Dropout', color: '#e11d48' },
  job_change: { label: 'Job Change', short: 'Job Change', color: '#0d9488' },
  wage_update: { label: 'Wage Progression Update', short: 'Wage Update', color: '#65a30d' },
  re_engagement: { label: 'Re-engagement', short: 'Re-engaged', color: '#2563eb' }
}

export const VERIFICATION_METHODS = [
  'Employer call', 'Employer portal response', 'Document uploaded', 'Field visit', 'Payment proof', 'Attendance/offer letter'
]

// ── Batches ─────────────────────────────────────────────────────────────────
// (provider, course, start offset months ago, label)
const BATCHES = [
  { id: 'RSA-N25A', provider: 'P1', course: 'C1', start: 18, label: 'RSA Nashik 2025-A' },
  { id: 'CNC-N25A', provider: 'P1', course: 'C2', start: 12, label: 'CNC Nashik 2025-B' },
  { id: 'Digi-N26A', provider: 'P1', course: 'C3', start: 3, label: 'Digital Nashik 2026-A' },
  { id: 'RSA-NG25A', provider: 'P2', course: 'C1', start: 9, label: 'RSA Nagpur 2025-A' },
  { id: 'Tailor-NG25A', provider: 'P2', course: 'C4', start: 8, label: 'Tailor Nagpur 2025-A' },
  { id: 'CNC-P25A', provider: 'P3', course: 'C2', start: 14, label: 'CNC Pune 2025-A' },
  { id: 'Digi-P26A', provider: 'P3', course: 'C3', start: 6, label: 'Digital Pune 2026-A' },
  { id: 'Tailor-P26A', provider: 'P3', course: 'C4', start: 4, label: 'Tailor Pune 2026-A' },
  { id: 'Digi-N26B', provider: 'P1', course: 'C3', start: 0.5, label: 'Digital Nashik 2026-B (in training)' }
]

// ── Learner specs ───────────────────────────────────────────────────────────
// outcome: sequence of events. "w" wage job, "se" self-emp, "ap" apprenticeship,
// "he" higher ed, "un" unemployed, "np" not placed, "do" dropout, "jc" job change,
// "wu" wage update (months after placement), "re" re-engagement
// c: consent 'a' active, 'r' revoked, 'e' expired, 'n' none/missing
const L = (name, gender, category, provider, batch, consent, path, notes = '') =>
  ({ name, gender, category, provider, batch, consent, path, notes })

const LEARNER_SPECS = [
  // ── Nashik Skill Academy ──────────────────────────────────────────────
  L('Snehal Jadhav', 'Female', 'OBC', 'P1', 'RSA-N25A', 'a',
    { ver: 'verified', type: 'w', employer: 'Vishal Mega Mart, Nashik', role: 'Sales Associate', wage: 11500, monthsAgo: 17, empType: 'Full-time', loc: 'Nashik', skills: ['Customer handling', 'Sales skills'], relevance: 'high', wu: [[3, 11800], [6, 12500], [12, 13800]] }),
  L('Akash Pawar', 'Male', 'SC', 'P1', 'RSA-N25A', 'a',
    { ver: 'verified', type: 'w', employer: 'Zudio, Nashik', role: 'Store Assistant', wage: 12000, monthsAgo: 17, empType: 'Full-time', loc: 'Nashik', skills: ['Customer handling', 'Soft skills'], relevance: 'high', wu: [[3, 12400]], left: { monthsAgo: 11, type: 'unemployed', reason: 'Low wage offer', note: 'Left after 6 months for a better-paying warehouse role in Mumbai; searching locally now.' } }),
  L('Pooja Patil', 'Female', 'Open', 'P1', 'RSA-N25A', 'a',
    { ver: 'verified', type: 'w', employer: 'Reliance Smart Bazaar', role: 'Cashier', wage: 13000, monthsAgo: 16, empType: 'Full-time', loc: 'Nashik', skills: ['Digital payments', 'Data entry'], relevance: 'medium', wu: [[3, 13500], [6, 14200], [12, 15000]] }),
  L('Imran Shaikh', 'Male', 'OBC', 'P1', 'RSA-N25A', 'a',
    { type: 'do', monthsAgo: 17, reason: 'Low wage offer', note: 'Offer of ₹8,500 rejected; family shop work instead.' }),
  L('Kavita Wagh', 'Female', 'ST', 'P1', 'RSA-N25A', 'a',
    { ver: 'pending', type: 'w', employer: 'FirstCry Warehouse, Nashik', role: 'Inventory Assistant', wage: 12800, monthsAgo: 16, empType: 'Full-time', loc: 'Nashik', skills: ['Data entry', 'Tool handling'], relevance: 'medium', wu: [[3, 13100], [6, 13400]], jc: { monthsAgo: 4, employer: 'Amazon Delivery Partner', role: 'Ops Assistant', wage: 15200, reason: 'Better wage' } }),
  L('Rohit Deore', 'Male', 'OBC', 'P1', 'CNC-N25A', 'a',
    { ver: 'partially_verified', type: 'w', employer: 'Sundaram Auto Components', role: 'CNC Operator', wage: 15500, monthsAgo: 11, empType: 'Full-time', loc: 'Nashik', skills: ['Machine operation', 'Safety compliance', 'Tool handling'], relevance: 'high', wu: [[3, 16400], [6, 17800]] }),
  L('Nikhil Bhoir', 'Male', 'NT-B', 'P1', 'CNC-N25A', 'a',
    { type: 'ap', employer: 'Nashik Engineering Works', role: 'Apprentice CNC Operator', wage: 9000, monthsAgo: 11, stipend: 9000, months: 12, mentor: 'Mr. S. Joshi', progress: 'Ongoing', converted: { monthsAgo: 2, employer: 'Nashik Engineering Works', role: 'CNC Operator', wage: 14800 } }),
  L('Dipti Sonawane', 'Female', 'OBC', 'P1', 'CNC-N25A', 'r',
    { ver: 'pending', type: 'w', employer: 'Mahindra Tractors, Nashik', role: 'Quality Inspector', wage: 16000, monthsAgo: 11, empType: 'Full-time', loc: 'Nashik', skills: ['Machine operation', 'Safety compliance'], relevance: 'high', wu: [[3, 16800]] },
    'Learner called in Jun 2026 and asked to stop outcome calls — consent revoked.'),
  L('Ganesh Pawar', 'Male', 'SC', 'P1', 'CNC-N25A', 'a',
    { type: 'un', monthsAgo: 10, reason: 'No local opportunity', note: 'Willing to relocate to Pune if wage > ₹14,000.' }),
  L('Rutuja Gaikwad', 'Female', 'OBC', 'P1', 'Digi-N26A', 'a',
    { ver: 'verified', type: 'w', employer: 'CSC e-Gram Services, Nashik', role: 'Digital Services Operator', wage: 11000, monthsAgo: 2, empType: 'Full-time', loc: 'Nashik', skills: ['Digital payments', 'Basic computer skills', 'Data entry'], relevance: 'high' }),
  L('Sameer Ahire', 'Male', 'Open', 'P1', 'Digi-N26A', 'a',
    { type: 'un', monthsAgo: 2, reason: 'Awaiting better opportunity', note: 'Preparing for police recruitment exam.' }),
  L('Anjali Chaudhari', 'Female', 'ST', 'P1', 'Digi-N26B', 'a', { type: 'training', note: 'Currently in training — batch ends Sep 2026.' }),

  // ── Vidarbha Training Institute (Nagpur) ──────────────────────────────
  L('Prachi Meshram', 'Female', 'OBC', 'P2', 'RSA-NG25A', 'a',
    { ver: 'verified', type: 'w', employer: 'Haldiram\u2019s, Nagpur', role: 'Counter Sales Executive', wage: 11800, monthsAgo: 8, empType: 'Full-time', loc: 'Nagpur', skills: ['Customer handling', 'Sales skills', 'Digital payments'], relevance: 'high', wu: [[3, 12400], [6, 13100]] }),
  L('Vivek Dhote', 'Male', 'SC', 'P2', 'RSA-NG25A', 'a',
    { ver: 'employer_unreachable', type: 'w', employer: 'Domino\u2019s Pizza, Nagpur', role: 'Team Member', wage: 10500, monthsAgo: 8, empType: 'Full-time', loc: 'Nagpur', skills: ['Customer handling', 'Soft skills'], relevance: 'medium', jc: { monthsAgo: 2, employer: 'Swiggy Ops Partner', role: 'Shift Supervisor', wage: 13500, reason: 'Career growth' } }),
  L('Sanika Gabhane', 'Female', 'Open', 'P2', 'RSA-NG25A', 'e',
    { type: 'un', monthsAgo: 7, reason: 'Family responsibility' },
    'Consent expired Apr 2026 — renewal SMS scheduled but not responded.'),
  L('Tushar Kale', 'Male', 'OBC', 'P2', 'RSA-NG25A', 'a',
    { type: 'do', monthsAgo: 8, reason: 'Transport issue', note: 'Workplace 22 km away; no bus connectivity after 6 pm.' }),
  L('Ayesha Khan', 'Female', 'OBC', 'P2', 'RSA-NG25A', 'n',
    { type: 'np', monthsAgo: 7, reason: 'Awaiting better opportunity' },
    'Did not sign consent form at enrolment; counsellor to revisit.'),
  L('Manisha Ingle', 'Female', 'SC', 'P2', 'Tailor-NG25A', 'a',
    { type: 'se', business: 'Maa Bhavani Tailoring Unit', nature: 'Stitching & alteration services', income: 9500, monthsAgo: 7, loc: 'Nagpur (home-based)', support: 'Toolkit + ₹5,000 seed grant', skills: ['Tool handling', 'Customer handling'], wu: [[6, 12800]] }),
  L('Shubhangi Raut', 'Female', 'OBC', 'P2', 'Tailor-NG25A', 'a',
    { type: 'se', business: 'Sai Fashion Boutique', nature: 'Boutique & school uniforms', income: 11000, monthsAgo: 7, loc: 'Nagpur', support: 'Toolkit only', skills: ['Customer handling', 'Soft skills'], wu: [[3, 12500], [6, 14200]] }),
  L('Rupali Thakre', 'Female', 'ST', 'P2', 'Tailor-NG25A', 'a',
    { type: 'un', monthsAgo: 6, reason: 'Family responsibility', note: 'Elder care at home; interested in home-based work.' }),
  L('Chetan Bansod', 'Male', 'SC', 'P2', 'Tailor-NG25A', 'a',
    { type: 'do', monthsAgo: 7, reason: 'Course mismatch', note: 'Wanted motor mechanic training; enrolled in tailoring due to seat availability.', re: { monthsAgo: 5, note: 'Counselled and migrated to Motor Mechanic course at local ITI (outside this programme). Tracking continues with consent.' } }),
  L('Bhavana Charde', 'Female', 'OBC', 'P2', 'Tailor-NG25A', 'a',
    { type: 'se', business: 'Charde Stitches', nature: 'Blouse & dress material', income: 8200, monthsAgo: 6, loc: 'Nagpur', support: 'None', skills: ['Tool handling'] }),

  // ── Pune Kaushal Kendra ───────────────────────────────────────────────
  L('Omkar Shinde', 'Male', 'OBC', 'P3', 'CNC-P25A', 'a',
    { ver: 'verified', type: 'w', employer: 'Bajaj Auto Vendor Unit, Chakan', role: 'Machine Operator', wage: 16800, monthsAgo: 13, empType: 'Full-time', loc: 'Pune', skills: ['Machine operation', 'Safety compliance'], relevance: 'high', wu: [[3, 17600], [6, 18800], [12, 20500]] }),
  L('Sagar Thorat', 'Male', 'SC', 'P3', 'CNC-P25A', 'a',
    { ver: 'verified', type: 'w', employer: 'Kinetic Engineering, Ahmednagar Rd', role: 'CNC Operator', wage: 15200, monthsAgo: 13, empType: 'Full-time', loc: 'Pune', skills: ['Machine operation', 'Tool handling'], relevance: 'high', wu: [[3, 15600], [6, 16000]], left: { monthsAgo: 2, type: 'unemployed', reason: 'Health issue', note: 'Wrist injury — on rest, plans to rejoin industry within 3 months.' } }),
  L('Tejas Kengar', 'Male', 'NT-C', 'P3', 'CNC-P25A', 'a',
    { type: 'do', monthsAgo: 12, reason: 'Health issue', note: 'Back injury during 2nd month; advised 6 months rest.' }),
  L('Vaishnavi Kale', 'Female', 'OBC', 'P3', 'CNC-P25A', 'a',
    { type: 'he', monthsAgo: 12, note: 'Admitted to Government Polytechnic Diploma (Mechanical). Pursuing higher education.' }),
  L('Harshad Mulani', 'Male', 'Open', 'P3', 'CNC-P25A', 'a',
    { ver: 'rejected', type: 'w', employer: 'Godrej Interio Plant, Pune', role: 'Production Assistant', wage: 14200, monthsAgo: 12, empType: 'Contract', loc: 'Pune', skills: ['Machine operation', 'Safety compliance'], relevance: 'medium', wu: [[3, 14800], [6, 15500]] }),
  L('Shruti Nalawade', 'Female', 'OBC', 'P3', 'Digi-P26A', 'a',
    { ver: 'verified', type: 'w', employer: 'Tejas Networks, Pune', role: 'Data Entry Operator', wage: 14500, monthsAgo: 5, empType: 'Full-time', loc: 'Pune', skills: ['Data entry', 'Basic computer skills'], relevance: 'high', wu: [[3, 15100]] }),
  L('Amit Bhosale', 'Male', 'SC', 'P3', 'Digi-P26A', 'a',
    { ver: 'partially_verified', type: 'w', employer: 'Web Werks Data Center', role: 'IT Support Trainee', wage: 13500, monthsAgo: 5, empType: 'Full-time', loc: 'Pune', skills: ['Basic computer skills'], relevance: 'medium', left: { monthsAgo: 2, type: 'unemployed', reason: 'Transport issue', note: 'Workplace 30 km away; no reliable transport after shift. Open to roles within city limits.' } }),
  L('Pooja Shirodkar', 'Female', 'Open', 'P3', 'Digi-P26A', 'r',
    { type: 'un', monthsAgo: 4, reason: 'Not interested', note: 'Moved to Mumbai after marriage; does not wish to be contacted.' }),
  L('Kiran Jagtap', 'Male', 'OBC', 'P3', 'Digi-P26A', 'n',
    { type: 'np', monthsAgo: 4, reason: 'No local opportunity' },
    'Phone number on record is wrong — needs alternate contact from family.'),
  L('Neha Kadam', 'Female', 'OBC', 'P3', 'Tailor-P26A', 'a',
    { type: 'se', business: 'Neha Creations', nature: 'Ladies wear stitching', income: 7800, monthsAgo: 3, loc: 'Pune', support: 'Toolkit + market linkage', skills: ['Customer handling', 'Digital payments'], wu: [[1, 8600]] }),
  L('Sagarika Pawar', 'Female', 'SC', 'P3', 'Tailor-P26A', 'a',
    { type: 'se', business: 'Aai Tailoring Classes', nature: 'Stitching + teaching 8 students', income: 9200, monthsAgo: 3, loc: 'Pune', support: 'Toolkit + seed grant', skills: ['Communication', 'Soft skills'] }),
  L('Rameshvar Mane', 'Male', 'ST', 'P3', 'Tailor-P26A', 'a',
    { type: 'ap', employer: 'Kasturi Garments, Pune', role: 'Apprentice Tailor', wage: 8000, monthsAgo: 3, stipend: 8000, months: 6, mentor: '', progress: 'Ongoing' }),
  L('Divya Bansode', 'Female', 'SC', 'P3', 'Tailor-P26A', 'a',
    { type: 'un', monthsAgo: 2, reason: 'Family responsibility', note: 'Young child at home; prefers work-from-home orders.' })
]

// ── Builders ────────────────────────────────────────────────────────────────
function phone() { return `9${intBetween(100000000, 999999999)}`.slice(0, 10) }

const BLOCKS = {
  Nashik: ['Dindori', 'Igatpuri', 'Sinnar', 'Niphad', 'Nashik City'],
  Nagpur: ['Hingna', 'Kamptee', 'Umred', 'Nagpur Rural', 'Nagpur City'],
  Pune: ['Haveli', 'Baramati', 'Junnar', 'Mulshi', 'Pune City']
}

export function buildSeedData() {
  const learners = []
  const enrollments = []
  const outcomeEvents = []
  const followUps = []
  const employerVerifications = []
  const skillGaps = []
  const automatedReminders = []
  let eid = 100, oid = 500, fid = 800, vid = 900, sid = 950

  LEARNER_SPECS.forEach((spec, i) => {
    const provider = PROVIDERS.find(p => p.id === spec.provider)
    const batch = BATCHES.find(b => b.id === spec.batch)
    const course = COURSES.find(c => c.id === batch.course)
    const id = `L${String(i + 1).padStart(2, '0')}`
    const uniqueId = `KS-2025-${String(1024 + i)}`
    const consentMap = {
      a: { given: true, status: 'active' }, r: { given: false, status: 'revoked' },
      e: { given: false, status: 'expired' }, n: { given: false, status: 'missing' }
    }
    const c = consentMap[spec.consent]
    const enrollStart = addMonths(TODAY, -Math.round(batch.start) - 1)

    const learner = {
      id, uniqueLearnerId: uniqueId, name: spec.name,
      phone: phone(), alternatePhone: rnd() > 0.7 ? phone() : '',
      email: `${spec.name.split(' ')[0].toLowerCase()}${i}@example.com`,
      district: provider.district,
      block: pick(BLOCKS[provider.district]),
      gender: spec.gender, category: spec.category,
      consentGiven: c.given,
      consentStatus: c.status,
      consentDate: c.given ? addDays(enrollStart, 1) : '',
      consentMethod: c.given ? pick(['Form', 'In-person', 'SMS', 'Call']) : '',
      consentPurpose: c.given ? ['Outcome tracking', 'Employer verification', 'Analytics'] : [],
      consentLastUpdated: spec.consent === 'r' ? agoMonths(2, 5) : c.given ? addDays(enrollStart, 1) : '',
      status: spec.path.type === 'training' ? 'in-training' : 'tracked',
      notes: spec.notes || '',
      phoneNote: '', locationChanged: false,
      createdAt: enrollStart, updatedAt: agoDays(intBetween(2, 60))
    }
    learners.push(learner)

    enrollments.push({
      id: `E${eid++}`, learnerId: id, courseId: course.id, providerId: provider.id,
      batchName: batch.id, batchLabel: batch.label,
      enrollmentDate: enrollStart,
      trainingStartDate: addMonths(enrollStart, 1),
      trainingEndDate: addMonths(enrollStart, 1 + Math.round(course.durationHours / 200)),
      assessmentStatus: spec.path.type === 'training' ? 'Pending' : pick(['Passed', 'Passed', 'Passed', 'Passed with distinction']),
      certificationStatus: spec.path.type === 'training' ? 'Pending' : 'Certified'
    })

    const p = spec.path
    if (p.type === 'training') {
      // learner still in training — one early follow-up scheduled
      followUps.push({
        id: `F${fid++}`, learnerId: id, dueDate: addDays(TODAY, intBetween(5, 20)),
        assignedTo: 'Sunita Wagh', channel: pick(['Call', 'SMS']), status: 'scheduled',
        contactAttemptCount: 0, reason: 'Mid-training attendance check',
        notes: '', nextActionDate: '', outcomeUpdated: false, createdAt: agoDays(10),
        employmentStatus: 'In training'
      })
      return
    }

    // ── Outcome events from the path ──
    const mkOutcome = (o) => {
      const evt = { id: `O${oid++}`, learnerId: id, source: 'Coordinator', verifiedStatus: 'not_required', createdAt: o.eventDate, tags: [], ...o }
      outcomeEvents.push(evt)
      return evt
    }

    let lastEmployerEventId = null
    let lastEmployer = null
    const dateFromMonthsAgo = (m, jitter = 3) => agoMonths(m, jitter ? intBetween(1, jitter) : 0)

    if (p.type === 'w' || p.type === 'jc') {
      // placed learners: first placement, optional wage updates, optional job change
      const startWage = p.wage
      const startDate = dateFromMonthsAgo(p.monthsAgo)
      const placementEvt = mkOutcome({
        outcomeType: 'wage_employment', eventDate: startDate,
        employerName: p.employer, jobRole: p.role, monthlyWage: startWage,
        employmentType: p.empType || 'Full-time', workLocation: p.loc || '',
        skillsUsed: p.skills || [], relevanceToTraining: p.relevance || 'high',
        verifiedStatus: 'pending', notes: ''
      })
      lastEmployerEventId = placementEvt.id
      lastEmployer = { employerName: p.employer, jobRole: p.role, wage: startWage, startDate }

      ;(p.wu || []).forEach(([m, w]) => {
        mkOutcome({
          outcomeType: 'wage_update', eventDate: addMonths(startDate, m),
          monthlyWage: w, jobRole: p.role, employerName: p.employer, notes: `Wage revision after ${m} months`,
          verifiedStatus: 'not_required'
        })
      })
      if (p.jc) {
        const jcEvt = mkOutcome({
          outcomeType: 'job_change', eventDate: dateFromMonthsAgo(p.jc.monthsAgo, 3),
          employerName: p.jc.employer, jobRole: p.jc.role, monthlyWage: p.jc.wage,
          employmentType: 'Full-time', workLocation: '', reasonCode: p.jc.reason || '',
          skillsUsed: p.skills || [], relevanceToTraining: 'medium',
          verifiedStatus: 'pending', notes: `Changed job: ${p.jc.reason || ''}`
        })
        lastEmployerEventId = jcEvt.id
        lastEmployer = { employerName: p.jc.employer, jobRole: p.jc.role, wage: p.jc.wage, startDate: dateFromMonthsAgo(p.jc.monthsAgo, 3) }
      }
      // post-placement attrition (learner left the job later)
      if (p.left) {
        const leftType = { unemployed: 'unemployed', dropout: 'dropout' }
        mkOutcome({
          outcomeType: leftType[p.left.type] || 'unemployed',
          eventDate: dateFromMonthsAgo(p.left.monthsAgo, 3),
          reasonCode: p.left.reason || 'Other', notes: p.left.note || '',
          verifiedStatus: 'not_required'
        })
      }
      // employer verification record for the latest employment
      const vs = p.ver || 'pending'
      employerVerifications.push({
        id: `V${vid++}`, outcomeEventId: lastEmployerEventId,
        learnerId: id, employerName: lastEmployer.employerName, jobRole: lastEmployer.jobRole,
        startDate: lastEmployer.startDate, wage: lastEmployer.wage,
        verificationStatus: vs,
        verificationMethod: vs === 'verified' ? pick(['Employer call', 'Document uploaded', 'Payment proof', 'Field visit']) : '',
        verifierRemarks: vs === 'verified' ? pick(['HR confirmed role & wage on call.', 'Offer letter verified against records.', 'Salary credit confirmed via bank proof.']) :
          vs === 'rejected' ? 'Wage claimed (₹19,000) not supported by payslip provided.' :
          vs === 'employer_unreachable' ? 'Two calls made; HR number busy. Field visit suggested.' :
          vs === 'partially_verified' ? 'Employer confirmed employment; wage not confirmed.' : 'Awaiting verifier action.',
        confidenceScore: vs === 'verified' ? intBetween(86, 97) : vs === 'partially_verified' ? intBetween(55, 70) : vs === 'rejected' ? 20 : null,
        verifiedBy: vs === 'verified' ? 'Arjun Pawar' : '',
        verifiedAt: vs === 'verified' ? agoDays(intBetween(20, 200)) : '',
        flagged: false
      })
    }

    if (p.type === 'se') {
      mkOutcome({
        outcomeType: 'self_employment', eventDate: dateFromMonthsAgo(p.monthsAgo),
        selfEmploymentBusinessName: p.business, selfEmploymentNature: p.nature,
        selfEmploymentIncome: p.income, workLocation: p.loc,
        selfEmploymentSupport: p.support, skillsUsed: p.skills || [],
        notes: '', verifiedStatus: 'not_required'
      })
      ;(p.wu || []).forEach(([m, inc]) => {
        mkOutcome({
          outcomeType: 'wage_update', eventDate: addMonths(dateFromMonthsAgo(p.monthsAgo), m),
          selfEmploymentBusinessName: p.business, selfEmploymentIncome: inc,
          notes: `Monthly income now ₹${inc.toLocaleString('en-IN')}`, verifiedStatus: 'not_required'
        })
      })
    }

    if (p.type === 'ap') {
      mkOutcome({
        outcomeType: 'apprenticeship', eventDate: dateFromMonthsAgo(p.monthsAgo),
        employerName: p.employer, apprenticeshipRole: p.role, apprenticeshipStipend: p.stipend,
        apprenticeshipDurationMonths: p.months, apprenticeshipMentor: p.mentor || '',
        apprenticeshipProgress: p.progress, monthlyWage: p.stipend,
        verifiedStatus: 'pending', notes: ''
      })
      employerVerifications.push({
        id: `V${vid++}`, outcomeEventId: outcomeEvents[outcomeEvents.length - 1].id,
        learnerId: id, employerName: p.employer, jobRole: p.role,
        startDate: dateFromMonthsAgo(p.monthsAgo), wage: p.stipend,
        verificationStatus: p.converted ? 'verified' : 'pending',
        verificationMethod: p.converted ? 'Employer call' : '',
        verifierRemarks: p.converted ? 'Apprenticeship completed; absorbed as CNC Operator.' : 'Awaiting apprentice agreement copy.',
        confidenceScore: p.converted ? 92 : null, verifiedBy: p.converted ? 'Arjun Pawar' : '', verifiedAt: p.converted ? agoDays(40) : '', flagged: false
      })
      if (p.converted) {
        mkOutcome({
          outcomeType: 'wage_employment', eventDate: dateFromMonthsAgo(p.converted.monthsAgo),
          employerName: p.converted.employer, jobRole: p.converted.role, monthlyWage: p.converted.wage,
          employmentType: 'Full-time', skillsUsed: ['Machine operation', 'Tool handling'],
          relevanceToTraining: 'high', verifiedStatus: 'verified',
          notes: 'Converted from apprenticeship to full-time role.'
        })
      }
    }

    if (['un', 'np', 'do'].includes(p.type)) {
      const typeMap = { un: 'unemployed', np: 'not_placed', do: 'dropout' }
      mkOutcome({
        outcomeType: typeMap[p.type], eventDate: dateFromMonthsAgo(p.monthsAgo),
        reasonCode: p.reason || 'Other', notes: p.note || '', verifiedStatus: 'not_required'
      })
    }
    if (p.type === 'he') {
      mkOutcome({ outcomeType: 'higher_education', eventDate: dateFromMonthsAgo(p.monthsAgo), notes: p.note || '', verifiedStatus: 'not_required' })
    }
    if (p.type === 'do' && p.re) {
      mkOutcome({ outcomeType: 're_engagement', eventDate: dateFromMonthsAgo(p.re.monthsAgo), notes: p.re.note, verifiedStatus: 'not_required' })
    }
  })

  // ── Two learners with changed phone / location (data quality stories) ──
  const bhavana = learners.find(l => l.name === 'Bhavana Charde')
  if (bhavana) { bhavana.updatedAt = agoDays(118); bhavana.phoneNote = 'Not reachable on last 2 calls' }
  const kiranj = learners.find(l => l.name === 'Kiran Jagtap')
  if (kiranj) { kiranj.phoneNote = 'Number switched off since Jun 2026'; kiranj.updatedAt = agoDays(95) }
  const sanika = learners.find(l => l.name === 'Sanika Gabhane')
  if (sanika) { sanika.locationChanged = true; sanika.block = 'Kamptee'; sanika.phoneNote = 'Relocated within district; number updated on call.' }

  // ── Follow-up queue ──────────────────────────────────────────────────────
  // overdue / today / upcoming / completed mix, tied to realistic learners
  const fu = (learnerName, dueOffsetDays, status, reason, attempts, notes = '', channel = 'Call', employmentStatus = '') => {
    const l = learners.find(x => x.name === learnerName)
    if (!l) return
    followUps.push({
      id: `F${fid++}`, learnerId: l.id, dueDate: addDays(TODAY, dueOffsetDays),
      assignedTo: pick(['Sunita Wagh', 'Sunita Wagh', 'Rahul Kulkarni']),
      channel, status, contactAttemptCount: attempts,
      reason, notes, nextActionDate: status === 'completed' ? '' : addDays(TODAY, Math.max(dueOffsetDays + 7, 3)),
      outcomeUpdated: status === 'completed' && rnd() > 0.4,
      completedAt: status === 'completed' ? addDays(TODAY, dueOffsetDays) : '',
      createdAt: agoDays(intBetween(10, 40)), employmentStatus
    })
  }
  // overdue
  fu('Ganesh Pawar', -12, 'scheduled', '3-month employment check — last status unemployed', 2, 'Two calls unanswered.', 'Call')
  fu('Kiran Jagtap', -8, 'scheduled', 'Consent pending + phone not reachable', 3, 'Number switched off. Try alternate contact.', 'IVR')
  fu('Sanika Gabhane', -5, 'scheduled', 'Consent renewal (expired)', 1, 'Renewal SMS sent, no response.', 'SMS')
  fu('Bhavana Charde', -17, 'scheduled', '6-month income update for tailoring unit', 2, 'Phone busy on both attempts.', 'Call')
  fu('Divya Bansode', -3, 'scheduled', 'Follow-up on family responsibility — offer home-based work', 1, '', 'WhatsApp')
  // today
  fu('Sameer Ahire', 0, 'scheduled', '1-month post-training check', 0, '', 'Call')
  fu('Pooja Shirodkar', 0, 'scheduled', 'Confirm exit from tracking (consent revoked)', 0, '', 'SMS')
  // upcoming
  fu('Rutuja Gaikwad', 4, 'scheduled', '2-month employment check after placement', 0, '', 'WhatsApp')
  fu('Neha Kadam', 7, 'scheduled', 'Income update for self-employment', 0, '', 'Call')
  fu('Rameshvar Mane', 12, 'scheduled', 'Apprenticeship mid-term progress', 0, '', 'Call')
  fu('Ayesha Khan', 15, 'scheduled', 'Consent counselling visit', 0, '', 'Field visit')
  fu('Dipti Sonawane', 21, 'scheduled', 'Quarterly consent refresh + wage update', 0, '', 'Call')
  // historical 1-month checks (needed for honest retention-at-1-month tracking)
  fu('Snehal Jadhav', -500, 'completed', '1-month check after placement', 1, 'Comfortable on shop floor.', 'Call', 'Employed')
  fu('Akash Pawar', -495, 'completed', '1-month check after placement', 1, 'Store timings adjusted as requested.', 'Call', 'Employed')
  fu('Pooja Patil', -460, 'completed', '1-month check after placement', 1, 'Cashier role going well.', 'Call', 'Employed')
  fu('Kavita Wagh', -465, 'completed', '1-month check after placement', 1, 'Learning warehouse software.', 'Call', 'Employed')
  fu('Omkar Shinde', -385, 'completed', '1-month check after placement', 1, 'Night shift initially, later moved to day.', 'Call', 'Employed')
  fu('Sagar Thorat', -390, 'completed', '1-month check after placement', 1, 'Safety training appreciated.', 'Call', 'Employed')
  fu('Harshad Mulani', -350, 'completed', '1-month check after placement', 1, 'Contract role; hopes for absorption.', 'Call', 'Employed')
  fu('Rohit Deore', -330, 'completed', '1-month check after placement', 1, 'Machine handling confident now.', 'Call', 'Employed')
  fu('Dipti Sonawane', -325, 'completed', '1-month check after placement', 1, 'Quality checks learning phase.', 'Call', 'Employed')
  fu('Prachi Meshram', -235, 'completed', '1-month check after placement', 1, 'Counter sales going well.', 'Call', 'Employed')
  fu('Vivek Dhote', -230, 'completed', '1-month check after placement', 1, 'Weekend shifts heavy but manageable.', 'Call', 'Employed')
  fu('Shruti Nalawade', -145, 'completed', '1-month check after placement', 1, 'Data entry speed improving.', 'Call', 'Employed')
  fu('Amit Bhosale', -140, 'completed', '1-month check after placement', 1, 'Networking basics being taught on the job.', 'Call', 'Employed')
  fu('Rutuja Gaikwad', -30, 'completed', '1-month check after placement', 1, 'Settled well at CSC centre; learning fast.', 'Call', 'Employed')
  fu('Kavita Wagh', -16, 'completed', 'Check after job change', 1, 'Happy with Amazon ops role; shift allowance helps.', 'WhatsApp', 'Employed')
  fu('Snehal Jadhav', -60, 'completed', '12-month wage update', 1, 'Wage ₹13,800; considering senior sales exam.', 'Call', 'Employed')
  fu('Sagar Thorat', -45, 'completed', '6-month retention check', 1, 'Wage ₹16,000; supervisor happy with work.', 'Call', 'Employed')
  // recently completed
  fu('Rohit Deore', -9, 'completed', '6-month wage update', 1, 'Employed at Sundaram Auto; wage ₹17,800 confirmed.', 'Call', 'Employed')
  fu('Prachi Meshram', -7, 'completed', '3-month retention check', 1, 'Happy with role; considering team-lead track.', 'WhatsApp', 'Employed')
  fu('Manisha Ingle', -14, 'completed', 'Income update for tailoring unit', 2, 'Monthly income up to ₹12,800; new school uniform orders.', 'Call', 'Self-employed')
  fu('Omkar Shinde', -20, 'completed', '12-month wage progression update', 1, 'Wage now ₹20,500; promoted to senior operator.', 'Call', 'Employed')
  fu('Amit Bhosale', -4, 'completed', 'Check after exit from job', 1, 'Left due to transport; wants roles within city limits. Sharing 2 vacancies.', 'WhatsApp', 'Unemployed')
  fu('Vaishnavi Kale', -11, 'completed', 'Confirm higher-education status', 1, 'Diploma 1st year going well.', 'Call', 'Higher education')

  // ── Automated reminder simulation ────────────────────────────────────────
  const rem = (learnerName, channel, sendOffsetDays, status) => {
    const l = learners.find(x => x.name === learnerName)
    if (!l) return
    automatedReminders.push({
      id: `R${sid++}`, learnerId: l.id, channel, sendDate: addDays(TODAY, sendOffsetDays), status,
      message: 'KaushalSetu: Share your current work status in 1 tap. Reply STOP to opt out.'
    })
  }
  rem('Sameer Ahire', 'WhatsApp', 0, 'sent')
  rem('Divya Bansode', 'SMS', 0, 'sent')
  rem('Rutuja Gaikwad', 'WhatsApp', 2, 'scheduled')
  rem('Neha Kadam', 'SMS', 3, 'scheduled')
  rem('Kiran Jagtap', 'IVR', -2, 'failed')
  rem('Sanika Gabhane', 'SMS', -3, 'responded')
  rem('Rameshvar Mane', 'Email', -1, 'sent')
  rem('Ayesha Khan', 'IVR', 1, 'scheduled')
  rem('Pooja Shirodkar', 'SMS', -5, 'failed')
  rem('Dipti Sonawane', 'Email', 4, 'scheduled')

  // ── Skill gaps ───────────────────────────────────────────────────────────
  const sg = (learnerName, courseId, skillName, reportedBy, severity, notes = '') => {
    const l = learners.find(x => x.name === learnerName)
    if (!l) return
    skillGaps.push({ id: `S${sid++}`, learnerId: l.id, courseId, skillName, reportedBy, severity, notes })
  }
  // reported by employers (via verification calls)
  sg('Snehal Jadhav', 'C1', 'Digital payments', 'employer', 'high', 'Struggles with UPI settlement reconciliation.')
  sg('Akash Pawar', 'C1', 'Digital payments', 'employer', 'medium', 'Needs practice with POS machine.')
  sg('Vivek Dhote', 'C1', 'Communication', 'employer', 'medium', 'English greetings adequate; local language fine.')
  sg('Prachi Meshram', 'C1', 'Sales skills', 'employer', 'low', 'Upselling ability below peers.')
  sg('Rohit Deore', 'C2', 'Basic computer skills', 'employer', 'medium', 'G-code editing needs supervision.')
  sg('Nikhil Bhoir', 'C2', 'Basic computer skills', 'employer', 'high', 'CAM software unfamiliar.')
  sg('Omkar Shinde', 'C2', 'Safety compliance', 'employer', 'low', 'Refresher on new SOP needed.')
  sg('Harshad Mulani', 'C2', 'Machine operation', 'employer', 'medium', 'Multi-axis exposure missing.')
  sg('Rutuja Gaikwad', 'C3', 'Digital payments', 'employer', 'high', 'Aadhaar-enabled payment errors.')
  sg('Amit Bhosale', 'C3', 'Communication', 'employer', 'high', 'Client interaction confidence low.')
  sg('Shruti Nalawade', 'C3', 'Data entry', 'employer', 'low', 'Speed adequate, accuracy good.')
  // reported by learners (self-assessment in follow-ups)
  sg('Sameer Ahire', 'C3', 'Basic computer skills', 'learner', 'high', 'Wants Tally + Excel practice.')
  sg('Kavita Wagh', 'C1', 'Communication', 'learner', 'medium', 'Hesitant speaking with customers.')
  sg('Ganesh Pawar', 'C2', 'Machine operation', 'learner', 'high', 'Only 2 weeks on live machine during training.')
  sg('Rupali Thakre', 'C4', 'Digital payments', 'learner', 'medium', 'Takes payments in cash only.')
  sg('Divya Bansode', 'C4', 'Customer handling', 'learner', 'medium', 'Uncomfortable negotiating prices.')
  sg('Neha Kadam', 'C4', 'Digital payments', 'learner', 'medium', 'Started UPI; wants QR display setup help.')
  sg('Sagarika Pawar', 'C4', 'Soft skills', 'learner', 'low', 'Managing students is new to her.')
  sg('Manisha Ingle', 'C4', 'Sales skills', 'learner', 'medium', 'Wants help marketing on WhatsApp.')

  return {
    providers: PROVIDERS, courses: COURSES, users: USERS,
    learners, enrollments, outcomeEvents, followUps, employerVerifications,
    skillGaps, automatedReminders,
    settings: {
      programName: 'KaushalSetu — Skill Development Mission',
      districts: ['Nashik', 'Nagpur', 'Pune'],
      reasonCodes: REASON_CODES,
      skillTags: SKILL_TAGS,
      consentPolicy: 'Learner consent is taken before enrolment completes and covers outcome tracking, employer verification and programme analytics. Consent is valid for 24 months and can be revoked any time via call, SMS or in person. When consent is not active, personal identifiers are hidden and the learner appears only in aggregate, pseudonymised form.',
      retentionPeriodMonths: 36,
      notificationRules: { followUpSameDay: true, overdueDigest: 'Daily 9:00 AM to coordinator', consentExpiryReminderDays: 30, channels: ['SMS', 'WhatsApp', 'Email', 'IVR'] }
    }
  }
}

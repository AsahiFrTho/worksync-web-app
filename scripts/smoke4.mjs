import { JSDOM } from 'jsdom'
import fs from 'fs'
import path from 'path'
const html = fs.readFileSync('dist/index.html', 'utf8')
const js = fs.readFileSync(fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => path.join('dist/assets', f))[0], 'utf8')
const dom = new JSDOM(html, { url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only',
  beforeParse(window) {
    window.matchMedia = q => ({ matches:false, media:q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){return false} })
    window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} }
    window.__errs = []
    window.addEventListener('error', e => window.__errs.push(String(e.error?.stack || e.message)))
  }})
const { window } = dom
window.eval(js)
const sleep = ms => new Promise(r => setTimeout(r, ms))

// login FIRST
window.history.pushState({}, '', '/')
window.dispatchEvent(new window.PopStateEvent('popstate'))
await sleep(300)
const enter = [...window.document.querySelectorAll('button')].find(b => b.textContent.includes('Enter as'))
enter?.click(); await sleep(400)

const checks = [
  ['/dashboard', 'Programme Dashboard'], ['/dashboard', 'Outcome distribution'], ['/dashboard', 'Wage progression'],
  ['/dashboard', 'Retention after placement'], ['/dashboard', 'Top skill gaps'], ['/dashboard', 'Placement trend'],
  ['/learners', 'KS-2025-'], ['/learners', 'Consent revoked'],
  ['/learners/L01', 'Learner timeline'], ['/learners/L01', 'Consent record'], ['/learners/L01', 'Employment & income history'],
  ['/learners/L08', 'Privacy protection active'],
  ['/followups', 'Follow-up queue'], ['/followups', 'Automated reminders'], ['/followups', 'overdue'],
  ['/verification', 'Employer Verification'], ['/verification', 'Confidence'], ['/verification', 'Pending'],
  ['/skillgaps', 'Skill Gap Analysis'], ['/skillgaps', 'Recommendations'], ['/skillgaps', 'job role mismatch'],
  ['/analytics', 'Analytics & Impact'], ['/analytics', 'Insights'], ['/analytics', 'Cohort analysis'], ['/analytics', 'Demographic insights'],
  ['/analytics', 'Placement rate'], ['/analytics', 'Consent coverage'],
  ['/scorecard', 'Provider Scorecard'], ['/scorecard', 'Strong'], ['/scorecard', 'Needs attention'], ['/scorecard', 'Verified placement'],
  ['/dataquality', 'Data Quality'], ['/dataquality', 'completeness'],
  ['/settings', 'Consent policy'], ['/settings', 'Notification rules'], ['/settings', 'Outcome reason codes'],
]
let fails = 0
for (const [route, marker] of checks) {
  window.history.pushState({}, '', route)
  window.dispatchEvent(new window.PopStateEvent('popstate'))
  await sleep(300)
  const ok = window.document.body.textContent.includes(marker)
  if (!ok) { fails++; console.log(`MISSING on ${route}: "${marker}"`) }
}
if (window.__errs.length) { console.log('RUNTIME ERRORS:', window.__errs.slice(0, 5)); fails++ }
console.log(fails ? `FAILED ${fails}` : 'ALL 36 CONTENT CHECKS PASSED')

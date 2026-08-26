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
    window.confirm = () => true
  }})
const { window } = dom
const { document } = window
window.eval(js)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const go = async (r) => { window.history.pushState({}, '', r); window.dispatchEvent(new window.PopStateEvent('popstate')); await sleep(300) }
const byText = (sel, txt) => [...document.querySelectorAll(sel)].find(b => b.textContent.includes(txt))
let fails = 0
const check = (cond, msg) => { if (!cond) { fails++; console.log('FAIL:', msg) } else console.log('ok:', msg) }

// login as admin
await go('/'); await sleep(250)
byText('button', 'Enter as')?.click(); await sleep(400)

// ── 1. Follow-up: mark contacted with status update ──
await go('/followups')
const overdueTab = byText('button', 'Overdue'); overdueTab?.click(); await sleep(250)
const contactBtn = byText('button', 'Contacted'); check(!!contactBtn, 'found a Contacted button in overdue tab')
contactBtn?.click(); await sleep(300)
check(!!byText('h3', 'Log contact'), 'contact modal opened')
// select employment status = Employed
const selects = [...document.querySelectorAll('select')]
const statusSel = selects[0]
statusSel.value = 'Employed'; statusSel.dispatchEvent(new window.Event('change', { bubbles: true })); await sleep(150)
byText('button', 'Mark contacted')?.click(); await sleep(300)
check(document.body.textContent.includes('Recently completed'), 'still on follow-ups page after completing')
const completedTab = byText('button', 'Recently completed'); completedTab?.click(); await sleep(250)
check(document.body.textContent.includes('Ganesh Pawar') || document.body.textContent.includes('Learner'), 'completed follow-up visible in completed tab')

// ── 2. Employer verification: approve one ──
await go('/verification')
const approveBtn = byText('button', 'Approve'); check(!!approveBtn, 'found Approve button')
approveBtn?.click(); await sleep(300)
check(!!byText('h3', 'Approve employer record'), 'approve modal opened')
byText('button', 'Approve employer record')?.click(); await sleep(300)
const verifiedTab = byText('button', 'Verified'); verifiedTab?.click(); await sleep(250)
check(document.body.textContent.includes('confidence'), 'verified tab shows records with confidence')

// ── 3. Learner profile → add outcome (2-step) ──
await go('/learners/L01')
const addOutcome = byText('button', 'Add outcome'); check(!!addOutcome, 'add outcome button on profile')
addOutcome?.click(); await sleep(300)
// step 1: pick type "Wage Update" tile & continue
const tiles = [...document.querySelectorAll('button')].filter(b => b.textContent.includes('Wage Update'))
check(tiles.length > 0, 'outcome type tiles visible')
tiles[tiles.length - 1]?.click(); await sleep(150)
// set date
const dateInputs = [...document.querySelectorAll('input[type=date]')]
if (dateInputs[0]) { dateInputs[0].value = new Date().toISOString().slice(0,10); dateInputs[0].dispatchEvent(new window.Event('change', { bubbles: true })) ; await sleep(100) }
const cont = byText('button', 'Continue'); cont?.click(); await sleep(250)
check(document.body.textContent.includes('New monthly wage'), 'step 2 shows wage field')
const numInput = [...document.querySelectorAll('input[type=number]')].find(i => i.placeholder.includes('15500'))
check(!!numInput, 'wage input present')
if (numInput) { numInput.value = '15000'; numInput.dispatchEvent(new window.Event('input', { bubbles: true })); await sleep(150) }
byText('button', 'Save outcome')?.click(); await sleep(350)
check(document.body.textContent.includes('Wage update'), 'wage update visible on profile timeline/history after save')

// ── 4. Consent update on a revoked learner ──
await go('/learners/L08')
check(document.body.textContent.includes('Privacy protection active'), 'revoked learner shows privacy banner')
const consentBtn = byText('button', 'Consent'); consentBtn?.click(); await sleep(300)
const cSelects = [...document.querySelectorAll('select')]
if (cSelects[0]) { cSelects[0].value = 'active'; cSelects[0].dispatchEvent(new window.Event('change', { bubbles: true })); await sleep(150) }
byText('button', 'Save consent')?.click(); await sleep(300)
check(!document.body.textContent.includes('Privacy protection active'), 'privacy banner gone after consent reactivated')
check(document.body.textContent.includes('Dipti Sonawane'), 'real name visible after consent active')

if (window.__errs.length) { console.log('RUNTIME ERRORS:', window.__errs.slice(0,5)); fails++ }
console.log(fails ? `\n${fails} FAILURES` : '\nALL INTERACTION TESTS PASSED')

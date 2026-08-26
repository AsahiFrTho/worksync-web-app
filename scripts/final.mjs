import { JSDOM } from 'jsdom'
import fs from 'fs'
import path from 'path'
const html = fs.readFileSync('dist/index.html', 'utf8')
const js = fs.readFileSync(fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => path.join('dist/assets', f))[0], 'utf8')
const dom = new JSDOM(html, { url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only',
  beforeParse(window) {
    window.matchMedia = q => ({ matches:false, media:q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){return false} })
    window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} }
  }})
const { window } = dom
window.eval(js)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const routes = ['/dashboard','/learners','/learners/L01','/learners/L02','/learners/L05','/learners/L08','/learners/L20','/followups','/verification','/skillgaps','/analytics','/scorecard','/dataquality','/settings']
window.history.pushState({}, '', '/'); window.dispatchEvent(new window.PopStateEvent('popstate')); await sleep(250)
;[...window.document.querySelectorAll('button')].find(b => b.textContent.includes('Enter as'))?.click(); await sleep(350)
let bad = 0
for (const r of routes) {
  window.history.pushState({}, '', r); window.dispatchEvent(new window.PopStateEvent('popstate')); await sleep(300)
  const t = window.document.body.textContent
  const issues = []
  if (/\bundefined\b/.test(t)) issues.push('undefined')
  if (/\bNaN\b/.test(t)) issues.push('NaN')
  const svgCount = window.document.querySelectorAll('svg.recharts-surface').length
  if (issues.length) { bad++; console.log(r, '→', issues.join(','), '| text snippet:', t.match(/.{0,40}(undefined|NaN).{0,40}/)?.[0]) }
  else console.log('clean', r, svgCount ? `(${svgCount} charts)` : '')
}
console.log(bad ? `${bad} pages leak bad values` : 'ALL PAGES CLEAN')

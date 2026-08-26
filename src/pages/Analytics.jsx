import React, { useMemo, useState } from 'react'
import { Sparkles, TrendingUp } from 'lucide-react'
import { useStore } from '../data/store'
import {
  DEFAULT_FILTERS, analyticsMetrics, generateInsights, wageProgressionSeries, retentionSeries,
  reasonCounts, courseComparison, providerComparison, districtComparison, applyFilters,
  employmentStatus, courseOf, providerOf, fmtMoney, consentActive, retention
} from '../data/compute'
import { Card, CardHeader, Badge, Table, ProgressBar } from '../components/ui'
import { TrendArea, BarsV, BarsH } from '../components/Charts'
import FilterBar from '../components/FilterBar'

function Metric({ label, value, sub, tone = 'text-ink' }) {
  return (
    <div className="px-4 py-3 border border-slate-100 rounded-xl bg-slate-50/60">
      <div className={`text-[19px] font-bold ${tone}`}>{value}</div>
      <div className="text-[11.5px] font-semibold text-slate-500 leading-tight mt-0.5">{label}</div>
      {sub && <div className="text-[10.5px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function GroupTable({ title, sub, rows }) {
  return (
    <Card>
      <CardHeader title={title} sub={sub} />
      <Table>
        <thead>
          <tr>
            <th className="th">{title.split(' ')[0]}</th>
            <th className="th">Learners</th>
            <th className="th">Placed</th>
            <th className="th">Placement rate</th>
            <th className="th">Verified placement</th>
            <th className="th">Wage growth</th>
            <th className="th">Completeness</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.name} className="hover:bg-slate-50">
              <td className="td font-medium">{r.name}</td>
              <td className="td">{r.total}</td>
              <td className="td">{r.placed}</td>
              <td className="td"><div className="flex items-center gap-2 min-w-[110px]"><ProgressBar value={r.placementRate} className="flex-1" /><span className="text-[12px] font-semibold w-8">{r.placementRate}%</span></div></td>
              <td className="td"><span className="font-semibold">{r.verifiedRate}%</span> <span className="text-[11px] text-slate-400">of placed</span></td>
              <td className="td"><span className={`font-semibold ${r.wageGrowth >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{r.wageGrowth >= 0 ? '+' : ''}{r.wageGrowth}%</span></td>
              <td className="td">{r.completeness}%</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

export default function Analytics() {
  const db = useStore()
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS })

  const m = useMemo(() => analyticsMetrics(db, filters), [db, filters])
  const insights = useMemo(() => generateInsights(db), [db])
  const wage = useMemo(() => wageProgressionSeries(db, filters), [db, filters])
  const ret = useMemo(() => retentionSeries(db, filters), [db, filters])
  const reasonsNP = useMemo(() => reasonCounts(db, filters, ['unemployed', 'not_placed']).slice(0, 6), [db, filters])
  const reasonsAttr = useMemo(() => reasonCounts(db, filters, ['dropout']).slice(0, 6), [db, filters])
  const providers = useMemo(() => providerComparison(db, filters), [db, filters])
  const courses = useMemo(() => courseComparison(db, filters), [db, filters])
  const districts = useMemo(() => districtComparison(db, filters), [db, filters])

  // cohort analysis by batch
  const cohorts = useMemo(() => {
    const learners = applyFilters(db, filters)
    const batches = {}
    learners.forEach(l => {
      const e = db.enrollments.find(x => x.learnerId === l.id)
      if (!e) return
      batches[e.batchName] = batches[e.batchName] || { label: e.batchLabel, provider: providerOf(db, l.id)?.name, learners: [] }
      batches[e.batchName].learners.push(l)
    })
    return Object.entries(batches).map(([batch, b]) => {
      const ids = b.learners.map(l => l.id)
      const placed = b.learners.filter(l => employmentStatus(db, l.id).key === 'placed').length
      const vers = db.employerVerifications.filter(v => ids.includes(v.learnerId) && v.verificationStatus === 'verified').length
      const ret3 = retentionSafe(db, 3, ids)
      return {
        batch, ...b, placed,
        placementRate: b.learners.length ? Math.round(placed / b.learners.length * 100) : 0,
        verifiedRate: placed ? Math.round(vers / placed * 100) : 0,
        retention3: ret3,
        consent: Math.round(b.learners.filter(consentActive).length / b.learners.length * 100)
      }
    }).sort((a, b2) => a.batch.localeCompare(b2.batch))
  }, [db, filters])

  // demographics
  const demo = useMemo(() => {
    const learners = applyFilters(db, filters)
    const grp = (key) => {
      const g = {}
      learners.forEach(l => { (g[l[key]] = g[l[key]] || []).push(l) })
      return Object.entries(g).map(([name, ls]) => ({
        name, total: ls.length,
        placed: ls.filter(l => employmentStatus(db, l.id).key === 'placed').length
      })).map(x => ({ ...x, rate: x.total ? Math.round(x.placed / x.total * 100) : 0 }))
    }
    return { gender: grp('gender'), category: grp('category') }
  }, [db, filters])

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink">Analytics & Impact</h1>
        <p className="text-[13px] text-slate-500">Programme-level outcome measurement — every number is filterable and traceable to learner records</p>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} />

      {/* Insights panel */}
      <Card className="mb-4 border-navy-200 bg-navy-50/40">
        <CardHeader title="Insights" sub="Auto-generated observations from the current data" right={<Sparkles size={16} className="text-saffron-500" />} />
        <div className="px-5 pb-4 grid md:grid-cols-2 gap-2.5">
          {insights.map((ins, i) => (
            <div key={i} className={`rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed border ${ins.tone === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-800' : ins.tone === 'good' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'}`}>
              {ins.text}
            </div>
          ))}
        </div>
      </Card>

      {/* headline metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
        <Metric label="Placement rate" value={`${m.placementRate}%`} sub="wage-employed" />
        <Metric label="Verified placement rate" value={`${m.verifiedPlacementRate}%`} sub="of placed, employer-confirmed" />
        <Metric label="Avg wage at placement" value={fmtMoney(m.avgPlacementWage)} sub="monthly" />
        <Metric label="Wage growth" value={`${m.wageGrowth >= 0 ? '+' : ''}${m.wageGrowth}%`} sub="first → latest wage" tone="text-emerald-700" />
        <Metric label="Relevant-job share" value={`${m.relevantJobShare}%`} sub="high-relevance roles" />
        <Metric label="Self-employment rate" value={`${m.selfEmpRate}%`} />
        <Metric label="Apprenticeship conversion" value={`${m.apprConversion}%`} sub="to wage jobs" />
        <Metric label="Follow-up completion" value={`${m.followUpCompletion}%`} />
        <Metric label="Consent coverage" value={`${m.consentCoverage}%`} sub="active consent" />
        <Metric label="Employer verification" value={`${m.employerVerRate}%`} sub="records verified" />
        <Metric label="Data completeness" value={`${m.completeness}%`} />
        <Metric label="Retention @3mo" value={`${m.retention[1]?.rate ?? 0}%`} sub="of tracked" />
      </div>

      {/* progression charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader title="Wage progression" sub="Average monthly income of employed learners over time" right={<TrendingUp size={16} className="text-emerald-600" />} />
          <div className="px-3 pb-4"><TrendArea data={wage} lines={[{ key: 'wage', name: 'Avg wage', color: '#65a30d' }]} yFormatter={v => '₹' + (v / 1000).toFixed(1) + 'k'} /></div>
        </Card>
        <Card>
          <CardHeader title="Retention progression" sub="Still employed at 1 / 3 / 6 / 12 months after placement" />
          <div className="px-3 pb-4"><BarsV data={ret} xKey="month" barKey="rate" name="Retention" color="#0d9488" yFormatter={v => v + '%'} /></div>
          <p className="px-5 pb-4 text-[11.5px] text-slate-400">
            {m.retention.map(r => `${r.month}mo: ${r.rate}% of ${r.tracked} tracked${r.eligible - r.tracked ? ` (${r.eligible - r.tracked} not tracked)` : ''}`).join(' · ')}
          </p>
        </Card>
      </div>

      {/* comparisons */}
      <div className="space-y-4 mb-4">
        <GroupTable title="Course performance" sub="Placement and quality outcomes by course" rows={courses} />
        <div className="grid lg:grid-cols-2 gap-4">
          <GroupTable title="Provider comparison" sub="Across training providers" rows={providers} />
          <GroupTable title="District comparison" sub="Across districts" rows={districts} />
        </div>
      </div>

      {/* cohort + demographics */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader title="Cohort analysis" sub="Batch-level outcomes — the longitudinal view" />
          <Table>
            <thead>
              <tr><th className="th">Batch</th><th className="th">Learners</th><th className="th">Placed</th><th className="th">Placement</th><th className="th">Verified</th><th className="th">Retention 3mo</th><th className="th">Consent</th></tr>
            </thead>
            <tbody>
              {cohorts.map(c => (
                <tr key={c.batch} className="hover:bg-slate-50">
                  <td className="td">
                    <span className="font-mono text-[12px] font-semibold text-navy-800">{c.batch}</span>
                    <div className="text-[11px] text-slate-400">{c.provider}</div>
                  </td>
                  <td className="td">{c.learners.length}</td>
                  <td className="td">{c.placed}</td>
                  <td className="td"><span className="font-semibold">{c.placementRate}%</span></td>
                  <td className="td">{c.placed ? `${c.verifiedRate}%` : '—'}</td>
                  <td className="td">{c.retention3.rate ? `${c.retention3.rate}%` : '—'}</td>
                  <td className="td">{c.consent}%</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Demographic insights" sub="Placement rate by gender and social category" />
          <div className="grid grid-cols-2 gap-2 px-5 pb-4">
            <div>
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-slate-400 mb-1">By gender</p>
              {demo.gender.map(g => (
                <div key={g.name} className="py-1.5">
                  <div className="flex justify-between text-[12.5px] mb-1"><span className="font-medium">{g.name}</span><span className="text-slate-500">{g.placed}/{g.total} · {g.rate}%</span></div>
                  <ProgressBar value={g.rate} tone="bg-navy-600" />
                </div>
              ))}
            </div>
            <div>
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-slate-400 mb-1">By category</p>
              {demo.category.map(g => (
                <div key={g.name} className="py-1.5">
                  <div className="flex justify-between text-[12.5px] mb-1"><span className="font-medium">{g.name}</span><span className="text-slate-500">{g.placed}/{g.total} · {g.rate}%</span></div>
                  <ProgressBar value={g.rate} tone="bg-emerald-600" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* reasons */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Reasons for non-placement" sub="Unemployed + not-placed reason codes" />
          <div className="px-3 pb-4">{reasonsNP.length ? <BarsH data={reasonsNP} barKey="value" name="Learners" color="#ea580c" /> : <p className="text-[13px] text-slate-400 px-3">No data.</p>}</div>
        </Card>
        <Card>
          <CardHeader title="Reasons for attrition / dropout" sub="Dropout reason codes" />
          <div className="px-3 pb-4">{reasonsAttr.length ? <BarsH data={reasonsAttr} barKey="value" name="Learners" color="#e11d48" /> : <p className="text-[13px] text-slate-400 px-3">No data.</p>}</div>
        </Card>
      </div>
    </div>
  )
}

function retentionSafe(db, months, ids) {
  return retention(db, months, ids)
}

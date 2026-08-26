import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, ShieldCheck, Briefcase, Store, Wrench, PhoneCall, BadgeCheck,
  TrendingUp, HeartPulse, ClipboardCheck
} from 'lucide-react'
import { useStore } from '../data/store'
import { DEFAULT_FILTERS, kpis, outcomeDistribution, placementTrend, wageProgressionSeries, retentionSeries, topSkillGaps, reasonCounts, providerComparison, courseComparison, districtComparison, fmtMoney } from '../data/compute'
import { Card, CardHeader, StatCard, Tabs } from '../components/ui'
import { OutcomeDonut, TrendArea, BarsV, BarsH } from '../components/Charts'
import FilterBar from '../components/FilterBar'

export default function Dashboard() {
  const db = useStore()
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS })
  const [cmp, setCmp] = useState('provider')
  const nav = useNavigate()

  const k = useMemo(() => kpis(db, filters), [db, filters])
  const dist = useMemo(() => outcomeDistribution(db, filters), [db, filters])
  const trend = useMemo(() => placementTrend(db, filters), [db, filters])
  const wage = useMemo(() => wageProgressionSeries(db, filters), [db, filters])
  const ret = useMemo(() => retentionSeries(db, filters), [db, filters])
  const gaps = useMemo(() => topSkillGaps(db, filters).slice(0, 6), [db, filters])
  const reasons = useMemo(() => reasonCounts(db, filters).slice(0, 6), [db, filters])
  const cmpData = useMemo(() => {
    const src = cmp === 'provider' ? providerComparison(db, filters) : cmp === 'course' ? courseComparison(db, filters) : districtComparison(db, filters)
    return src.filter(d => d.total > 0).map(d => ({ name: d.name.length > 22 ? d.name.slice(0, 20) + '…' : d.name, rate: d.placementRate, learners: d.total }))
  }, [db, filters, cmp])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Programme Dashboard</h1>
          <p className="text-[13px] text-slate-500">Key outcomes across the skilling ecosystem · numbers update live with every entry</p>
        </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} />

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 mb-3">
        <StatCard label="Total learners" value={k.total} icon={Users} tone="navy" />
        <StatCard label="Consented learners" value={`${k.consented}/${k.total}`} icon={ShieldCheck} tone="emerald" sub="active consent" />
        <StatCard label="Placed (wage)" value={k.placed} icon={Briefcase} tone="emerald" />
        <StatCard label="Self-employed" value={k.selfEmp} icon={Store} tone="violet" />
        <StatCard label="In apprenticeship" value={k.appr} icon={Wrench} tone="sky" />
      </div>
      {/* KPI row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
        <StatCard label="Need follow-up" value={k.needFollowUp} icon={PhoneCall} tone="amber" onClick={() => nav('/followups')} />
        <StatCard label="Pending verifications" value={k.pendingVer} icon={BadgeCheck} tone="orange" onClick={() => nav('/verification')} />
        <StatCard label="Avg wage progression" value={`${k.avgWageGrowth >= 0 ? '+' : ''}${Math.round(k.avgWageGrowth * 100)}%`} icon={TrendingUp} tone="lime" sub="since first wage" />
        <StatCard label="Retention @ 3 months" value={`${k.retention3}%`} icon={HeartPulse} tone="teal" />
        <StatCard label="Data completeness" value={`${k.completeness}%`} icon={ClipboardCheck} tone="slate" onClick={() => nav('/dataquality')} />
      </div>

      {/* charts */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader title="Outcome distribution" sub="Latest known status per learner" />
          <div className="px-2 pb-3">
            <OutcomeDonut data={dist} />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Placement trend by month" sub="New wage placements recorded per month (15 months)" />
          <div className="px-3 pb-4">
            <BarsV data={trend} xKey="month" barKey="placements" name="Placements" color="#24506e" height={250} />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader title="Wage progression over time" sub="Average monthly income of employed learners" />
          <div className="px-3 pb-4">
            <TrendArea data={wage} lines={[{ key: 'wage', name: 'Avg monthly wage', color: '#65a30d' }]} height={240} yFormatter={v => '₹' + (v / 1000).toFixed(1) + 'k'} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Retention after placement" sub="Share of tracked learners still employed" />
          <div className="px-3 pb-4">
            <BarsV data={ret} xKey="month" barKey="rate" name="Retention %" color="#0d9488" height={240} yFormatter={v => v + '%'} />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Top skill gaps" sub="Reported by employers & learners" right={<Link to="/skillgaps" className="text-[12px] font-medium text-navy-700 hover:underline">Details →</Link>} />
          <div className="px-3 pb-4">
            {gaps.length ? <BarsH data={gaps} barKey="total" name="Reports" color="#7c3aed" /> : <p className="text-[13px] text-slate-400 px-3 pb-4">No skill gaps reported in this selection.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="Reasons for non-placement & dropout" sub="From recorded reason codes" />
          <div className="px-3 pb-4">
            {reasons.length ? <BarsH data={reasons} barKey="value" name="Learners" color="#e11d48" /> : <p className="text-[13px] text-slate-400 px-3 pb-4">No non-placement records in this selection.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="Comparison" sub="Placement rate with learner counts" />
          <div className="px-4 pb-2">
            <Tabs tabs={[{ id: 'provider', label: 'Provider' }, { id: 'course', label: 'Course' }, { id: 'district', label: 'District' }]} active={cmp} onChange={setCmp} />
          </div>
          <div className="px-3 pb-4">
            <BarsV data={cmpData} xKey="name" barKey="rate" name="Placement rate" color="#2b6488" height={220} yFormatter={v => v + '%'} angle={cmp === 'course' ? 0 : 18} />
          </div>
        </Card>
      </div>
    </div>
  )
}

import React, { useMemo } from 'react'
import { Building2, Award } from 'lucide-react'
import { useStore } from '../data/store'
import { providerScorecards } from '../data/compute'
import { Card, CardHeader, Badge, ProgressBar, Table } from '../components/ui'

const BADGE_TONES = { 'Strong': 'emerald', 'Improving': 'amber', 'Needs attention': 'rose' }
const BADGE_STYLE = {
  'Strong': 'bg-emerald-600 text-white',
  'Improving': 'bg-amber-500 text-white',
  'Needs attention': 'bg-rose-600 text-white'
}

function MiniBar({ value, invert = false }) {
  const tone = invert
    ? (value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-rose-500')
    : (value >= 70 ? 'bg-emerald-500' : value >= 45 ? 'bg-amber-500' : 'bg-rose-500')
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <ProgressBar value={value} tone={tone} className="flex-1" />
      <span className="text-[12px] font-semibold w-9 text-right">{value}%</span>
    </div>
  )
}

export default function Scorecard() {
  const db = useStore()
  const cards = useMemo(() => providerScorecards(db), [db])
  const best = [...cards].sort((a, b) => b.composite - a.composite)[0]

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink">Provider Scorecard</h1>
        <p className="text-[13px] text-slate-500">Accountability view — outcome quality, data hygiene and verification per training provider</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {cards.map(c => (
          <Card key={c.provider.id} className="overflow-hidden">
            <div className={`px-5 py-4 flex items-center justify-between ${BADGE_STYLE[c.badge]}`}>
              <div className="flex items-center gap-2.5">
                <Building2 size={18} />
                <div>
                  <div className="font-bold text-[14.5px] leading-tight">{c.provider.name}</div>
                  <div className="text-[11px] opacity-80">{c.provider.district} · {c.learners} learners</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[22px] font-extrabold leading-none">{c.composite}</div>
                <div className="text-[10px] uppercase tracking-wide opacity-80">score</div>
              </div>
            </div>
            <div className="px-5 py-3.5 space-y-2">
              {[
                ['Placement rate', c.placementRate], ['Verified placement', c.verifiedRate],
                ['Retention (3 mo)', c.retentionRate], ['Data completeness', c.completeness],
                ['Follow-up completion', c.followUpRate], ['Employer verification', c.employerVerRate]
              ].map(([label, v]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[12px] text-slate-500 w-[132px] shrink-0">{label}</span>
                  <MiniBar value={v} />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-slate-500 w-[132px] shrink-0">Avg wage growth</span>
                <span className={`text-[13px] font-bold ${c.wageGrowth >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>+{c.wageGrowth}%</span>
                <span className="text-[12px] text-slate-500 ml-6">Skill gap score</span>
                <span className="text-[13px] font-bold">{c.gapScore}</span>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <Badge tone={BADGE_TONES[c.badge]} className="text-[12px]">{c.badge}</Badge>
              {best?.provider.id === c.provider.id && <span className="text-[11.5px] text-slate-400 flex items-center gap-1"><Award size={12} className="text-saffron-500" /> best performer</span>}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="All metrics, side by side" sub="Composite = outcome quality 40% · data & verification 35% · follow-up & gaps 25%" />
        <Table className="min-w-[980px]">
          <thead>
            <tr>
              <th className="th">Provider</th><th className="th">Learners</th><th className="th">Placement</th>
              <th className="th">Verified placement</th><th className="th">Retention 3mo</th><th className="th">Wage growth</th>
              <th className="th">Completeness</th><th className="th">Follow-ups</th><th className="th">Verification</th>
              <th className="th">Gap score</th><th className="th">Badge</th>
            </tr>
          </thead>
          <tbody>
            {cards.map(c => (
              <tr key={c.provider.id} className="hover:bg-slate-50">
                <td className="td font-medium">{c.provider.name}</td>
                <td className="td">{c.learners}</td>
                <td className="td">{c.placementRate}%</td>
                <td className="td">{c.verifiedRate}%</td>
                <td className="td">{c.retentionRate}%</td>
                <td className="td text-emerald-700 font-semibold">+{c.wageGrowth}%</td>
                <td className="td">{c.completeness}%</td>
                <td className="td">{c.followUpRate}%</td>
                <td className="td">{c.employerVerRate}%</td>
                <td className="td">{c.gapScore}</td>
                <td className="td"><Badge tone={BADGE_TONES[c.badge]}>{c.badge}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}

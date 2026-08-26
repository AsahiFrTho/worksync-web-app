import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react'
import { useStore } from '../data/store'
import { dataQualityIssues, completenessScore, providerOf, courseOf, consentActive, displayName } from '../data/compute'
import { Card, CardHeader, Badge, Table, Tabs, ProgressBar, StatCard } from '../components/ui'

const ISSUE_META = {
  consent: { label: 'Missing / inactive consent', tone: 'rose', hint: 'Personal data stays hidden until consent is active' },
  outcome: { label: 'No outcome recorded', tone: 'amber', hint: 'Training completed but no outcome event exists' },
  phone: { label: 'Unreachable / outdated phone', tone: 'amber', hint: 'Contact attempts failing — find alternate contact' },
  employer: { label: 'Incomplete employer verification', tone: 'sky', hint: 'Placement claims without employer confirmation' },
  wage: { label: 'Missing wage information', tone: 'violet', hint: 'Employed but wage data never captured' },
  stale: { label: 'Not updated in 90+ days', tone: 'slate', hint: 'Record going cold — schedule a follow-up' }
}

export default function DataQuality() {
  const db = useStore()
  const [tab, setTab] = useState('all')
  const issues = useMemo(() => dataQualityIssues(db), [db])
  const score = completenessScore(db, db.learners)

  const counts = useMemo(() => {
    const c = {}
    Object.keys(ISSUE_META).forEach(k => c[k] = 0)
    issues.forEach(i => c[i.type] = (c[i.type] || 0) + 1)
    return c
  }, [issues])

  const list = tab === 'all' ? issues : issues.filter(i => i.type === tab)
  const tabs = [{ id: 'all', label: 'All issues', count: issues.length },
    ...Object.entries(ISSUE_META).map(([id, m]) => ({ id, label: m.label, count: counts[id] }))]

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink">Data Quality</h1>
        <p className="text-[13px] text-slate-500">Know what to fix next — incomplete data weakens every outcome number the programme reports</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="Data completeness score" value={`${score}%`} icon={score >= 70 ? ShieldCheck : ShieldAlert} tone={score >= 70 ? 'emerald' : 'amber'} />
        <StatCard label="Open issues" value={issues.length} icon={ShieldAlert} tone="rose" />
        <StatCard label="Learners affected" value={new Set(issues.map(i => i.learner.id)).size} icon={ShieldAlert} tone="orange" />
        <StatCard label="Consent-affected records" value={counts.consent || 0} icon={ShieldCheck} tone="violet" />
      </div>

      <Card>
        <div className="px-5 pt-4">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>
        {tab !== 'all' && <p className="px-5 text-[12.5px] text-slate-400 -mt-1 mb-2">{ISSUE_META[tab].hint}</p>}
        <Table className="min-w-[760px]">
          <thead>
            <tr><th className="th">Issue</th><th className="th">Learner</th><th className="th">Course / Provider</th><th className="th">Detail</th><th className="th">Suggested action</th><th className="th"></th></tr>
          </thead>
          <tbody>
            {list.map((i, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="td"><Badge tone={ISSUE_META[i.type].tone}>{ISSUE_META[i.type].label}</Badge></td>
                <td className="td">
                  <Link to={`/learners/${i.learner.id}`} className="text-navy-700 hover:underline font-medium">
                    {displayName(i.learner)}
                  </Link>
                  <div className="text-[11px] text-slate-400">{i.learner.uniqueLearnerId}</div>
                </td>
                <td className="td text-[12.5px]">{courseOf(db, i.learner.id)?.name}<div className="text-[11px] text-slate-400">{providerOf(db, i.learner.id)?.name}</div></td>
                <td className="td text-[12.5px] text-slate-500">{i.detail}</td>
                <td className="td text-[12.5px]">{i.action}</td>
                <td className="td text-right">
                  <Link to={i.type === 'employer' ? '/verification' : i.type === 'consent' ? `/learners/${i.learner.id}` : '/followups'}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-navy-700 hover:underline">
                    Fix <ArrowRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!list.length && (
          <div className="py-10 text-center text-[13px] text-slate-400">No issues of this type — data is clean here. 🎉</div>
        )}
      </Card>

      <Card className="mt-4">
        <CardHeader title="Completeness by provider" sub="Share of learners with consent, outcomes, wages, verification and fresh updates" />
        <div className="px-5 pb-5 space-y-3">
          {db.providers.map(p => {
            const learners = db.learners.filter(l => providerOf(db, l.id)?.id === p.id)
            const s = completenessScore(db, learners)
            return (
              <div key={p.id}>
                <div className="flex justify-between text-[12.5px] mb-1">
                  <span className="font-medium">{p.name} <span className="text-slate-400">({learners.length} learners)</span></span>
                  <span className="font-semibold">{s}%</span>
                </div>
                <ProgressBar value={s} tone={s >= 70 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-rose-500'} />
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

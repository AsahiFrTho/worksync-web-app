import React, { useMemo } from 'react'
import { Lightbulb, Puzzle, Briefcase, Users } from 'lucide-react'
import { useStore } from '../data/store'
import { topSkillGaps, courseOf, providerOf, fmtDate } from '../data/compute'
import { Card, CardHeader, Badge, Table, ProgressBar } from '../components/ui'
import { BarsH } from '../components/Charts'
import FilterBar from '../components/FilterBar'
import { DEFAULT_FILTERS } from '../data/compute'
import { useState } from 'react'

const SEV_TONE = { high: 'rose', medium: 'amber', low: 'slate' }

export default function SkillGaps() {
  const db = useStore()
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...{ provider: 'all', course: 'all', district: 'all' } })

  const overall = useMemo(() => topSkillGaps(db, filters).slice(0, 8), [db, filters])
  const byEmployer = useMemo(() => topSkillGaps(db, filters, 'employer').slice(0, 6), [db, filters])
  const byLearner = useMemo(() => topSkillGaps(db, filters, 'learner').slice(0, 6), [db, filters])
  const byCourse = useMemo(() => topSkillGaps(db, filters, 'course'), [db, filters])
  const byDistrict = useMemo(() => topSkillGaps(db, filters, 'district'), [db, filters])

  // mismatch: placements whose relevance to training is low/medium, by course
  const mismatch = useMemo(() => {
    const rows = {}
    db.outcomeEvents.forEach(o => {
      if (!['wage_employment', 'job_change'].includes(o.outcomeType) || !o.relevanceToTraining) return
      const course = courseOf(db, o.learnerId)?.name
      if (!course) return
      rows[course] = rows[course] || { total: 0, low: 0, examples: [] }
      rows[course].total++
      if (o.relevanceToTraining === 'low') {
        rows[course].low++
        if (rows[course].examples.length < 3) rows[course].examples.push(o)
      }
    })
    return Object.entries(rows).map(([course, v]) => ({ course, ...v, lowShare: Math.round((v.low / v.total) * 100) }))
      .sort((a, b) => b.lowShare - a.lowShare)
  }, [db])

  const totalGaps = db.skillGaps.length
  const highGaps = db.skillGaps.filter(g => g.severity === 'high').length

  const recommendations = useMemo(() => {
    const recs = []
    const top = overall[0]
    if (top) recs.push(`Add a 10-hour bridge module on “${top.name}” to the courses reporting it most — it accounts for ${top.total} of ${totalGaps} gap reports.`)
    const empTop = byEmployer[0]
    if (empTop) recs.push(`Employers most often flag “${empTop.name}” — invite employer reps to review the practical component of the relevant course.`)
    const mismatchTop = mismatch[0]
    if (mismatchTop && mismatchTop.lowShare > 0) recs.push(`${mismatchTop.course} has the highest training–job mismatch (${mismatchTop.lowShare}% of placed learners in low-relevance roles) — revisit job-role mapping with providers.`)
    const distTop = byDistrict[0]
    if (distTop) recs.push(`${distTop.name} reports the most gaps overall — prioritise a district-level trainer refresher and employer meetup.`)
    return recs
  }, [overall, byEmployer, byDistrict, mismatch, totalGaps])

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-ink">Skill Gap Analysis</h1>
        <p className="text-[13px] text-slate-500">{totalGaps} gap reports ({highGaps} high severity) from employer calls and learner self-assessments</p>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} show={['provider', 'course', 'district']} />

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader title="Top skill gaps" sub="All sources · overall" right={<Puzzle size={16} className="text-slate-300" />} />
          <div className="px-3 pb-4">
            {overall.length ? <BarsH data={overall} barKey="total" name="Reports" color="#7c3aed" /> : <p className="text-[13px] text-slate-400 px-3">No skill gaps in this selection.</p>}
          </div>
        </Card>
        <div className="grid gap-4">
          <Card>
            <CardHeader title="Reported by employers" sub="Captured during employer verification calls" right={<Briefcase size={16} className="text-slate-300" />} />
            <div className="px-3 pb-4">
              {byEmployer.length ? <BarsH data={byEmployer} barKey="total" name="Reports" color="#24506e" /> : <p className="text-[13px] text-slate-400 px-3">No employer-reported gaps.</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="Reported by learners" sub="From follow-up self-assessments" right={<Users size={16} className="text-slate-300" />} />
            <div className="px-3 pb-4">
              {byLearner.length ? <BarsH data={byLearner} barKey="total" name="Reports" color="#0d9488" /> : <p className="text-[13px] text-slate-400 px-3">No learner-reported gaps.</p>}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader title="Missing skills by course" />
          <Table>
            <thead><tr><th className="th">Course</th><th className="th">Top missing skills</th><th className="th w-24">Reports</th></tr></thead>
            <tbody>
              {byCourse.map(c => {
                const skills = db.skillGaps
                  .filter(s => db.courses.find(x => x.id === s.courseId)?.name === c.name)
                  .sort((a, b) => (b.severity === 'high') - (a.severity === 'high'))
                const seen = new Set()
                const top = skills.filter(s => !seen.has(s.skillName) && seen.add(s.skillName)).slice(0, 4)
                return (
                  <tr key={c.name} className="hover:bg-slate-50">
                    <td className="td font-medium">{c.name}</td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        {top.map(s => <Badge key={s.id} tone={SEV_TONE[s.severity]}>{s.skillName}</Badge>)}
                      </div>
                    </td>
                    <td className="td font-semibold">{c.total}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Missing skills by district" />
          <Table>
            <thead><tr><th className="th">District</th><th className="th">Top missing skills</th><th className="th w-24">Reports</th></tr></thead>
            <tbody>
              {byDistrict.map(d => {
                const skills = db.skillGaps.filter(s => db.learners.find(l => l.id === s.learnerId)?.district === d.name)
                const seen = new Set()
                const top = skills.filter(s => !seen.has(s.skillName) && seen.add(s.skillName)).slice(0, 4)
                return (
                  <tr key={d.name} className="hover:bg-slate-50">
                    <td className="td font-medium">{d.name}</td>
                    <td className="td"><div className="flex flex-wrap gap-1">{top.map(s => <Badge key={s.id} tone={SEV_TONE[s.severity]}>{s.skillName}</Badge>)}</div></td>
                    <td className="td font-semibold">{d.total}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Training ↔ job role mismatch" sub="Placed learners working in roles with low relevance to their training" />
          <Table>
            <thead><tr><th className="th">Course</th><th className="th">Placed</th><th className="th">Low relevance</th><th className="th w-40">Share</th></tr></thead>
            <tbody>
              {mismatch.map(m => (
                <tr key={m.course} className="hover:bg-slate-50">
                  <td className="td font-medium">{m.course}</td>
                  <td className="td">{m.total}</td>
                  <td className="td">{m.low}</td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={m.lowShare} tone={m.lowShare > 20 ? 'bg-rose-500' : 'bg-amber-500'} className="flex-1" />
                      <span className="text-[12px] font-semibold w-9">{m.lowShare}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Recommendations" sub="Auto-generated from current gap data" right={<Lightbulb size={16} className="text-saffron-500" />} />
          <div className="px-5 pb-5">
            <ol className="space-y-2.5">
              {recommendations.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-slate-600 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-navy-50 text-navy-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  {r}
                </li>
              ))}
            </ol>
          </div>
        </Card>
      </div>
    </div>
  )
}

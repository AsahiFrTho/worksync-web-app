import React from 'react'
import { Filter, X } from 'lucide-react'
import { useStore } from '../data/store'
import { Select } from './ui'
import { STATUS_LABELS, DEFAULT_FILTERS } from '../data/compute'

export default function FilterBar({ filters, setFilters, show = ['provider', 'course', 'district', 'batch', 'gender', 'category', 'period', 'outcome'] }) {
  const db = useStore()
  const hasActive = Object.entries(filters).some(([k, v]) => k !== 'search' && v !== 'all')
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  const batches = [...new Set(db.enrollments.map(e => e.batchName))].sort()

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 mr-1">
        <Filter size={13} /> Filters
      </span>
      {show.includes('provider') && (
        <Select value={filters.provider} onChange={v => set('provider', v)} placeholder="All providers"
          options={db.providers.map(p => ({ value: p.id, label: p.name }))} />
      )}
      {show.includes('course') && (
        <Select value={filters.course} onChange={v => set('course', v)} placeholder="All courses"
          options={db.courses.map(c => ({ value: c.id, label: c.name }))} />
      )}
      {show.includes('district') && (
        <Select value={filters.district} onChange={v => set('district', v)} placeholder="All districts"
          options={db.settings.districts.map(d => ({ value: d, label: d }))} />
      )}
      {show.includes('batch') && (
        <Select value={filters.batch} onChange={v => set('batch', v)} placeholder="All batches"
          options={batches.map(b => ({ value: b, label: b }))} />
      )}
      {show.includes('gender') && (
        <Select value={filters.gender} onChange={v => set('gender', v)} placeholder="All genders"
          options={['Female', 'Male', 'Other'].map(g => ({ value: g, label: g }))} />
      )}
      {show.includes('category') && (
        <Select value={filters.category} onChange={v => set('category', v)} placeholder="All categories"
          options={[...new Set(db.learners.map(l => l.category))].map(c => ({ value: c, label: c }))} />
      )}
      {show.includes('period') && (
        <Select value={filters.period} onChange={v => set('period', v)} placeholder="All time"
          options={[{ value: '3', label: 'Last 3 months' }, { value: '6', label: 'Last 6 months' }, { value: '12', label: 'Last 12 months' }, { value: '24', label: 'Last 24 months' }]} />
      )}
      {show.includes('outcome') && (
        <Select value={filters.outcome} onChange={v => set('outcome', v)} placeholder="All outcomes"
          options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v.label }))} />
      )}
      {hasActive && (
        <button onClick={() => setFilters({ ...DEFAULT_FILTERS })}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-navy-700 hover:underline">
          <X size={12} /> Clear
        </button>
      )}
    </div>
  )
}

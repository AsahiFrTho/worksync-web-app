import React from 'react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts'

export const OUTCOME_COLORS = {
  placed: '#059669', self_employed: '#7c3aed', apprentice: '#0284c7', higher_ed: '#4f46e5',
  unemployed: '#d97706', not_placed: '#ea580c', dropped_out: '#e11d48', re_engaged: '#2563eb',
  in_training: '#0d9488', not_tracked: '#94a3b8'
}

const axisStyle = { fontSize: 11.5, fill: '#64748b' }
const tooltipStyle = {
  contentStyle: { fontSize: 12.5, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(16,42,67,.08)' },
  labelStyle: { fontWeight: 600, color: '#1c2733' }
}

export function OutcomeDonut({ data, height = 255 }) {
  const total = data.reduce((a, d) => a + d.value, 0)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} strokeWidth={2} stroke="#fff">
          {data.map(d => <Cell key={d.key} fill={OUTCOME_COLORS[d.key] || '#94a3b8'} />)}
        </Pie>
        <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v} learners (${total ? Math.round(v / total * 100) : 0}%)`, n]} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function TrendArea({ data, xKey = 'month', lines, height = 230, yFormatter }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={yFormatter} domain={['auto', 'auto']} />
        <Tooltip {...tooltipStyle} formatter={(v) => yFormatter ? yFormatter(v) : v} />
        {lines.map(l => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5}
            dot={{ r: 3, fill: l.color }} activeDot={{ r: 5 }} connectNulls />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function BarsV({ data, xKey, barKey, name, color = '#24506e', height = 230, yFormatter, xFormatter, angle = 0 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: angle ? 16 : 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval={0}
          angle={angle} textAnchor={angle ? 'end' : 'middle'} height={angle ? 44 : 30} tickFormatter={xFormatter} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={yFormatter} />
        <Tooltip {...tooltipStyle} cursor={{ fill: '#f0f5fa' }} formatter={(v) => [yFormatter ? yFormatter(v) : v, name]} />
        <Bar dataKey={barKey} name={name} fill={color} radius={[5, 5, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function BarsH({ data, barKey = 'value', name, color = '#24506e', height, showValue = true, valueFmt }) {
  const h = height || Math.max(120, data.length * 36 + 24)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" tick={{ ...axisStyle, fill: '#334155' }} width={150} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: '#f0f5fa' }} formatter={(v) => [valueFmt ? valueFmt(v) : v, name]} />
        <Bar dataKey={barKey} name={name} fill={color} radius={[0, 5, 5, 0]} maxBarSize={18} label={{ position: 'right', fontSize: 11.5, fill: '#475569', formatter: (v) => valueFmt ? valueFmt(v) : v }} />
      </BarChart>
    </ResponsiveContainer>
  )
}

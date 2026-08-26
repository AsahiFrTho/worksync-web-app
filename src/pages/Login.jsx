import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowRight, Users, Building2, PhoneCall, BadgeCheck } from 'lucide-react'
import { useStore, ROLE_META } from '../data/store'

const ROLE_CARDS = [
  { id: 'admin', icon: Users, desc: 'Full view — dashboards, analytics, provider accountability, data quality.', example: 'Meera Deshpande · Programme Officer' },
  { id: 'provider', icon: Building2, desc: 'Training provider view — batches, learner records, outcomes, follow-ups.', example: 'Rahul Kulkarni · Nashik Skill Academy' },
  { id: 'coordinator', icon: PhoneCall, desc: 'Field work queue — follow-ups, outcome entry, consent collection.', example: 'Sunita Wagh · Field Coordinator' },
  { id: 'verifier', icon: BadgeCheck, desc: 'Employer verification — approve, reject or request evidence.', example: 'Arjun Pawar · Verification Cell' }
]

export default function Login() {
  const [selected, setSelected] = useState('admin')
  const login = useStore(s => s.login)
  const nav = useNavigate()

  const enter = () => {
    login(selected)
    nav(ROLE_META[selected].landing)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-950 via-navy-900 to-[#12324a] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-4 border border-white/15">
            <svg width="30" height="30" viewBox="0 0 32 32"><path d="M16 5l3.4 6.9 7.6 1.1-5.5 5.3 1.3 7.6L16 22.3l-6.8 3.6 1.3-7.6L5 13l7.6-1.1z" fill="#f4b41a"/></svg>
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-tight">KaushalSetu</h1>
          <p className="text-navy-200 text-sm mt-1">कौशल सेतु — a bridge from skills to livelihoods</p>
          <p className="text-navy-300/80 text-[13px] mt-3 max-w-md mx-auto">
            Consent-based, longitudinal learner outcome tracking for government skilling programmes.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-1">Demo login</p>
          <h2 className="font-semibold text-ink mb-4">Choose a role to explore</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {ROLE_CARDS.map(r => (
              <button key={r.id} onClick={() => setSelected(r.id)}
                className={`text-left rounded-xl border-2 p-4 transition-all ${selected === r.id ? 'border-navy-700 bg-navy-50/60' : 'border-slate-200 hover:border-navy-300'}`}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selected === r.id ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <r.icon size={16} />
                  </div>
                  <span className="font-semibold text-[14px] text-ink">{ROLE_META[r.id].label}</span>
                </div>
                <p className="text-[12.5px] text-slate-500 leading-snug">{r.desc}</p>
                <p className="text-[11px] text-slate-400 mt-1.5">{r.example}</p>
              </button>
            ))}
          </div>
          <button onClick={enter} className="btn-primary w-full mt-5 py-2.5 text-[15px]">
            Enter as {ROLE_META[selected].short} <ArrowRight size={16} />
          </button>
          <p className="text-[11.5px] text-slate-400 mt-3 flex items-center gap-1.5 justify-center">
            <ShieldCheck size={13} /> No real authentication — roles are for demo purposes. Sample data loads automatically.
          </p>
        </div>
      </div>
    </div>
  )
}

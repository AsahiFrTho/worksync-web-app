import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './data/store'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Learners from './pages/Learners'
import LearnerProfile from './pages/LearnerProfile'
import FollowUps from './pages/FollowUps'
import Verification from './pages/Verification'
import SkillGaps from './pages/SkillGaps'
import Analytics from './pages/Analytics'
import Scorecard from './pages/Scorecard'
import DataQuality from './pages/DataQuality'
import Settings from './pages/Settings'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  const role = useStore(s => s.role)
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={role ? <Navigate to="/dashboard" replace /> : <Login />} />
        {!role ? <Route path="*" element={<Login />} /> : (
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/learners" element={<Learners />} />
            <Route path="/learners/:id" element={<LearnerProfile />} />
            <Route path="/followups" element={<FollowUps />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/skillgaps" element={<SkillGaps />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/scorecard" element={<Scorecard />} />
            <Route path="/dataquality" element={<DataQuality />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}
      </Routes>
    </>
  )
}

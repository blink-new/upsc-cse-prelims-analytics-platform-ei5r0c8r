import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { User } from './types'
import { Toaster } from './components/ui/toaster'

// Pages
import Dashboard from './pages/Dashboard'
import TestInterface from './pages/TestInterface'
import AnalyticsHub from './pages/AnalyticsHub'
import CompleteAnalytics from './pages/CompleteAnalytics'
import TestCreation from './pages/TestCreation'
import PDFUpload from './pages/PDFUpload'
import KnowledgeBase from './pages/KnowledgeBase'
import KnowledgeBaseUpload from './pages/KnowledgeBaseUpload'
import AIDebates from './pages/AIDebates'
import VoiceMemos from './pages/VoiceMemos'
import StudyGroups from './pages/StudyGroups'
import AdminDashboard from './pages/AdminDashboard'
import Settings from './pages/Settings'

// Layout
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading UPSC Analytics Platform...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">UPSC CSE Prelims</h1>
            <p className="text-lg text-blue-600 font-medium">Deep Analytics Platform</p>
          </div>
          <p className="text-slate-600 mb-6">
            Advanced analytics and adaptive testing for UPSC Civil Services Examination preparation
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen ml-64">
            <Header user={user} />
            <main className="flex-1 p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/test" element={<TestInterface />} />
                <Route path="/analytics" element={<AnalyticsHub />} />
                <Route path="/complete-analytics" element={<CompleteAnalytics />} />
                <Route path="/create-test" element={<TestCreation />} />
                <Route path="/upload" element={<PDFUpload />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="/knowledge-upload" element={<KnowledgeBaseUpload />} />
                <Route path="/debates" element={<AIDebates />} />
                <Route path="/voice-memos" element={<VoiceMemos />} />
                <Route path="/study-groups" element={<StudyGroups />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toaster />
      </div>
    </Router>
  )
}

export default App
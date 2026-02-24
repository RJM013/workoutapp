import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import Setup from './pages/Setup'
import Home from './pages/Home'
import Workout from './pages/Workout'
import History from './pages/History'
import Settings from './pages/Settings'

function App() {
  const { loadData, setupComplete, isLoading, activeSession } = useStore()

  useEffect(() => {
    loadData()
  }, [loadData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Routes>
        <Route path="/" element={
          !setupComplete ? <Navigate to="/setup" replace /> :
          activeSession ? <Navigate to="/workout" replace /> :
          <Home />
        } />
        <Route path="/setup" element={
          setupComplete ? <Navigate to="/" replace /> : <Setup />
        } />
        <Route path="/workout" element={
          activeSession ? <Workout /> : <Navigate to="/" replace />
        } />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  )
}

export default App

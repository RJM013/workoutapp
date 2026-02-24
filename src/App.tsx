import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './store/useStore'
import BottomNav from './components/BottomNav'
import Setup from './pages/Setup'
import Home from './pages/Home'
import Workout from './pages/Workout'
import WorkoutSummary from './pages/WorkoutSummary'
import History from './pages/History'
import Settings from './pages/Settings'
import LiftDetail from './pages/LiftDetail'
import Stats from './pages/Stats'
import LearnGZCLP from './pages/LearnGZCLP'
import ExerciseLibrary from './pages/ExerciseLibrary'
import WorkoutDetail from './pages/WorkoutDetail'

const BOTTOM_NAV_ROUTES = ['/', '/history', '/settings']

function App() {
  const { loadData, setupComplete, isLoading, activeSession } = useStore()
  const location = useLocation()
  const showBottomNav = BOTTOM_NAV_ROUTES.includes(location.pathname)

  useEffect(() => {
    loadData()
  }, [loadData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="text-[var(--color-text-secondary)] text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
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
        <Route path="/history/:id" element={<WorkoutDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/summary" element={<WorkoutSummary />} />
        <Route path="/lift/:liftName" element={<LiftDetail />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/learn" element={<LearnGZCLP />} />
        <Route path="/exercises" element={<ExerciseLibrary />} />
      </Routes>
      {showBottomNav && <BottomNav />}
    </div>
  )
}

export default App

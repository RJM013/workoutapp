import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function Settings() {
  const { profile, saveProfile, exportData, importData, resetAll } = useStore()
  const [units, setUnits] = useState(profile?.units ?? 'lbs')
  const [restT1, setRestT1] = useState(profile?.restTimerT1 ?? 180)
  const [restT2, setRestT2] = useState(profile?.restTimerT2 ?? 150)
  const [restT3, setRestT3] = useState(profile?.restTimerT3 ?? 75)
  const [exported, setExported] = useState('')
  const [importText, setImportText] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [hapticEnabled, setHapticEnabled] = useState(() => localStorage.getItem('hapticEnabled') !== 'false')

  const handleSaveUnits = () => {
    if (profile) saveProfile({ ...profile, units: units as 'lbs' | 'kg' })
  }

  const handleSaveRestTimers = () => {
    if (profile) saveProfile({
      ...profile,
      restTimerT1: restT1,
      restTimerT2: restT2,
      restTimerT3: restT3
    })
  }

  const handleExport = async () => {
    const data = await exportData()
    setExported(data)
  }

  const handleImport = async () => {
    try {
      await importData(importText)
      setImportText('')
      alert('Data imported successfully')
    } catch (e) {
      alert('Import failed: invalid JSON')
    }
  }

  const handleHapticToggle = () => {
    const next = !hapticEnabled
    setHapticEnabled(next)
    localStorage.setItem('hapticEnabled', String(next))
  }

  const handleReset = async () => {
    if (resetConfirmText !== 'RESET') return
    await resetAll()
    setShowReset(false)
    setResetConfirmText('')
    window.location.href = '/setup'
  }

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <header className="flex justify-between items-center mb-8">
        <Link to="/" className="text-slate-400 hover:text-slate-200">← Back</Link>
        <h1 className="text-xl font-bold text-slate-100">Settings</h1>
        <div className="w-14" />
      </header>

      <section className="mb-8">
        <div className="flex gap-3">
          <Link to="/learn" className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-center">
            Learn GZCLP
          </Link>
          <Link to="/exercises" className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-center">
            Exercise Library
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Units</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="units"
              checked={units === 'lbs'}
              onChange={() => setUnits('lbs')}
              className="w-5 h-5"
            />
            <span className="text-slate-300">lbs</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="units"
              checked={units === 'kg'}
              onChange={() => setUnits('kg')}
              className="w-5 h-5"
            />
            <span className="text-slate-300">kg</span>
          </label>
        </div>
        <button
          onClick={handleSaveUnits}
          className="mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm"
        >
          Save
        </button>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Rest Timers (seconds)</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-slate-300">T1 (heavy)</label>
            <input
              type="number"
              value={restT1}
              onChange={(e) => setRestT1(Number(e.target.value))}
              className="w-20 px-2 py-1 rounded bg-slate-800 text-slate-100 text-right"
              min={60}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-slate-300">T2 (volume)</label>
            <input
              type="number"
              value={restT2}
              onChange={(e) => setRestT2(Number(e.target.value))}
              className="w-20 px-2 py-1 rounded bg-slate-800 text-slate-100 text-right"
              min={60}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-slate-300">T3 (accessories)</label>
            <input
              type="number"
              value={restT3}
              onChange={(e) => setRestT3(Number(e.target.value))}
              className="w-20 px-2 py-1 rounded bg-slate-800 text-slate-100 text-right"
              min={30}
            />
          </div>
        </div>
        <button
          onClick={handleSaveRestTimers}
          className="mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm"
        >
          Save
        </button>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Export / Import</h2>
        <button
          onClick={handleExport}
          className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 mb-4"
        >
          Export data as JSON
        </button>
        {exported && (
          <textarea
            readOnly
            value={exported}
            className="w-full h-32 p-3 rounded-lg bg-slate-800 text-slate-300 text-sm font-mono mb-4"
          />
        )}
        <textarea
          placeholder="Paste JSON to import..."
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="w-full h-24 p-3 rounded-lg bg-slate-800 text-slate-300 text-sm font-mono mb-2"
        />
        <button
          onClick={handleImport}
          className="w-full py-3 rounded-xl bg-amber-600/80 hover:bg-amber-500/80 text-white"
        >
          Import data
        </button>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Preferences</h2>
        <label className="flex items-center justify-between py-2">
          <span className="text-[var(--color-text-secondary)]">Haptic feedback</span>
          <input
            type="checkbox"
            checked={hapticEnabled}
            onChange={handleHapticToggle}
            className="w-5 h-5 rounded"
          />
        </label>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Reset</h2>
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="w-full py-3 rounded-xl bg-[var(--color-accent-fail)]/20 hover:bg-[var(--color-accent-fail)]/30 text-[var(--color-accent-fail)] border border-[var(--color-accent-fail)]/50"
          >
            Reset all data
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-accent-fail)]/50">
            <p className="text-[var(--color-text-primary)] mb-2">Are you sure?</p>
            <p className="text-[var(--color-text-muted)] text-sm mb-4">This cannot be undone. Type RESET to confirm.</p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
              placeholder="Type RESET"
              className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] mb-4 border border-[var(--color-border-subtle)]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowReset(false); setResetConfirmText('') }}
                className="flex-1 py-2 rounded-lg bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetConfirmText !== 'RESET'}
                className="flex-1 py-2 rounded-lg bg-[var(--color-accent-fail)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

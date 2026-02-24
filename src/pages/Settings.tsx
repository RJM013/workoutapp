import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { DEFAULT_DAY_STRUCTURE, T1_T2_EXERCISES, T3_LIBRARY } from '../data/exerciseRegistry'
import type { WorkoutDay, DayStructure } from '../types'

const WORKOUT_DAYS: WorkoutDay[] = ['A1', 'B1', 'A2', 'B2']
const T1_OPTIONS = T1_T2_EXERCISES.filter((e) => e.allowedTiers.includes('T1')).map((e) => e.name)
const T2_OPTIONS = T1_T2_EXERCISES.filter((e) => e.allowedTiers.includes('T2')).map((e) => e.name)
const ALL_T3_OPTIONS = Array.from(new Set(Object.values(T3_LIBRARY).flat()))

export default function Settings() {
  const { profile, saveProfile, exportData, importData, resetAll, lifts, t3Lifts, getCompletedWorkouts, updateLiftOverride, updateT3Override, updateT3Exercises } = useStore()
  const [units, setUnits] = useState(profile?.units ?? 'lbs')
  const [restT1, setRestT1] = useState(profile?.restTimerT1 ?? 180)
  const [restT2, setRestT2] = useState(profile?.restTimerT2 ?? 150)
  const [restT3, setRestT3] = useState(profile?.restTimerT3 ?? 75)
  const [exported, setExported] = useState('')
  const [importText, setImportText] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [hapticEnabled, setHapticEnabled] = useState(() => localStorage.getItem('hapticEnabled') !== 'false')
  const [weightOverrides, setWeightOverrides] = useState<Record<string, { weight: number; stage?: number }>>({})

  const dayStructure = (profile?.dayStructure ?? DEFAULT_DAY_STRUCTURE) as DayStructure
  const allT1T2Lifts = (() => {
    const seen = new Set<string>()
    const result: { liftName: string; tier: 'T1' | 'T2' }[] = []
    for (const day of ['A1', 'B1', 'A2', 'B2'] as WorkoutDay[]) {
      const { t1, t2 } = dayStructure[day]
      if (!seen.has(`${t1}-T1`)) { seen.add(`${t1}-T1`); result.push({ liftName: t1, tier: 'T1' }) }
      if (!seen.has(`${t2}-T2`)) { seen.add(`${t2}-T2`); result.push({ liftName: t2, tier: 'T2' }) }
    }
    return result
  })()
  const allT3Lifts = Array.from(new Set(Object.values(profile?.t3Exercises ?? {}).flat()))

  const [dayStructEdit, setDayStructEdit] = useState<DayStructure | null>(null)
  const [t3Edit, setT3Edit] = useState<Record<WorkoutDay, string[]> | null>(null)

  const activeT3 = t3Edit ?? (profile?.t3Exercises ?? { A1: [], B1: [], A2: [], B2: [] })

  const handleSaveDayStructure = () => {
    if (profile && dayStructEdit) {
      saveProfile({ ...profile, dayStructure: dayStructEdit })
      setDayStructEdit(null)
    }
  }

  const handleSaveT3 = async (day: WorkoutDay) => {
    const list = t3Edit?.[day] ?? activeT3[day] ?? []
    await updateT3Exercises(day, list)
    setT3Edit((t) => {
      if (!t) return null
      const next = { ...t }
      delete next[day]
      return Object.keys(next).length ? next : null
    })
  }

  const toggleT3 = (day: WorkoutDay, exercise: string) => {
    setT3Edit((t) => {
      const current = t ?? activeT3
      const list = current[day] ?? []
      const has = list.includes(exercise)
      if (has) return { ...current, [day]: list.filter((e) => e !== exercise) }
      if (list.length >= 3) return current
      return { ...current, [day]: [...list, exercise] }
    })
  }

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

  const handleDownload = async () => {
    const data = await exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gzclp-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    if (lifts.size > 0) {
      setShowImportConfirm(true)
    } else {
      getCompletedWorkouts().then((s) => {
        if (s.length > 0) setShowImportConfirm(true)
        else doImport()
      })
    }
  }

  const doImport = async () => {
    try {
      await importData(importText)
      setImportText('')
      setShowImportConfirm(false)
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
        <Link to="/" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">← Back</Link>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        <div className="w-14" />
      </header>

      <section className="mb-8">
        <div className="flex gap-3">
          <Link to="/learn" className="flex-1 py-3 rounded-xl bg-[var(--color-bg-surface-raised)] hover:bg-[var(--color-bg-surface-overlay)] text-[var(--color-text-primary)] text-center">
            Learn GZCLP
          </Link>
          <Link to="/exercises" className="flex-1 py-3 rounded-xl bg-[var(--color-bg-surface-raised)] hover:bg-[var(--color-bg-surface-overlay)] text-[var(--color-text-primary)] text-center">
            Exercise Library
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Units</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="units"
              checked={units === 'lbs'}
              onChange={() => setUnits('lbs')}
              className="w-5 h-5"
            />
            <span className="text-[var(--color-text-secondary)]">lbs</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="units"
              checked={units === 'kg'}
              onChange={() => setUnits('kg')}
              className="w-5 h-5"
            />
            <span className="text-[var(--color-text-secondary)]">kg</span>
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
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Rest Timers (seconds)</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[var(--color-text-secondary)]">T1 (heavy)</label>
            <input
              type="number"
              value={restT1}
              onChange={(e) => setRestT1(Number(e.target.value))}
              className="w-20 px-2 py-1 rounded bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] text-right"
              min={60}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[var(--color-text-secondary)]">T2 (volume)</label>
            <input
              type="number"
              value={restT2}
              onChange={(e) => setRestT2(Number(e.target.value))}
              className="w-20 px-2 py-1 rounded bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] text-right"
              min={60}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[var(--color-text-secondary)]">T3 (accessories)</label>
            <input
              type="number"
              value={restT3}
              onChange={(e) => setRestT3(Number(e.target.value))}
              className="w-20 px-2 py-1 rounded bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] text-right"
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
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Program Setup</h2>
        <p className="text-[var(--color-text-muted)] text-sm mb-4">Edit T1/T2 assignments and T3 exercises per day.</p>
        {WORKOUT_DAYS.map((day) => (
          <div key={day} className="mb-6 p-4 rounded-xl bg-[var(--color-bg-surface)]/50 border border-[var(--color-border-subtle)]">
            <h3 className="text-[var(--color-text-primary)] font-medium mb-3">Day {day}</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <label className="text-[var(--color-text-secondary)] text-sm w-12">T1</label>
                <select
                  value={(dayStructEdit ?? dayStructure)[day].t1}
                  onChange={(e) => setDayStructEdit((d) => {
                    const next = d ?? { ...dayStructure }
                    return { ...next, [day]: { ...next[day], t1: e.target.value } }
                  })}
                  className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]"
                >
                  {T1_OPTIONS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <label className="text-[var(--color-text-secondary)] text-sm w-12">T2</label>
                <select
                  value={(dayStructEdit ?? dayStructure)[day].t2}
                  onChange={(e) => setDayStructEdit((d) => {
                    const next = d ?? { ...dayStructure }
                    return { ...next, [day]: { ...next[day], t2: e.target.value } }
                  })}
                  className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]"
                >
                  {T2_OPTIONS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[var(--color-text-secondary)] text-sm block mb-2">T3 (1–3 per day)</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_T3_OPTIONS.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => toggleT3(day, ex)}
                      disabled={(t3Edit ?? activeT3)[day]?.length >= 3 && !(t3Edit ?? activeT3)[day]?.includes(ex)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        (t3Edit ?? activeT3)[day]?.includes(ex)
                          ? 'bg-[var(--color-accent-active)] text-[#0D0D0D]'
                          : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] border border-[var(--color-border-subtle)]'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {(dayStructEdit || t3Edit) && (
              <button
                onClick={async () => {
                  if (dayStructEdit) handleSaveDayStructure()
                  await handleSaveT3(day)
                }}
                className="mt-3 px-4 py-2 rounded-lg bg-[var(--color-accent-active)] text-[#0D0D0D] text-sm font-medium"
              >
                Save Day {day}
              </button>
            )}
          </div>
        ))}
        {dayStructEdit && (
          <button
            onClick={handleSaveDayStructure}
            className="w-full py-3 rounded-xl bg-[var(--color-accent-active)] text-[#0D0D0D] font-semibold"
          >
            Save Program
          </button>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Weight Overrides</h2>
        <p className="text-[var(--color-text-muted)] text-sm mb-4">Edit current weight or stage for any lift.</p>
        <div className="space-y-4">
          {allT1T2Lifts.map(({ liftName, tier }) => {
            const state = lifts.get(`${liftName}-${tier}`)
            const key = `${liftName}-${tier}`
            const base = { weight: state?.currentWeight ?? 0, stage: state?.currentStage ?? 1 }
            const override = weightOverrides[key] ?? base
            return (
              <div key={key} className="p-4 rounded-xl bg-[var(--color-bg-surface)]/50 border border-[var(--color-border-subtle)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-[var(--color-text-primary)]">{liftName} ({tier})</span>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="text-[var(--color-text-secondary)] text-sm">
                    Weight
                    <input
                      type="number"
                      value={override.weight}
                      onChange={(e) => setWeightOverrides((o) => ({ ...o, [key]: { ...(o[key] ?? base), weight: Number(e.target.value) } }))}
                      className="ml-2 w-20 px-2 py-1 rounded bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] text-right"
                    />
                  </label>
                  {tier === 'T1' && (
                    <label className="text-[var(--color-text-secondary)] text-sm">
                      Stage
                      <select
                        value={override.stage ?? 1}
                        onChange={(e) => setWeightOverrides((o) => ({ ...o, [key]: { ...(o[key] ?? base), stage: Number(e.target.value) as 1 | 2 | 3 } }))}
                        className="ml-2 px-2 py-1 rounded bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
                      >
                        <option value={1}>5x3</option>
                        <option value={2}>6x2</option>
                        <option value={3}>10x1</option>
                      </select>
                    </label>
                  )}
                  <button
                    onClick={() => updateLiftOverride(liftName, tier, override.weight, override.stage)}
                    className="px-3 py-1 rounded-lg bg-[var(--color-accent-active)] text-[#0D0D0D] text-sm font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            )
          })}
          {allT3Lifts.map((liftName) => {
            const state = t3Lifts.get(liftName)
            const key = `t3-${liftName}`
            const base = { weight: state?.currentWeight ?? 0 }
            const override = weightOverrides[key] ?? base
            return (
              <div key={key} className="p-4 rounded-xl bg-[var(--color-bg-surface)]/50 border border-[var(--color-border-subtle)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-[var(--color-text-primary)]">{liftName} (T3)</span>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="text-[var(--color-text-secondary)] text-sm">
                    Weight
                    <input
                      type="number"
                      value={override.weight}
                      onChange={(e) => setWeightOverrides((o) => ({ ...o, [key]: { ...(o[key] ?? base), weight: Number(e.target.value) } }))}
                      className="ml-2 w-20 px-2 py-1 rounded bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] text-right"
                    />
                  </label>
                  <button
                    onClick={() => updateT3Override(liftName, override.weight)}
                    className="px-3 py-1 rounded-lg bg-[var(--color-accent-active)] text-[#0D0D0D] text-sm font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Export / Import</h2>
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleExport}
            className="flex-1 py-3 rounded-xl bg-[var(--color-bg-surface-raised)] hover:bg-[var(--color-bg-surface-overlay)] text-[var(--color-text-primary)]"
          >
            Export (copy)
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 py-3 rounded-xl bg-[var(--color-bg-surface-raised)] hover:bg-[var(--color-bg-surface-overlay)] text-[var(--color-text-primary)]"
          >
            Download
          </button>
        </div>
        {exported && (
          <textarea
            readOnly
            value={exported}
            className="w-full h-32 p-3 rounded-lg bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] text-sm font-mono mb-4"
          />
        )}
        <textarea
          placeholder="Paste JSON to import..."
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="w-full h-24 p-3 rounded-lg bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] text-sm font-mono mb-2"
        />
        <button
          onClick={handleImportClick}
          className="w-full py-3 rounded-xl bg-amber-600/80 hover:bg-amber-500/80 text-white"
        >
          Import data
        </button>
        {showImportConfirm && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-accent-fail)]/50">
            <p className="text-[var(--color-text-primary)] mb-2">Overwrite existing data?</p>
            <p className="text-[var(--color-text-muted)] text-sm mb-4">Importing will overwrite your current profile, lifts, and workout history. This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={doImport}
                className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
              >
                Import
              </button>
            </div>
          </div>
        )}
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

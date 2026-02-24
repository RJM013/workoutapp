import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { MAIN_LIFTS, T3_LIBRARY } from '../types'

export default function Setup() {
  const navigate = useNavigate()
  const { completeSetup } = useStore()
  const [step, setStep] = useState(1)
  const [weights, setWeights] = useState<Record<string, number>>({
    Squat: 135,
    'Bench Press': 95,
    OHP: 65,
    Deadlift: 185
  })
  const [t3Selections, setT3Selections] = useState<Record<string, string[]>>({
    A1: ['Lat Pulldown', 'Face Pull'],
    B1: ['Dumbbell Row', 'Bicep Curl'],
    A2: ['Lat Pulldown', 'Cable Crunch'],
    B2: ['Dumbbell Row', 'Lateral Raise']
  })

  const allT3Options = Object.values(T3_LIBRARY).flat()

  const handleWeightChange = (lift: string, value: number) => {
    setWeights((w) => ({ ...w, [lift]: Math.max(0, value) }))
  }

  const toggleT3 = (day: string, exercise: string) => {
    setT3Selections((s) => {
      const list = s[day] ?? []
      const has = list.includes(exercise)
      return {
        ...s,
        [day]: has ? list.filter((e) => e !== exercise) : [...list, exercise]
      }
    })
  }

  const handleComplete = async () => {
    await completeSetup(weights, t3Selections as Record<'A1'|'B1'|'A2'|'B2', string[]>)
    navigate('/')
  }

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <h1 className="text-2xl font-bold text-slate-100 mb-2">GZCLP Setup</h1>
      <p className="text-slate-400 mb-8">
        GZCLP is a 4-day linear progression program. Enter your starting weights and select accessories.
      </p>

      {step === 1 && (
        <>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Starting Weights (T1)</h2>
          <p className="text-slate-400 text-sm mb-4">
            Enter your current working weight for each main lift. T2 will start at ~65% of T1.
          </p>
          <div className="space-y-4">
            {MAIN_LIFTS.map((lift) => (
              <div key={lift} className="flex items-center justify-between gap-4">
                <label className="text-slate-300">{lift}</label>
                <input
                  type="number"
                  value={weights[lift] ?? 0}
                  onChange={(e) => handleWeightChange(lift, Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-lg bg-slate-800 text-slate-100 text-right text-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  min={0}
                  step={5}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            className="mt-8 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg"
          >
            Next: Select T3 Exercises
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">T3 Accessories</h2>
          <p className="text-slate-400 text-sm mb-6">
            Pick 1–3 accessories per day. Tap to add/remove.
          </p>
          {(['A1', 'B1', 'A2', 'B2'] as const).map((day) => (
            <div key={day} className="mb-6">
              <h3 className="text-slate-300 font-medium mb-2">Day {day}</h3>
              <div className="flex flex-wrap gap-2">
                {allT3Options.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => toggleT3(day, ex)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      (t3Selections[day] ?? []).includes(ex)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              Start Training
            </button>
          </div>
        </>
      )}
    </div>
  )
}

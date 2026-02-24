import { useEffect, useRef, useState } from 'react'

interface RestTimerProps {
  duration: number
  onComplete?: () => void
  onSkip?: () => void
  active: boolean
}

export default function RestTimer({ duration, onComplete, onSkip, active }: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration)
  const startTime = useRef(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    startTime.current = Date.now()
    setRemaining(duration)

    intervalRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000)
      const left = Math.max(0, duration - elapsed)
      setRemaining(left)
      if (left <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        onComplete?.()
      }
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [duration, active, onComplete])

  if (!active) return null

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg z-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">Rest</p>
          <p className="text-2xl font-mono font-bold text-blue-400">
            {mins}:{secs.toString().padStart(2, '0')}
          </p>
        </div>
        <button
          onClick={onSkip}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm"
        >
          Skip
        </button>
      </div>
    </div>
  )
}

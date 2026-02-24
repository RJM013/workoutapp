import { useEffect, useRef, useState } from 'react'
import { hapticTimerComplete, hapticTap } from '../lib/haptic'

interface RestTimerProps {
  duration: number
  onComplete?: () => void
  onSkip?: () => void
  active: boolean
  hapticOnComplete?: boolean
}

export default function RestTimer({ duration, onComplete, onSkip, active, hapticOnComplete = true }: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration)
  const startTime = useRef(0)
  const intervalRef = useRef<number | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!active) return
    completedRef.current = false
    startTime.current = Date.now()
    setRemaining(duration)

    intervalRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000)
      const left = Math.max(0, duration - elapsed)
      setRemaining(left)
      if (left <= 0 && intervalRef.current && !completedRef.current) {
        completedRef.current = true
        clearInterval(intervalRef.current)
        intervalRef.current = null
        if (hapticOnComplete) hapticTimerComplete()
        onComplete?.()
      }
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [duration, active, onComplete, hapticOnComplete])

  if (!active) return null

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const progress = duration > 0 ? 1 - remaining / duration : 1
  const circumference = 2 * Math.PI * 36
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-[var(--color-bg-surface)] rounded-xl p-4 border border-[var(--color-border-subtle)] z-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="var(--color-bg-surface-raised)"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="var(--color-accent-active)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-[stroke-dashoffset] duration-100"
            />
          </svg>
          <div>
            <p className="text-[var(--color-text-secondary)] text-sm">Rest</p>
            <p className="text-2xl font-bold text-[var(--color-accent-active)] tabular-nums">
              {mins}:{secs.toString().padStart(2, '0')}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            hapticTap()
            onSkip?.()
          }}
          className="px-4 py-2 rounded-lg bg-[var(--color-bg-surface-raised)] hover:bg-[var(--color-bg-surface-overlay)] text-[var(--color-text-secondary)] text-sm border border-[var(--color-border-subtle)]"
        >
          Skip
        </button>
      </div>
    </div>
  )
}

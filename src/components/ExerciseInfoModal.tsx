import { getExerciseInstruction } from '../data/exerciseInstructions'

interface ExerciseInfoModalProps {
  exerciseName: string
  onClose: () => void
}

export default function ExerciseInfoModal({ exerciseName, onClose }: ExerciseInfoModalProps) {
  const instruction = getExerciseInstruction(exerciseName)

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[var(--color-bg-surface)] rounded-t-2xl sm:rounded-2xl shadow-xl"
        role="dialog"
        aria-labelledby="exercise-title"
      >
        <div className="sticky top-0 bg-[var(--color-bg-surface)] p-6 pb-4 border-b border-[var(--color-border-subtle)] flex justify-between items-start">
          <h2 id="exercise-title" className="text-xl font-bold text-[var(--color-text-primary)]">
            {exerciseName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-6">
          {instruction ? (
            <>
              <div>
                <p className="text-[var(--color-text-secondary)] text-sm">{instruction.muscles}</p>
                <p className="text-[var(--color-text-muted)] text-sm mt-1">{instruction.equipment}</p>
              </div>
              <section>
                <h3 className="text-[var(--color-text-primary)] font-semibold mb-2">Key Points</h3>
                <ul className="space-y-1 text-[var(--color-text-secondary)] text-sm">
                  {instruction.keyPoints.map((point, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-400">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="text-[var(--color-text-primary)] font-semibold mb-2">Common Mistakes</h3>
                <ul className="space-y-1 text-[var(--color-text-secondary)] text-sm">
                  {instruction.commonMistakes.map((mistake, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      {mistake}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="text-[var(--color-text-primary)] font-semibold mb-2">Breathing</h3>
                <p className="text-[var(--color-text-secondary)] text-sm">{instruction.breathing}</p>
              </section>
            </>
          ) : (
            <p className="text-[var(--color-text-muted)]">No instructions available for this exercise.</p>
          )}
        </div>
      </div>
    </div>
  )
}

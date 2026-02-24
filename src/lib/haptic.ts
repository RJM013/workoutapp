/**
 * Haptic feedback utility — respects user preference from localStorage
 */

export function isHapticEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem('hapticEnabled') !== 'false'
}

export function hapticLight(): void {
  if (!isHapticEnabled() || !navigator.vibrate) return
  navigator.vibrate(10)
}

export function hapticMedium(): void {
  if (!isHapticEnabled() || !navigator.vibrate) return
  navigator.vibrate(50)
}

export function hapticHeavy(): void {
  if (!isHapticEnabled() || !navigator.vibrate) return
  navigator.vibrate([80, 40, 80])
}

/** Rest timer complete — double pulse */
export function hapticTimerComplete(): void {
  if (!isHapticEnabled() || !navigator.vibrate) return
  navigator.vibrate([100, 50, 100])
}

/** Set completed (success or fail) */
export function hapticSetComplete(): void {
  if (!isHapticEnabled() || !navigator.vibrate) return
  navigator.vibrate(30)
}

/** Exercise complete — all sets done */
export function hapticExerciseComplete(): void {
  if (!isHapticEnabled() || !navigator.vibrate) return
  navigator.vibrate([50, 30, 50])
}

/** Workout finished */
export function hapticWorkoutComplete(): void {
  if (!isHapticEnabled() || !navigator.vibrate) return
  navigator.vibrate([100, 50, 100, 50, 100])
}

/** PR celebration */
export function hapticPR(): void {
  if (!isHapticEnabled() || !navigator.vibrate) return
  navigator.vibrate([80, 40, 80, 40, 120])
}

/** Button tap (optional, light) */
export function hapticTap(): void {
  if (!isHapticEnabled() || !navigator.vibrate) return
  navigator.vibrate(5)
}

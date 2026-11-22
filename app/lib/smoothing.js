// Frame-rate independent smoothing: `factor` is how far to close the gap per
// 60 Hz frame. On a 120 Hz screen each frame closes a bit less, so motion
// keeps the same speed but gets twice the frames instead of running at
// double speed. `dtMs` is clamped so a long pause can't overshoot.
export function smoothing(factor, dtMs) {
  return 1 - Math.pow(1 - factor, Math.min(dtMs, 100) / (1000 / 60));
}

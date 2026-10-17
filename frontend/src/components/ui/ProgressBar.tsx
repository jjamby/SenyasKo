export function ProgressBar({ value, label, compact = false }: { value: number; label: string; compact?: boolean }) {
  const percentage = Math.min(100, Math.max(0, value))
  return <div className={`progress-track ${compact ? 'progress-track--compact' : ''}`} role="progressbar" aria-label={label} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percentage}%` }} /></div>
}

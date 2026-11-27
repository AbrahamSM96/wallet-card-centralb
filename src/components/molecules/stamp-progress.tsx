type StampProgressProps = {
  count: number
  goal: number
}

/**
 * Shows stamp progress, goal, and any earned remainder.
 *
 * @param props - Current stamp values.
 * @param props.count - Current cached stamp count.
 * @param props.goal - Configured redemption goal.
 */
export function StampProgress({
  count,
  goal,
}: StampProgressProps): React.JSX.Element {
  const visibleProgress = Math.min(count, goal)
  const percentage = Math.round((visibleProgress / goal) * 100)
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">
          {count} de {goal} sellos
        </span>
        {count > goal ? (
          <span className="text-emerald-700">+{count - goal} remanentes</span>
        ) : null}
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-borde-pendiente/30">
        <div
          aria-label={`${percentage}% de la meta`}
          className="h-full rounded-full bg-noche"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

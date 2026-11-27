type StatCardProps = {
  label: string
  value: number
}

/**
 * Renders one dashboard metric.
 *
 * @param props - Metric label and value.
 * @param props.label - Metric label.
 * @param props.value - Metric value.
 */
export function StatCard({ label, value }: StatCardProps): React.JSX.Element {
  return (
    <div className="rounded-[20px] border border-cacao/20 bg-white p-4">
      <p className="text-sm text-cacao">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  )
}

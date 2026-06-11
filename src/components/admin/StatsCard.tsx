interface StatsCardProps {
  label: string
  value: string
  sub?: string
  color?: 'indigo' | 'green' | 'amber' | 'gray' | 'red'
}

const colors = {
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  green: 'bg-green-50 text-green-700 border-green-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  gray: 'bg-gray-50 text-gray-700 border-gray-100',
  red: 'bg-red-50 text-red-700 border-red-100',
}

export default function StatsCard({ label, value, sub, color = 'gray' }: StatsCardProps) {
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-60">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  )
}

interface Props {
  value: number   // 0–100
  color?: string
  height?: number
}

export function ProgressBar({ value, color = '#1AAF8B', height = 4 }: Props) {
  return (
    <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  )
}
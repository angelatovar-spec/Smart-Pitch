interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
  formatValue?: (v: number) => string
  hint?: string
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '%',
  onChange,
  formatValue,
  hint,
}: Props) {
  const display = formatValue ? formatValue(value) : `${value}${unit}`
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-rappi-orange bg-orange-50 px-2.5 py-0.5 rounded-lg">
          {display}
        </span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #FF441F ${pct}%, #e5e7eb ${pct}%)`,
          }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{min}{unit}</span>
        {hint && <span className="text-gray-500 italic">{hint}</span>}
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

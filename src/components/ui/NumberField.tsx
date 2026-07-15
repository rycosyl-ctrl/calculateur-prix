import { useEffect, useState } from 'react'

interface NumberFieldProps {
  value: number
  onChange: (value: number) => void
  label?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
  className?: string
  inputClassName?: string
  invalid?: boolean
  /** nombre de décimales affichées quand le champ n'est pas en cours d'édition */
  decimals?: number
}

function format(value: number, decimals?: number): string {
  if (!Number.isFinite(value)) return ''
  const s = decimals !== undefined ? value.toFixed(decimals) : String(value)
  return s.replace('.', ',')
}

/** Champ numérique tolérant à la virgule française, validé au blur. */
export function NumberField({
  value,
  onChange,
  label,
  suffix,
  min,
  max,
  className = '',
  inputClassName = '',
  invalid = false,
  decimals,
}: NumberFieldProps) {
  const [text, setText] = useState(() => format(value, decimals))
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) setText(format(value, decimals))
  }, [value, editing, decimals])

  const commit = () => {
    setEditing(false)
    const parsed = Number.parseFloat(text.replace(',', '.').replace(/\s/g, ''))
    if (!Number.isFinite(parsed)) {
      setText(format(value, decimals))
      return
    }
    let next = parsed
    if (min !== undefined) next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    onChange(next)
    setText(format(next, decimals))
  }

  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      )}
      <span className="relative block">
        <input
          type="text"
          inputMode="decimal"
          value={text}
          onFocus={() => setEditing(true)}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm tabular-nums shadow-sm outline-none transition focus:ring-2 ${
            invalid
              ? 'border-red-400 focus:ring-red-200'
              : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
          } ${suffix ? 'pr-12' : ''} ${inputClassName}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </span>
    </label>
  )
}

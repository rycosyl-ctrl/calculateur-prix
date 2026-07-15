import type { ButtonHTMLAttributes } from 'react'

export function AddButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 ${className}`}
    />
  )
}

export function DeleteButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      title="Supprimer"
      {...props}
      className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
    >
      ✕
    </button>
  )
}

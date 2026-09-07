import { useState } from 'react'
import { useAppState } from '../../state/AppStateContext'

export function ProductSwitcher() {
  const { workspace, config, dispatch } = useAppState()
  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState('')

  const commitRename = () => {
    const name = draftName.trim()
    if (name) dispatch({ type: 'RENAME_PRODUCT', id: config.id, name })
    setRenaming(false)
  }

  const buttonClass =
    'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50'

  if (renaming) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') setRenaming(false)
          }}
          className="w-48 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={config.id}
        onChange={(e) => dispatch({ type: 'SET_ACTIVE_PRODUCT', id: e.target.value })}
        aria-label="Produit"
        className="max-w-56 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      >
        {workspace.products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => dispatch({ type: 'ADD_PRODUCT' })}
        className={buttonClass}
        title="Nouveau produit"
      >
        + Produit
      </button>
      <button
        type="button"
        onClick={() => {
          setDraftName(config.name)
          setRenaming(true)
        }}
        className={buttonClass}
        title="Renommer le produit"
      >
        Renommer
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'DUPLICATE_PRODUCT', id: config.id })}
        className={buttonClass}
        title="Dupliquer le produit"
      >
        Dupliquer
      </button>
      {workspace.products.length > 1 && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Supprimer le produit « ${config.name} » et ses paramètres ?`)) {
              dispatch({ type: 'REMOVE_PRODUCT', id: config.id })
            }
          }}
          className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
          title="Supprimer le produit"
        >
          Supprimer
        </button>
      )}
    </div>
  )
}

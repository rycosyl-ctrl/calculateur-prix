import { useRef } from 'react'
import { useAppState } from '../../state/AppStateContext'
import { parseImportedConfig } from '../../state/schema'

export function Header() {
  const { config, dispatch } = useAppState()
  const fileInput = useRef<HTMLInputElement>(null)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'calculateur-prix-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (file: File) => {
    const parsed = parseImportedConfig(await file.text())
    if (parsed) {
      dispatch({ type: 'IMPORT_CONFIG', config: parsed })
    } else {
      window.alert('Fichier invalide : la configuration n’a pas pu être importée.')
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            Calculateur de prix
          </h1>
          <p className="text-xs text-slate-500">
            Prix TTC par variante à partir du coût d'achat et du taux de marque
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={exportJson}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Exporter
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Importer
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) importJson(file)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) {
                dispatch({ type: 'RESET_TO_DEFAULTS' })
              }
            }}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 font-medium text-red-600 transition hover:bg-red-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </header>
  )
}

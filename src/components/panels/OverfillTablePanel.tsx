import { useAppState } from '../../state/AppStateContext'
import { NumberField } from '../ui/NumberField'
import { Panel } from '../ui/Panel'
import { AddButton, DeleteButton } from '../ui/buttons'

export function OverfillTablePanel() {
  const { config, dispatch } = useAppState()

  return (
    <Panel
      title="Surpoids par tranche"
      subtitle="Grammes offerts ajoutés au coût (pas au prix affiché)"
      actions={<AddButton onClick={() => dispatch({ type: 'ADD_OVERFILL_RULE' })}>+ Tranche</AddButton>}
    >
      {config.overfillRules.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune tranche — aucun surpoids appliqué.</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 text-xs font-medium text-slate-500">
            <span>De (g)</span>
            <span>À (g, vide = ∞)</span>
            <span>Ajout (g)</span>
            <span />
          </div>
          {config.overfillRules.map((rule) => (
            <div key={rule.id} className="grid grid-cols-[1fr_1fr_1fr_2rem] items-center gap-2">
              <NumberField
                value={rule.minG}
                min={0}
                onChange={(v) =>
                  dispatch({ type: 'UPDATE_OVERFILL_RULE', id: rule.id, patch: { minG: v } })
                }
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="∞"
                defaultValue={rule.maxG === null ? '' : String(rule.maxG).replace('.', ',')}
                onBlur={(e) => {
                  const raw = e.target.value.trim().replace(',', '.')
                  const parsed = raw === '' ? null : Number.parseFloat(raw)
                  dispatch({
                    type: 'UPDATE_OVERFILL_RULE',
                    id: rule.id,
                    patch: { maxG: parsed !== null && Number.isFinite(parsed) ? parsed : null },
                  })
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <NumberField
                value={rule.extraG}
                min={0}
                onChange={(v) =>
                  dispatch({ type: 'UPDATE_OVERFILL_RULE', id: rule.id, patch: { extraG: v } })
                }
              />
              <DeleteButton onClick={() => dispatch({ type: 'REMOVE_OVERFILL_RULE', id: rule.id })} />
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

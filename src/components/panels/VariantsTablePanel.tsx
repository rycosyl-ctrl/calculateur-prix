import { useAppState } from '../../state/AppStateContext'
import { NumberField } from '../ui/NumberField'
import { Panel } from '../ui/Panel'
import { AddButton, DeleteButton } from '../ui/buttons'

export function VariantsTablePanel() {
  const { config, dispatch } = useAppState()
  const weights = config.variants.map((v) => v.nominalWeightG)
  const duplicated = new Set(weights.filter((w, i) => weights.indexOf(w) !== i))

  return (
    <Panel
      title="Variantes"
      subtitle="Cochez la variante de référence : son prix est calculé depuis le coût, les autres suivent l'écart"
      actions={<AddButton onClick={() => dispatch({ type: 'ADD_VARIANT' })}>+ Variante</AddButton>}
    >
      {config.variants.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucune variante — ajoutez un premier poids pour démarrer.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[3rem_1fr_2rem] gap-2 text-xs font-medium text-slate-500">
            <span>Réf.</span>
            <span>Poids nominal (g)</span>
            <span />
          </div>
          {[...config.variants]
            .sort((a, b) => a.nominalWeightG - b.nominalWeightG)
            .map((variant) => {
              const isRef = config.global.referenceVariantId === variant.id
              const isDup = duplicated.has(variant.nominalWeightG)
              return (
                <div
                  key={variant.id}
                  className={`grid grid-cols-[3rem_1fr_2rem] items-center gap-2 rounded-lg px-1 ${
                    isDup ? 'bg-amber-50' : ''
                  }`}
                >
                  <span className="flex justify-center">
                    <input
                      type="radio"
                      name="reference-variant"
                      checked={isRef}
                      onChange={() => dispatch({ type: 'SET_REFERENCE_VARIANT', id: variant.id })}
                      className="h-4 w-4 accent-indigo-600"
                    />
                  </span>
                  <NumberField
                    value={variant.nominalWeightG}
                    min={0.1}
                    invalid={isDup}
                    onChange={(v) =>
                      dispatch({
                        type: 'UPDATE_VARIANT',
                        id: variant.id,
                        patch: { nominalWeightG: v },
                      })
                    }
                  />
                  <DeleteButton onClick={() => dispatch({ type: 'REMOVE_VARIANT', id: variant.id })} />
                </div>
              )
            })}
          {duplicated.size > 0 && (
            <p className="text-xs text-amber-700">
              Attention : plusieurs variantes ont le même poids.
            </p>
          )}
        </div>
      )}
    </Panel>
  )
}

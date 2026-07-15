import { useAppState } from '../../state/AppStateContext'
import { isValidPromoPct } from '../../engine/promo'
import { MARGIN_RATE } from '../../engine/cost'
import type { GlobalParams } from '../../engine/types'
import { NumberField } from '../ui/NumberField'
import { Panel } from '../ui/Panel'

export function GlobalParamsPanel() {
  const { config, dispatch } = useAppState()
  const g = config.global
  const set = (patch: Partial<GlobalParams>) => dispatch({ type: 'SET_GLOBAL_PARAM', patch })

  const promoInvalid = !isValidPromoPct(g.promoPct)

  return (
    <Panel
      title="Paramètres généraux"
      subtitle={`Marge fixe de ${MARGIN_RATE * 100} % incluse sur le coût d'achat`}
    >
      <div className="grid grid-cols-2 gap-4">
        <NumberField
          label="Coût d'achat"
          suffix="€/kg"
          value={g.coutAchatKg}
          min={0}
          onChange={(v) => set({ coutAchatKg: v })}
          className="col-span-2"
        />

        <NumberField
          label="Taux de marque"
          suffix="%"
          value={(1 - g.tauxCoutSurCA) * 100}
          min={0.1}
          max={99.9}
          decimals={1}
          onChange={(v) => set({ tauxCoutSurCA: (100 - v) / 100 })}
        />
        <NumberField
          label="Taux de coût sur CA"
          suffix="%"
          value={g.tauxCoutSurCA * 100}
          min={0.1}
          max={99.9}
          decimals={1}
          onChange={(v) => set({ tauxCoutSurCA: v / 100 })}
        />

        <NumberField
          label="TVA"
          suffix="%"
          value={g.tvaRate * 100}
          min={0}
          max={100}
          decimals={1}
          onChange={(v) => set({ tvaRate: v / 100 })}
        />

        <NumberField
          label="Promo affichée"
          suffix="%"
          value={g.promoPct}
          invalid={promoInvalid}
          onChange={(v) => set({ promoPct: v })}
        />

        <div className="col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Écart inter-variante
          </span>
          <div className="flex gap-2">
            <div className="flex overflow-hidden rounded-lg border border-slate-300 shadow-sm">
              <button
                type="button"
                onClick={() => set({ gapMode: 'fixed' })}
                className={`px-3 py-2 text-xs font-medium transition ${
                  g.gapMode === 'fixed'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Fixe (€/g)
              </button>
              <button
                type="button"
                onClick={() => set({ gapMode: 'percent' })}
                className={`px-3 py-2 text-xs font-medium transition ${
                  g.gapMode === 'percent'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Pourcentage
              </button>
            </div>
            <NumberField
              value={g.gapMode === 'fixed' ? g.gapValue : g.gapValue * 100}
              suffix={g.gapMode === 'fixed' ? '€/g' : '%'}
              min={0}
              onChange={(v) => set({ gapValue: g.gapMode === 'fixed' ? v : v / 100 })}
              className="flex-1"
            />
          </div>
        </div>

        {promoInvalid && (
          <p className="col-span-2 text-xs text-red-600">
            La promo doit être comprise entre −99,9 % et 0 % (ex : −70).
          </p>
        )}
      </div>
    </Panel>
  )
}

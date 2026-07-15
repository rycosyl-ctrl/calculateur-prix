import type { PipelineIssue, PipelineResult } from '../../engine/types'
import { roundDisplay } from '../../engine/variantPricing'
import { Panel } from '../ui/Panel'

function euros(value: number): string {
  return `${roundDisplay(value).toFixed(2).replace('.', ',')} €`
}

function issueMessage(issue: PipelineIssue): string {
  switch (issue.code) {
    case 'NO_REFERENCE_VARIANT':
      return 'Sélectionnez une variante de référence dans le panneau « Variantes ».'
    case 'EMPTY_VARIANTS':
      return 'Ajoutez au moins une variante.'
    case 'INVALID_TAUX_COUT':
      return 'Le taux de coût sur CA doit être strictement entre 0 % et 100 %.'
    case 'INVALID_PROMO_PCT':
      return 'Pourcentage de promo invalide : la colonne « Avant promo » est vide.'
    case 'DUPLICATE_NOMINAL_WEIGHT':
      return `Deux variantes ont le même poids (${issue.weightG} g).`
    case 'NEGATIVE_PRICE_PER_GRAM':
      return `L'écart choisi rend le prix du ${issue.weightG} g négatif ou nul — réduisez l'écart.`
  }
}

export function ResultsTable({ pipeline }: { pipeline: PipelineResult }) {
  const hasPromo = pipeline.results.some((r) => r.priceAvantPromo !== null)

  return (
    <Panel
      title="Prix calculés"
      subtitle={
        pipeline.adjustedCostPerKg !== null && pipeline.tauxDeMarque !== null
          ? `Coût ajusté : ${euros(pipeline.adjustedCostPerKg)}/kg · Taux de marque cible : ${Math.round(pipeline.tauxDeMarque * 1000) / 10} %`
          : undefined
      }
    >
      {pipeline.issues.length > 0 && (
        <div className="mb-4 space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          {pipeline.issues.map((issue, i) => (
            <p key={i} className="text-xs text-amber-800">
              {issueMessage(issue)}
            </p>
          ))}
        </div>
      )}

      {pipeline.results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                <th className="whitespace-nowrap py-2 pr-3">Variante</th>
                <th className="whitespace-nowrap py-2 pr-3 text-right">Poids réel</th>
                <th className="whitespace-nowrap py-2 pr-3 text-right">Coût</th>
                <th className="whitespace-nowrap py-2 pr-3 text-right">Prix / g</th>
                <th className="whitespace-nowrap py-2 pr-3 text-right">Prix HT</th>
                <th className="whitespace-nowrap py-2 pr-3 text-right">Prix TTC</th>
                {hasPromo && <th className="whitespace-nowrap py-2 pr-3 text-right">Avant promo</th>}
                <th className="whitespace-nowrap py-2 text-right">Marque réelle</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {pipeline.results.map((r) => (
                <tr
                  key={r.variantId}
                  className={`border-b border-slate-100 last:border-0 ${
                    r.isReference ? 'bg-indigo-50/60' : ''
                  }`}
                >
                  <td className="whitespace-nowrap py-2.5 pr-3 font-medium text-slate-800">
                    {String(r.nominalWeightG).replace('.', ',')} g
                    {r.isReference && (
                      <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                        Référence
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-right text-slate-500">
                    {String(r.realWeightG).replace('.', ',')} g
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-right text-slate-600">{euros(r.cost)}</td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-right text-slate-600">
                    {roundDisplay(r.pricePerGramTTC).toFixed(2).replace('.', ',')} €/g
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-right text-slate-600">{euros(r.priceHT)}</td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-right font-semibold text-slate-900">
                    {euros(r.priceTTC)}
                  </td>
                  {hasPromo && (
                    <td className="whitespace-nowrap py-2.5 pr-3 text-right text-slate-400">
                      {r.priceAvantPromo !== null ? (
                        <span className="line-through">{euros(r.priceAvantPromo)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  <td className="whitespace-nowrap py-2.5 text-right text-slate-500">
                    {(Math.round(r.effectiveTauxDeMarque * 1000) / 10).toFixed(1).replace('.', ',')} %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

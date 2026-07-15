import type { OverfillRule } from './types'

/**
 * Supplément de poids (g) pour un poids nominal donné.
 * Bornes minG/maxG inclusives ; maxG null = ∞ ; première règle correspondante gagne ; aucune = 0.
 */
export function resolveOverfillExtraG(nominalWeightG: number, rules: OverfillRule[]): number {
  for (const rule of rules) {
    const withinMin = nominalWeightG >= rule.minG
    const withinMax = rule.maxG === null || nominalWeightG <= rule.maxG
    if (withinMin && withinMax) return rule.extraG
  }
  return 0
}

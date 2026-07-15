/** Marge fixe ajoutée au coût d'achat au kg (non paramétrable, décision métier). */
export const MARGIN_RATE = 0.05

export function adjustedCostPerKg(coutAchatKg: number): number {
  return coutAchatKg * (1 + MARGIN_RATE)
}

export function realWeightG(nominalWeightG: number, extraG: number): number {
  return nominalWeightG + extraG
}

export function variantCost(realWeightG: number, adjustedCostPerKg: number): number {
  return (realWeightG / 1000) * adjustedCostPerKg
}

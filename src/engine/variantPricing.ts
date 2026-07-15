export function variantPriceTTC(pricePerGram: number, nominalWeightG: number): number {
  return pricePerGram * nominalWeightG
}

/** Arrondi d'affichage à 2 décimales via les centimes entiers (évite la dérive flottante de toFixed). */
export function roundDisplay(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

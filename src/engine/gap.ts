import type { GapMode, Variant } from './types'

/**
 * Échelle de prix au gramme : à partir de la variante de référence, on marche
 * dans la liste triée par poids croissant. Chaque pas vers une variante plus
 * petite AUGMENTE le prix/g (ex validé : 100g à 3,5 €/g → 50g à 4 €/g avec un
 * écart fixe de 0,5) ; chaque pas vers une plus grande le DIMINUE.
 * Mode 'percent' : × (1+x) vers le bas de l'échelle des poids, ÷ (1+x) vers le haut.
 * Retourne un tableau parallèle à sortedVariants.
 */
export function computePricePerGramLadder(
  sortedVariants: Variant[],
  referenceIndex: number,
  referencePricePerGram: number,
  gapMode: GapMode,
  gapValue: number,
): number[] {
  const ladder = new Array<number>(sortedVariants.length)
  ladder[referenceIndex] = referencePricePerGram

  const stepUp = (price: number) =>
    gapMode === 'fixed' ? price + gapValue : price * (1 + gapValue)
  const stepDown = (price: number) =>
    gapMode === 'fixed' ? price - gapValue : price / (1 + gapValue)

  for (let i = referenceIndex - 1; i >= 0; i--) {
    ladder[i] = stepUp(ladder[i + 1])
  }
  for (let i = referenceIndex + 1; i < sortedVariants.length; i++) {
    ladder[i] = stepDown(ladder[i - 1])
  }
  return ladder
}

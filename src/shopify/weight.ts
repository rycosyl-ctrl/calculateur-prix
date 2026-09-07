import type { WeightUnit } from './types'

/** Facteurs exacts par définition (1 lb = 453,59237 g ; 1 oz = 1/16 lb). */
const GRAMS_PER_UNIT: Record<WeightUnit, number> = {
  GRAMS: 1,
  KILOGRAMS: 1000,
  POUNDS: 453.59237,
  OUNCES: 28.349523125,
}

export function toGrams(value: number, unit: WeightUnit): number {
  return value * GRAMS_PER_UNIT[unit]
}

/** Arrondi au milligramme, pour le pré-remplissage des poids nominaux. */
export function roundGrams(grams: number): number {
  return Math.round(grams * 1000) / 1000
}

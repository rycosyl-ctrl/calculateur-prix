import type { ShopifyVariant } from './types'

/** Tolérance de rapprochement : le plus large entre 0,5 g et 1 % du poids. */
export function weightTolerance(weightG: number): number {
  return Math.max(0.5, Math.abs(weightG) * 0.01)
}

/**
 * Extrait un poids en grammes du libellé d'une variante (« 100 g », « 1 kg »,
 * « 2,5 Kg »), utilisé en secours quand Shopify n'a pas de poids renseigné.
 */
export function parseWeightFromLabel(label: string): number | null {
  const match = label.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilogrammes?|g|grammes?)\b/i)
  if (!match) return null
  const value = Number.parseFloat(match[1].replace(',', '.'))
  if (!Number.isFinite(value)) return null
  return /^k/i.test(match[2]) ? value * 1000 : value
}

/** Poids retenu pour une variante Shopify : celui du champ, sinon celui du libellé. */
export function effectiveWeightG(variant: ShopifyVariant): number | null {
  return variant.weightG ?? parseWeightFromLabel(variant.title)
}

export interface MatchedVariant {
  shopify: ShopifyVariant
  weightG: number | null
  state: 'matched' | 'weight-from-label' | 'no-weight'
}

/** Qualifie chaque variante Shopify avant import : poids exploitable ou non. */
export function qualifyVariants(shopifyVariants: ShopifyVariant[]): MatchedVariant[] {
  return shopifyVariants.map((shopify) => {
    if (shopify.weightG !== null) {
      return { shopify, weightG: shopify.weightG, state: 'matched' as const }
    }
    const fromLabel = parseWeightFromLabel(shopify.title)
    return fromLabel !== null
      ? { shopify, weightG: fromLabel, state: 'weight-from-label' as const }
      : { shopify, weightG: null, state: 'no-weight' as const }
  })
}

import type { Variant, VariantResult } from '../engine/types'
import type { ShopifyVariant } from './types'
import { sameMoney } from './money'

export interface PriceDiffRow {
  shopifyVariantId: string
  /** Libellé de la variante Shopify (ex : « 100 g ») */
  label: string
  nominalWeightG: number
  currentPrice: number | null
  newPrice: number
  currentCompareAt: number | null
  /** null = le prix barré sera vidé (pas de promo) */
  newCompareAt: number | null
  changed: boolean
}

export interface PriceDiff {
  rows: PriceDiffRow[]
  /** Variantes calculées sans variante Shopify liée */
  unmatchedLocal: { nominalWeightG: number }[]
  /** Variantes Shopify que le calculateur ne gère pas */
  unmanagedShopify: { id: string; label: string }[]
}

/**
 * Compare les prix calculés aux prix Shopify actuels.
 * Seules les variantes liées (shopifyVariantId) sont candidates à la publication.
 */
export function computePriceDiff(
  shopifyVariants: ShopifyVariant[],
  configVariants: Variant[],
  results: VariantResult[],
): PriceDiff {
  const byShopifyId = new Map(shopifyVariants.map((v) => [v.id, v]))
  const linkedShopifyIds = new Set<string>()
  const rows: PriceDiffRow[] = []
  const unmatchedLocal: { nominalWeightG: number }[] = []

  for (const result of results) {
    const variant = configVariants.find((v) => v.id === result.variantId)
    const shopifyId = variant?.shopifyVariantId ?? null
    const shopifyVariant = shopifyId ? byShopifyId.get(shopifyId) : undefined

    if (!shopifyVariant) {
      unmatchedLocal.push({ nominalWeightG: result.nominalWeightG })
      continue
    }

    linkedShopifyIds.add(shopifyVariant.id)
    const newPrice = Math.round((result.priceTTC + Number.EPSILON) * 100) / 100
    const newCompareAt =
      result.priceAvantPromo === null
        ? null
        : Math.round((result.priceAvantPromo + Number.EPSILON) * 100) / 100

    rows.push({
      shopifyVariantId: shopifyVariant.id,
      label: shopifyVariant.title,
      nominalWeightG: result.nominalWeightG,
      currentPrice: shopifyVariant.price,
      newPrice,
      currentCompareAt: shopifyVariant.compareAtPrice,
      newCompareAt,
      changed:
        !sameMoney(shopifyVariant.price, newPrice) ||
        !sameMoney(shopifyVariant.compareAtPrice, newCompareAt),
    })
  }

  const unmanagedShopify = shopifyVariants
    .filter((v) => !linkedShopifyIds.has(v.id))
    .map((v) => ({ id: v.id, label: v.title }))

  return { rows, unmatchedLocal, unmanagedShopify }
}

/** Les lignes réellement à envoyer à Shopify (les inchangées sont inutiles). */
export function changedRows(diff: PriceDiff): PriceDiffRow[] {
  return diff.rows.filter((r) => r.changed)
}

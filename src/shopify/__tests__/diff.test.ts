import { describe, expect, it } from 'vitest'
import { changedRows, computePriceDiff } from '../diff'
import type { ShopifyVariant } from '../types'
import type { VariantResult } from '../../engine/types'

const sv = (id: string, title: string, price: number | null, compareAt: number | null): ShopifyVariant => ({
  id,
  title,
  sku: null,
  price,
  compareAtPrice: compareAt,
  weightG: null,
  weightRaw: null,
})

const result = (
  variantId: string,
  nominalWeightG: number,
  priceTTC: number,
  priceAvantPromo: number | null,
): VariantResult => ({
  variantId,
  nominalWeightG,
  isReference: false,
  realWeightG: nominalWeightG,
  cost: 1,
  pricePerGramTTC: priceTTC / nominalWeightG,
  priceTTC,
  priceHT: priceTTC / 1.2,
  priceAvantPromo,
  effectiveTauxDeMarque: 0.7,
})

describe('computePriceDiff', () => {
  it('détecte les prix à modifier et laisse les identiques inchangés', () => {
    const diff = computePriceDiff(
      [sv('gid/1', '50 g', 100, null), sv('gid/2', '100 g', 200, null)],
      [
        { id: 'v50', nominalWeightG: 50, shopifyVariantId: 'gid/1' },
        { id: 'v100', nominalWeightG: 100, shopifyVariantId: 'gid/2' },
      ],
      [result('v50', 50, 100, null), result('v100', 100, 250, null)],
    )
    expect(diff.rows).toHaveLength(2)
    expect(diff.rows[0].changed).toBe(false)
    expect(diff.rows[1].changed).toBe(true)
    expect(diff.rows[1].currentPrice).toBe(200)
    expect(diff.rows[1].newPrice).toBe(250)
    expect(changedRows(diff)).toHaveLength(1)
  })

  it('vide le prix barré quand il n’y a pas de promo', () => {
    const diff = computePriceDiff(
      [sv('gid/1', '100 g', 200, 999)],
      [{ id: 'v100', nominalWeightG: 100, shopifyVariantId: 'gid/1' }],
      [result('v100', 100, 200, null)],
    )
    expect(diff.rows[0].newCompareAt).toBeNull()
    // le prix ne change pas mais le prix barré doit être retiré
    expect(diff.rows[0].changed).toBe(true)
  })

  it('renseigne le prix barré depuis le prix avant promo', () => {
    const diff = computePriceDiff(
      [sv('gid/1', '100 g', 424.2, null)],
      [{ id: 'v100', nominalWeightG: 100, shopifyVariantId: 'gid/1' }],
      [result('v100', 100, 424.2, 1414)],
    )
    expect(diff.rows[0].newCompareAt).toBe(1414)
    expect(diff.rows[0].changed).toBe(true)
  })

  it('arrondit les prix au centime', () => {
    const diff = computePriceDiff(
      [sv('gid/1', '100 g', null, null)],
      [{ id: 'v100', nominalWeightG: 100, shopifyVariantId: 'gid/1' }],
      [result('v100', 100, 237.10499999, 790.3333)],
    )
    expect(diff.rows[0].newPrice).toBe(237.1)
    expect(diff.rows[0].newCompareAt).toBe(790.33)
  })

  it('exclut les variantes calculées non liées à Shopify', () => {
    const diff = computePriceDiff(
      [sv('gid/1', '100 g', 200, null)],
      [
        { id: 'v100', nominalWeightG: 100, shopifyVariantId: 'gid/1' },
        { id: 'v3', nominalWeightG: 3, shopifyVariantId: null },
      ],
      [result('v100', 100, 200, null), result('v3', 3, 20, null)],
    )
    expect(diff.rows).toHaveLength(1)
    expect(diff.unmatchedLocal).toEqual([{ nominalWeightG: 3 }])
  })

  it('signale les variantes Shopify non gérées par le calculateur', () => {
    const diff = computePriceDiff(
      [sv('gid/1', '100 g', 200, null), sv('gid/9', 'Coffret', 50, null)],
      [{ id: 'v100', nominalWeightG: 100, shopifyVariantId: 'gid/1' }],
      [result('v100', 100, 200, null)],
    )
    expect(diff.unmanagedShopify).toEqual([{ id: 'gid/9', label: 'Coffret' }])
  })

  it('traite un lien orphelin comme non apparié plutôt que de planter', () => {
    const diff = computePriceDiff(
      [sv('gid/1', '100 g', 200, null)],
      [{ id: 'v100', nominalWeightG: 100, shopifyVariantId: 'gid/supprimee' }],
      [result('v100', 100, 200, null)],
    )
    expect(diff.rows).toHaveLength(0)
    expect(diff.unmatchedLocal).toEqual([{ nominalWeightG: 100 }])
    expect(diff.unmanagedShopify).toHaveLength(1)
  })

  it('aucune ligne à publier quand tout est déjà à jour', () => {
    const diff = computePriceDiff(
      [sv('gid/1', '100 g', 200, 500)],
      [{ id: 'v100', nominalWeightG: 100, shopifyVariantId: 'gid/1' }],
      [result('v100', 100, 200, 500)],
    )
    expect(changedRows(diff)).toHaveLength(0)
  })
})

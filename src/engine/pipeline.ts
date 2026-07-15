import type { AppConfig, PipelineIssue, PipelineResult, VariantResult } from './types'
import { resolveOverfillExtraG } from './overfill'
import { adjustedCostPerKg, realWeightG, variantCost } from './cost'
import {
  referencePriceHT,
  priceTTCFromHT,
  priceHTFromTTC,
  referencePricePerGram,
  tauxDeMarqueFromCoutSurCA,
} from './reference'
import { computePricePerGramLadder } from './gap'
import { variantPriceTTC } from './variantPricing'
import { isValidPromoPct, prixAvantPromo } from './promo'

/** Point d'entrée unique du moteur : calcule tous les résultats à partir de la config. */
export function computeAll(config: AppConfig): PipelineResult {
  const { global: g, variants, overfillRules } = config
  const issues: PipelineIssue[] = []

  if (variants.length === 0) issues.push({ code: 'EMPTY_VARIANTS' })

  const reference = variants.find((v) => v.id === g.referenceVariantId) ?? null
  if (variants.length > 0 && !reference) issues.push({ code: 'NO_REFERENCE_VARIANT' })

  const tauxValid = Number.isFinite(g.tauxCoutSurCA) && g.tauxCoutSurCA > 0 && g.tauxCoutSurCA < 1
  if (!tauxValid) issues.push({ code: 'INVALID_TAUX_COUT', value: g.tauxCoutSurCA })

  if (!isValidPromoPct(g.promoPct)) issues.push({ code: 'INVALID_PROMO_PCT', value: g.promoPct })

  const seenWeights = new Set<number>()
  for (const v of variants) {
    if (seenWeights.has(v.nominalWeightG)) {
      issues.push({ code: 'DUPLICATE_NOMINAL_WEIGHT', weightG: v.nominalWeightG })
    }
    seenWeights.add(v.nominalWeightG)
  }

  const fatal = variants.length === 0 || !reference || !tauxValid
  if (fatal) {
    return {
      ok: false,
      issues,
      adjustedCostPerKg: Number.isFinite(g.coutAchatKg) ? adjustedCostPerKg(g.coutAchatKg) : null,
      tauxDeMarque: tauxValid ? tauxDeMarqueFromCoutSurCA(g.tauxCoutSurCA) : null,
      results: [],
    }
  }

  const costKg = adjustedCostPerKg(g.coutAchatKg)

  const sorted = [...variants].sort((a, b) => a.nominalWeightG - b.nominalWeightG)
  const refIndex = sorted.findIndex((v) => v.id === reference.id)

  const costs = sorted.map((v) => {
    const extraG = resolveOverfillExtraG(v.nominalWeightG, overfillRules)
    const realG = realWeightG(v.nominalWeightG, extraG)
    return { realG, cost: variantCost(realG, costKg) }
  })

  const refCost = costs[refIndex].cost
  const refPriceHT = referencePriceHT(refCost, g.tauxCoutSurCA)
  const refPriceTTC = priceTTCFromHT(refPriceHT, g.tvaRate)
  const refPricePerGram = referencePricePerGram(refPriceTTC, reference.nominalWeightG)

  const ladder = computePricePerGramLadder(sorted, refIndex, refPricePerGram, g.gapMode, g.gapValue)

  const results: VariantResult[] = sorted.map((v, i) => {
    const pricePerGramTTC = ladder[i]
    if (pricePerGramTTC <= 0) {
      issues.push({ code: 'NEGATIVE_PRICE_PER_GRAM', weightG: v.nominalWeightG })
    }
    const priceTTC = variantPriceTTC(pricePerGramTTC, v.nominalWeightG)
    const priceHT = priceHTFromTTC(priceTTC, g.tvaRate)
    return {
      variantId: v.id,
      nominalWeightG: v.nominalWeightG,
      isReference: v.id === reference.id,
      realWeightG: costs[i].realG,
      cost: costs[i].cost,
      pricePerGramTTC,
      priceTTC,
      priceHT,
      priceAvantPromo: prixAvantPromo(priceTTC, g.promoPct),
      effectiveTauxDeMarque: priceHT > 0 ? 1 - costs[i].cost / priceHT : 0,
    }
  })

  return {
    ok: issues.length === 0,
    issues,
    adjustedCostPerKg: costKg,
    tauxDeMarque: tauxDeMarqueFromCoutSurCA(g.tauxCoutSurCA),
    results,
  }
}

import { describe, expect, it } from 'vitest'
import { computeAll } from '../pipeline'
import type { AppConfig, OverfillRule, Variant } from '../types'

const defaultRules: OverfillRule[] = [
  { id: 'r1', minG: 3, maxG: 50, extraG: 0.5 },
  { id: 'r2', minG: 100, maxG: null, extraG: 1 },
]

function makeConfig(overrides?: Partial<AppConfig['global']>, variants?: Variant[]): AppConfig {
  return {
    schemaVersion: 1,
    global: {
      coutAchatKg: 1000,
      tauxCoutSurCA: 0.3,
      tvaRate: 0.2,
      gapMode: 'fixed',
      gapValue: 0.5,
      promoPct: 0,
      referenceVariantId: 'v100',
      ...overrides,
    },
    overfillRules: defaultRules,
    variants: variants ?? [
      { id: 'v3', nominalWeightG: 3 },
      { id: 'v50', nominalWeightG: 50 },
      { id: 'v100', nominalWeightG: 100 },
      { id: 'v200', nominalWeightG: 200 },
    ],
  }
}

describe('computeAll — scénario nominal (spec)', () => {
  // 1000 €/kg → 1050 €/kg ajusté. 100g + 1g surpoids = 101g → coût 106,05 €.
  // Prix HT = 106,05 / 0,30 = 353,50 € ; TTC = 424,20 € ; prix/g = 4,242 €/g.
  const result = computeAll(makeConfig())

  it('calcule le coût ajusté et le taux de marque', () => {
    expect(result.ok).toBe(true)
    expect(result.adjustedCostPerKg).toBeCloseTo(1050, 10)
    expect(result.tauxDeMarque).toBeCloseTo(0.7, 10)
  })

  it('la variante de référence respecte exactement le taux de coût sur CA (HT)', () => {
    const ref = result.results.find((r) => r.isReference)!
    expect(ref.nominalWeightG).toBe(100)
    expect(ref.realWeightG).toBe(101)
    expect(ref.cost).toBeCloseTo(106.05, 10)
    expect(ref.priceHT).toBeCloseTo(353.5, 10)
    expect(ref.priceTTC).toBeCloseTo(424.2, 10)
    expect(ref.cost / ref.priceHT).toBeCloseTo(0.3, 10)
    expect(ref.effectiveTauxDeMarque).toBeCloseTo(0.7, 10)
  })

  it('applique l’écart fixe de 0,5 €/g entre variantes adjacentes', () => {
    const perGram = result.results.map((r) => r.pricePerGramTTC)
    // trié : 3, 50, 100, 200 — référence 100g à 4,242 €/g
    expect(perGram[2]).toBeCloseTo(4.242, 10)
    expect(perGram[1]).toBeCloseTo(4.742, 10)
    expect(perGram[0]).toBeCloseTo(5.242, 10)
    expect(perGram[3]).toBeCloseTo(3.742, 10)
  })

  it('prix TTC = prix/g × poids nominal (pas le poids réel)', () => {
    const v50 = result.results.find((r) => r.nominalWeightG === 50)!
    expect(v50.priceTTC).toBeCloseTo(4.742 * 50, 8)
    expect(v50.realWeightG).toBe(50.5)
  })

  it('sans promo, prix avant promo = null', () => {
    expect(result.results.every((r) => r.priceAvantPromo === null)).toBe(true)
  })
})

describe('computeAll — exemple utilisateur 100g=3,5 €/g → 50g=4 €/g', () => {
  it('retrouve exactement 4 €/g pour le 50g', () => {
    // Cible : prix/g réf = 3,5 → TTC réf = 350 → HT = 291,666… → coût = 87,5 → coût kg ajusté
    // via 101g : 87,5 / 0,101 = 866,336… €/kg ajusté → coût achat = /1,05
    const coutAchatKg = (((350 / 1.2) * 0.3) / 0.101) / 1.05
    const result = computeAll(makeConfig({ coutAchatKg }))
    const v100 = result.results.find((r) => r.nominalWeightG === 100)!
    const v50 = result.results.find((r) => r.nominalWeightG === 50)!
    expect(v100.pricePerGramTTC).toBeCloseTo(3.5, 8)
    expect(v50.pricePerGramTTC).toBeCloseTo(4, 8)
    expect(v50.priceTTC).toBeCloseTo(200, 6)
  })
})

describe('computeAll — promo', () => {
  it('-70 % : prix avant promo = prix TTC / 0,30 pour toutes les variantes', () => {
    const result = computeAll(makeConfig({ promoPct: -70 }))
    for (const r of result.results) {
      expect(r.priceAvantPromo).toBeCloseTo(r.priceTTC / 0.3, 8)
    }
  })

  it('promo hors plage : issue non bloquante, colonne à null', () => {
    const result = computeAll(makeConfig({ promoPct: -100 }))
    expect(result.issues).toContainEqual({ code: 'INVALID_PROMO_PCT', value: -100 })
    expect(result.results.length).toBe(4)
    expect(result.results.every((r) => r.priceAvantPromo === null)).toBe(true)
  })
})

describe('computeAll — cas limites', () => {
  it('liste de variantes vide → bloquant', () => {
    const result = computeAll(makeConfig({}, []))
    expect(result.ok).toBe(false)
    expect(result.issues).toContainEqual({ code: 'EMPTY_VARIANTS' })
    expect(result.results).toEqual([])
  })

  it('aucune référence → bloquant', () => {
    const result = computeAll(makeConfig({ referenceVariantId: null }))
    expect(result.ok).toBe(false)
    expect(result.issues).toContainEqual({ code: 'NO_REFERENCE_VARIANT' })
    expect(result.results).toEqual([])
  })

  it('référence supprimée (id orphelin) → bloquant', () => {
    const result = computeAll(makeConfig({ referenceVariantId: 'disparu' }))
    expect(result.issues).toContainEqual({ code: 'NO_REFERENCE_VARIANT' })
  })

  it('taux de coût à 0 ou 1 → bloquant, pas de division par zéro', () => {
    for (const taux of [0, 1, -0.5, NaN]) {
      const result = computeAll(makeConfig({ tauxCoutSurCA: taux }))
      expect(result.ok).toBe(false)
      expect(result.results).toEqual([])
    }
  })

  it('poids en double → avertissement non bloquant', () => {
    const result = computeAll(
      makeConfig({}, [
        { id: 'a', nominalWeightG: 50 },
        { id: 'b', nominalWeightG: 50 },
        { id: 'v100', nominalWeightG: 100 },
      ]),
    )
    expect(result.issues).toContainEqual({ code: 'DUPLICATE_NOMINAL_WEIGHT', weightG: 50 })
    expect(result.results.length).toBe(3)
  })

  it('prix/g négatif après trop d’écarts → avertissement', () => {
    // gros écart fixe : la variante 200g passe sous zéro
    const result = computeAll(makeConfig({ gapValue: 10 }))
    expect(result.issues.some((i) => i.code === 'NEGATIVE_PRICE_PER_GRAM')).toBe(true)
  })
})

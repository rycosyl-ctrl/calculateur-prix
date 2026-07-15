import { describe, expect, it } from 'vitest'
import { MARGIN_RATE, adjustedCostPerKg, realWeightG, variantCost } from '../cost'

describe('cost', () => {
  it('la marge fixe est exactement 5 %', () => {
    expect(MARGIN_RATE).toBe(0.05)
    expect(adjustedCostPerKg(100)).toBeCloseTo(105, 10)
  })

  it('poids réel = nominal + supplément', () => {
    expect(realWeightG(50, 0.5)).toBe(50.5)
    expect(realWeightG(100, 1)).toBe(101)
  })

  it('coût variante = (poids réel / 1000) × coût ajusté au kg', () => {
    // 101 g à 105 €/kg → 10,605 €
    expect(variantCost(101, 105)).toBeCloseTo(10.605, 10)
  })
})

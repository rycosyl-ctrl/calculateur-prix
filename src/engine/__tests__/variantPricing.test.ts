import { describe, expect, it } from 'vitest'
import { roundDisplay, variantPriceTTC } from '../variantPricing'

describe('variantPricing', () => {
  it('prix TTC = prix/g × poids nominal', () => {
    expect(variantPriceTTC(4, 50)).toBeCloseTo(200, 10)
    expect(variantPriceTTC(3.5, 100)).toBeCloseTo(350, 10)
  })

  it('arrondit à 2 décimales sans dérive flottante', () => {
    expect(roundDisplay(0.1 + 0.2)).toBe(0.3)
    expect(roundDisplay(1.005)).toBe(1.01)
    expect(roundDisplay(2.674999999999)).toBe(2.67)
    expect(roundDisplay(19.999)).toBe(20)
  })
})

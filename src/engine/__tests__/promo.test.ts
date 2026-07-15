import { describe, expect, it } from 'vitest'
import { isValidPromoPct, prixAvantPromo } from '../promo'

describe('promo', () => {
  it('valide la plage ]-99,9 ; 0]', () => {
    expect(isValidPromoPct(0)).toBe(true)
    expect(isValidPromoPct(-70)).toBe(true)
    expect(isValidPromoPct(-99.8)).toBe(true)
    expect(isValidPromoPct(-99.9)).toBe(false)
    expect(isValidPromoPct(-100)).toBe(false)
    expect(isValidPromoPct(5)).toBe(false)
    expect(isValidPromoPct(NaN)).toBe(false)
  })

  it('-70 % : prix avant promo = prix / 0,30', () => {
    expect(prixAvantPromo(3, -70)).toBeCloseTo(10, 10)
  })

  it('retourne null (jamais NaN/∞) pour promo nulle ou invalide', () => {
    expect(prixAvantPromo(10, 0)).toBeNull()
    expect(prixAvantPromo(10, -100)).toBeNull()
    expect(prixAvantPromo(10, 20)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { formatShopifyMoney, parseShopifyMoney, sameMoney } from '../money'

describe('formatShopifyMoney', () => {
  it('produit toujours deux décimales à point', () => {
    expect(formatShopifyMoney(12.9)).toBe('12.90')
    expect(formatShopifyMoney(20)).toBe('20.00')
    expect(formatShopifyMoney(0)).toBe('0.00')
    expect(formatShopifyMoney(1234.567)).toBe('1234.57')
  })

  it('n’utilise JAMAIS la virgule française (Shopify refuserait)', () => {
    for (const v of [12.9, 0.5, 1000.05, 424.2]) {
      expect(formatShopifyMoney(v)).not.toContain(',')
      expect(formatShopifyMoney(v)).toMatch(/^\d+\.\d{2}$/)
    }
  })

  it('arrondit au centime sans dérive flottante', () => {
    expect(formatShopifyMoney(1.005)).toBe('1.01')
    expect(formatShopifyMoney(0.1 + 0.2)).toBe('0.30')
    expect(formatShopifyMoney(2.674999999999)).toBe('2.67')
  })

  it('refuse les montants non finis', () => {
    expect(() => formatShopifyMoney(NaN)).toThrow()
    expect(() => formatShopifyMoney(Infinity)).toThrow()
  })
})

describe('parseShopifyMoney', () => {
  it('lit les montants renvoyés par Shopify', () => {
    expect(parseShopifyMoney('12.90')).toBeCloseTo(12.9, 10)
    expect(parseShopifyMoney('0.00')).toBe(0)
  })

  it('retourne null pour une valeur absente', () => {
    expect(parseShopifyMoney(null)).toBeNull()
    expect(parseShopifyMoney(undefined)).toBeNull()
    expect(parseShopifyMoney('')).toBeNull()
    expect(parseShopifyMoney('abc')).toBeNull()
  })
})

describe('sameMoney', () => {
  it('compare au centime près', () => {
    expect(sameMoney(12.9, 12.9)).toBe(true)
    expect(sameMoney(12.901, 12.9)).toBe(true)
    expect(sameMoney(12.9, 12.91)).toBe(false)
  })

  it('traite null comme une absence de prix barré', () => {
    expect(sameMoney(null, null)).toBe(true)
    expect(sameMoney(null, 0)).toBe(false)
    expect(sameMoney(10, null)).toBe(false)
  })
})

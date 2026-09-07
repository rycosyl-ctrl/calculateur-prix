import { describe, expect, it } from 'vitest'
import { roundGrams, toGrams } from '../weight'

describe('toGrams', () => {
  it('convertit les quatre unités Shopify', () => {
    expect(toGrams(100, 'GRAMS')).toBe(100)
    expect(toGrams(0.25, 'KILOGRAMS')).toBe(250)
    expect(toGrams(1, 'POUNDS')).toBeCloseTo(453.59237, 10)
    expect(toGrams(1, 'OUNCES')).toBeCloseTo(28.349523125, 10)
  })

  it('16 onces valent exactement une livre', () => {
    expect(toGrams(16, 'OUNCES')).toBeCloseTo(toGrams(1, 'POUNDS'), 10)
  })

  it('gère zéro et les valeurs décimales', () => {
    expect(toGrams(0, 'KILOGRAMS')).toBe(0)
    expect(toGrams(3.5, 'OUNCES')).toBeCloseTo(99.2233309375, 8)
  })
})

describe('roundGrams', () => {
  it('arrondit au milligramme', () => {
    expect(roundGrams(99.2233309375)).toBe(99.223)
    expect(roundGrams(100)).toBe(100)
    expect(roundGrams(0.5)).toBe(0.5)
  })
})

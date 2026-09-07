import { describe, expect, it } from 'vitest'
import { effectiveWeightG, parseWeightFromLabel, qualifyVariants, weightTolerance } from '../match'
import type { ShopifyVariant } from '../types'

const sv = (title: string, weightG: number | null): ShopifyVariant => ({
  id: `gid/${title}`,
  title,
  sku: null,
  price: null,
  compareAtPrice: null,
  weightG,
  weightRaw: null,
})

describe('parseWeightFromLabel', () => {
  it('lit les grammes et les kilos', () => {
    expect(parseWeightFromLabel('100 g')).toBe(100)
    expect(parseWeightFromLabel('50g')).toBe(50)
    expect(parseWeightFromLabel('1 kg')).toBe(1000)
    expect(parseWeightFromLabel('2,5 Kg')).toBe(2500)
    expect(parseWeightFromLabel('250 grammes')).toBe(250)
  })

  it('retourne null quand le libellé ne contient pas de poids', () => {
    expect(parseWeightFromLabel('Coffret découverte')).toBeNull()
    expect(parseWeightFromLabel('Taille M')).toBeNull()
    expect(parseWeightFromLabel('')).toBeNull()
  })
})

describe('effectiveWeightG', () => {
  it('privilégie le poids Shopify sur le libellé', () => {
    expect(effectiveWeightG(sv('100 g', 101))).toBe(101)
  })

  it('retombe sur le libellé quand le poids est absent', () => {
    expect(effectiveWeightG(sv('100 g', null))).toBe(100)
    expect(effectiveWeightG(sv('Coffret', null))).toBeNull()
  })
})

describe('qualifyVariants', () => {
  it('qualifie chaque variante selon la provenance du poids', () => {
    const qualified = qualifyVariants([
      sv('100 g', 101),
      sv('50 g', null),
      sv('Coffret découverte', null),
    ])
    expect(qualified.map((q) => q.state)).toEqual(['matched', 'weight-from-label', 'no-weight'])
    expect(qualified[1].weightG).toBe(50)
    expect(qualified[2].weightG).toBeNull()
  })
})

describe('weightTolerance', () => {
  it('vaut au moins 0,5 g pour les petits poids', () => {
    expect(weightTolerance(3)).toBe(0.5)
    expect(weightTolerance(50)).toBe(0.5)
  })

  it('passe à 1 % au-delà de 50 g', () => {
    expect(weightTolerance(100)).toBe(1)
    expect(weightTolerance(1000)).toBe(10)
  })
})

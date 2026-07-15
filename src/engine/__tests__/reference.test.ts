import { describe, expect, it } from 'vitest'
import {
  priceHTFromTTC,
  priceTTCFromHT,
  referencePriceHT,
  referencePricePerGram,
  tauxCoutSurCAFromMarque,
  tauxDeMarqueFromCoutSurCA,
} from '../reference'

describe('taux couplés', () => {
  it('marque + coût = 1 sur toute la plage', () => {
    for (const x of [0.01, 0.2, 0.3, 0.5, 0.7, 0.99]) {
      expect(tauxDeMarqueFromCoutSurCA(x) + x).toBeCloseTo(1, 12)
      expect(tauxCoutSurCAFromMarque(tauxDeMarqueFromCoutSurCA(x))).toBeCloseTo(x, 12)
    }
  })
})

describe('prix de référence', () => {
  it('prix HT tel que le coût représente le taux voulu du CA HT', () => {
    // coût 3 €, taux de coût 30 % → prix HT 10 €
    const ht = referencePriceHT(3, 0.3)
    expect(ht).toBeCloseTo(10, 10)
    expect(3 / ht).toBeCloseTo(0.3, 10)
  })

  it('TTC = HT × (1 + TVA), et l’inverse', () => {
    expect(priceTTCFromHT(10, 0.2)).toBeCloseTo(12, 10)
    expect(priceHTFromTTC(12, 0.2)).toBeCloseTo(10, 10)
  })

  it('prix au gramme = TTC / poids nominal', () => {
    expect(referencePricePerGram(350, 100)).toBeCloseTo(3.5, 10)
  })
})

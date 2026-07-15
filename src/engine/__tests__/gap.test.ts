import { describe, expect, it } from 'vitest'
import { computePricePerGramLadder } from '../gap'
import type { Variant } from '../types'

const v = (id: string, w: number): Variant => ({ id, nominalWeightG: w })

describe('computePricePerGramLadder — mode fixe', () => {
  it('reproduit l’exemple validé : 100g à 3,5 €/g → 50g à 4 €/g', () => {
    const sorted = [v('a', 50), v('b', 100)]
    const ladder = computePricePerGramLadder(sorted, 1, 3.5, 'fixed', 0.5)
    expect(ladder[1]).toBeCloseTo(3.5, 10)
    expect(ladder[0]).toBeCloseTo(4, 10)
  })

  it('marche dans les deux sens depuis une référence au milieu', () => {
    const sorted = [v('a', 10), v('b', 50), v('c', 100), v('d', 200)]
    const ladder = computePricePerGramLadder(sorted, 2, 3.5, 'fixed', 0.5)
    expect(ladder).toEqual([4.5, 4, 3.5, 3])
  })

  it('référence en bord de liste : aucune variante d’un côté', () => {
    const sorted = [v('a', 50), v('b', 100), v('c', 200)]
    const first = computePricePerGramLadder(sorted, 0, 4, 'fixed', 0.5)
    expect(first).toEqual([4, 3.5, 3])
    const last = computePricePerGramLadder(sorted, 2, 3, 'fixed', 0.5)
    expect(last).toEqual([4, 3.5, 3])
  })

  it('liste à une seule variante', () => {
    const ladder = computePricePerGramLadder([v('a', 100)], 0, 3.5, 'fixed', 0.5)
    expect(ladder).toEqual([3.5])
  })
})

describe('computePricePerGramLadder — mode pourcentage', () => {
  it('multiplie vers les petits poids, divise vers les grands', () => {
    const sorted = [v('a', 50), v('b', 100), v('c', 200)]
    const ladder = computePricePerGramLadder(sorted, 1, 4, 'percent', 0.1)
    expect(ladder[0]).toBeCloseTo(4.4, 10)
    expect(ladder[1]).toBeCloseTo(4, 10)
    expect(ladder[2]).toBeCloseTo(4 / 1.1, 10)
  })
})

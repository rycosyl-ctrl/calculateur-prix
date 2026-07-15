import { describe, expect, it } from 'vitest'
import { resolveOverfillExtraG } from '../overfill'
import type { OverfillRule } from '../types'

const rules: OverfillRule[] = [
  { id: 'a', minG: 3, maxG: 50, extraG: 0.5 },
  { id: 'b', minG: 100, maxG: null, extraG: 1 },
]

describe('resolveOverfillExtraG', () => {
  it('applique +0,5g sur la plage 3–50g, bornes incluses', () => {
    expect(resolveOverfillExtraG(3, rules)).toBe(0.5)
    expect(resolveOverfillExtraG(20, rules)).toBe(0.5)
    expect(resolveOverfillExtraG(50, rules)).toBe(0.5)
  })

  it('applique +1g à partir de 100g sans limite haute', () => {
    expect(resolveOverfillExtraG(100, rules)).toBe(1)
    expect(resolveOverfillExtraG(200, rules)).toBe(1)
    expect(resolveOverfillExtraG(5000, rules)).toBe(1)
  })

  it('retourne 0 hors de toute plage', () => {
    expect(resolveOverfillExtraG(2, rules)).toBe(0)
    expect(resolveOverfillExtraG(75, rules)).toBe(0)
  })

  it('retourne 0 sans aucune règle', () => {
    expect(resolveOverfillExtraG(100, [])).toBe(0)
  })

  it('la première règle correspondante gagne en cas de chevauchement', () => {
    const overlapping: OverfillRule[] = [
      { id: 'x', minG: 0, maxG: null, extraG: 2 },
      ...rules,
    ]
    expect(resolveOverfillExtraG(10, overlapping)).toBe(2)
  })
})

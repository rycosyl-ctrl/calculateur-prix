import type { AppConfig } from '../engine/types'

let idCounter = 0
export function newId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export const CURRENT_SCHEMA_VERSION = 1

export function defaultConfig(): AppConfig {
  const variants = [3, 5, 10, 20, 50, 100, 200].map((w) => ({
    id: newId('v'),
    nominalWeightG: w,
  }))
  const reference = variants.find((v) => v.nominalWeightG === 100)!
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    global: {
      coutAchatKg: 1000,
      tauxCoutSurCA: 0.3,
      tvaRate: 0.2,
      gapMode: 'fixed',
      gapValue: 0.5,
      promoPct: 0,
      referenceVariantId: reference.id,
    },
    overfillRules: [
      { id: newId('r'), minG: 3, maxG: 50, extraG: 0.5 },
      { id: newId('r'), minG: 100, maxG: null, extraG: 1 },
    ],
    variants,
  }
}

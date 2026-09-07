import type { GlobalParams, OverfillRule, Variant } from '../engine/types'
import type { ProductConfig, Workspace } from './workspace'
import { WORKSPACE_SCHEMA_VERSION } from './workspace'

let idCounter = 0
export function newId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export const CURRENT_SCHEMA_VERSION = WORKSPACE_SCHEMA_VERSION

const DEFAULT_WEIGHTS_G = [3, 5, 10, 20, 50, 100, 200]

function defaultGlobal(referenceVariantId: string | null): GlobalParams {
  return {
    coutAchatKg: 1000,
    tauxCoutSurCA: 0.3,
    tvaRate: 0.2,
    gapMode: 'fixed',
    gapValue: 0.5,
    promoPct: 0,
    referenceVariantId,
  }
}

export function defaultOverfillRules(): OverfillRule[] {
  return [
    { id: newId('r'), minG: 3, maxG: 50, extraG: 0.5 },
    { id: newId('r'), minG: 100, maxG: null, extraG: 1 },
  ]
}

/** Produit neuf avec les variantes et tranches de surpoids habituelles. */
export function defaultProduct(name = 'Nouveau produit'): ProductConfig {
  const variants: Variant[] = DEFAULT_WEIGHTS_G.map((w) => ({
    id: newId('v'),
    nominalWeightG: w,
  }))
  const reference = variants.find((v) => v.nominalWeightG === 100) ?? variants[0] ?? null
  return {
    id: newId('p'),
    name,
    shopifyProductId: null,
    shopifyProductHandle: null,
    shopifyUpdatedAt: null,
    lastPublishedAt: null,
    global: defaultGlobal(reference?.id ?? null),
    overfillRules: defaultOverfillRules(),
    variants,
  }
}

export function defaultWorkspace(): Workspace {
  const product = defaultProduct('Produit 1')
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    products: [product],
    activeProductId: product.id,
  }
}

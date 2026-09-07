import type { PricingInput } from '../engine/types'

/** Un produit : ses paramètres de calcul + son éventuel lien Shopify. */
export interface ProductConfig extends PricingInput {
  id: string
  name: string
  /** gid://shopify/Product/… si le produit est lié à Shopify */
  shopifyProductId: string | null
  shopifyProductHandle: string | null
  /** updatedAt Shopify au moment de l'import : détecte les modifications concurrentes */
  shopifyUpdatedAt: string | null
  lastPublishedAt: string | null
}

/** Racine persistée (schemaVersion 2) : plusieurs produits par utilisateur. */
export interface Workspace {
  schemaVersion: number
  products: ProductConfig[]
  activeProductId: string | null
}

export const WORKSPACE_SCHEMA_VERSION = 2

/** Produit actif, ou null si la liste est vide / l'id est orphelin. */
export function activeProduct(workspace: Workspace): ProductConfig | null {
  return workspace.products.find((p) => p.id === workspace.activeProductId) ?? null
}

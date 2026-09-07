export type WeightUnit = 'GRAMS' | 'KILOGRAMS' | 'POUNDS' | 'OUNCES'

export interface ShopifyProductSummary {
  id: string
  title: string
  handle: string
  status: string
  variantsCount: number
  imageUrl: string | null
}

export interface ShopifyVariant {
  id: string
  title: string
  sku: string | null
  /** Prix actuel dans Shopify (devise par défaut de la boutique) */
  price: number | null
  compareAtPrice: number | null
  /** Poids converti en grammes, null si absent dans Shopify */
  weightG: number | null
  weightRaw: { value: number; unit: WeightUnit } | null
}

export interface ShopifyProductDetail {
  id: string
  title: string
  handle: string
  status: string
  updatedAt: string
  variants: ShopifyVariant[]
  hasMoreVariants: boolean
}

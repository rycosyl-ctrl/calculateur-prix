/** Règle de surpoids : pour un poids nominal dans [minG, maxG], on ajoute extraG au poids réel. */
export interface OverfillRule {
  id: string
  minG: number
  /** null = pas de limite haute (∞) */
  maxG: number | null
  extraG: number
}

export interface Variant {
  id: string
  nominalWeightG: number
}

export type GapMode = 'fixed' | 'percent'

export interface GlobalParams {
  /** Coût d'achat en €/kg */
  coutAchatKg: number
  /** Taux de coût sur CA, fraction dans ]0;1[ (ex : 0.30). Taux de marque = 1 − ce taux. */
  tauxCoutSurCA: number
  /** Taux de TVA, fraction (ex : 0.20) */
  tvaRate: number
  gapMode: GapMode
  /** Écart entre variantes adjacentes : €/g si 'fixed', fraction si 'percent' (0.10 = 10 %) */
  gapValue: number
  /** Pourcentage de promo, ex : -70. Plage valide : ]-99.9 ; 0] */
  promoPct: number
  referenceVariantId: string | null
}

export interface AppConfig {
  schemaVersion: number
  global: GlobalParams
  overfillRules: OverfillRule[]
  variants: Variant[]
}

export interface VariantResult {
  variantId: string
  nominalWeightG: number
  isReference: boolean
  /** Poids réel = nominal + surpoids (sert uniquement au coût) */
  realWeightG: number
  /** Coût de revient de la variante en € */
  cost: number
  /** Prix de vente TTC au gramme */
  pricePerGramTTC: number
  priceTTC: number
  priceHT: number
  /** Prix barré avant promo ; null si promo invalide ou nulle */
  priceAvantPromo: number | null
  /** Taux de marque réel de cette variante (1 − coût/prixHT) */
  effectiveTauxDeMarque: number
}

export type PipelineIssue =
  | { code: 'NO_REFERENCE_VARIANT' }
  | { code: 'EMPTY_VARIANTS' }
  | { code: 'INVALID_TAUX_COUT'; value: number }
  | { code: 'INVALID_PROMO_PCT'; value: number }
  | { code: 'DUPLICATE_NOMINAL_WEIGHT'; weightG: number }
  | { code: 'NEGATIVE_PRICE_PER_GRAM'; weightG: number }

export interface PipelineResult {
  ok: boolean
  issues: PipelineIssue[]
  adjustedCostPerKg: number | null
  tauxDeMarque: number | null
  /** Trié par poids croissant ; vide si un problème bloquant existe */
  results: VariantResult[]
}

/** Taux couplés : taux de marque = 1 − taux de coût sur CA (et réciproquement). */
export function tauxDeMarqueFromCoutSurCA(tauxCoutSurCA: number): number {
  return 1 - tauxCoutSurCA
}

export function tauxCoutSurCAFromMarque(tauxDeMarque: number): number {
  return 1 - tauxDeMarque
}

/** Prix HT tel que coût / prixHT = tauxCoutSurCA. */
export function referencePriceHT(referenceCost: number, tauxCoutSurCA: number): number {
  return referenceCost / tauxCoutSurCA
}

export function priceTTCFromHT(priceHT: number, tvaRate: number): number {
  return priceHT * (1 + tvaRate)
}

export function priceHTFromTTC(priceTTC: number, tvaRate: number): number {
  return priceTTC / (1 + tvaRate)
}

export function referencePricePerGram(priceTTC: number, referenceNominalWeightG: number): number {
  return priceTTC / referenceNominalWeightG
}

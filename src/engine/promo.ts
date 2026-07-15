/** Plage valide du pourcentage de promo : ]-99,9 ; 0]. 0 = pas de promo. */
export function isValidPromoPct(promoPct: number): boolean {
  return Number.isFinite(promoPct) && promoPct > -99.9 && promoPct <= 0
}

/**
 * Prix barré "avant promo" : prixTTC / (1 + promo/100).
 * Ex : promo -70 → prixTTC / 0,30. Retourne null si promo invalide ou nulle.
 */
export function prixAvantPromo(priceTTC: number, promoPct: number): number | null {
  if (!isValidPromoPct(promoPct) || promoPct === 0) return null
  return priceTTC / (1 + promoPct / 100)
}

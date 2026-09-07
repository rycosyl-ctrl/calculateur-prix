/**
 * Sérialisation d'un montant pour l'API Shopify : le scalaire Money est une
 * chaîne à point décimal, deux décimales, sans symbole.
 *
 * NE JAMAIS réutiliser le formatage d'affichage de l'app (qui produit une
 * virgule française) : Shopify refuserait ou mal interpréterait « 12,90 ».
 */
export function formatShopifyMoney(value: number): string {
  if (!Number.isFinite(value)) throw new Error(`Montant invalide : ${value}`)
  // arrondi au centime en évitant la dérive flottante de toFixed sur .005
  const cents = Math.round((value + Number.EPSILON) * 100)
  return (cents / 100).toFixed(2)
}

/** Lecture d'un montant renvoyé par Shopify ; null si absent ou illisible. */
export function parseShopifyMoney(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : null
}

/** Deux montants sont-ils identiques au centime près ? */
export function sameMoney(a: number | null, b: number | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return Math.round(a * 100) === Math.round(b * 100)
}

import { z } from 'zod'
import type { AppConfigV1 } from '../engine/types'
import type { ProductConfig, Workspace } from './workspace'
import { WORKSPACE_SCHEMA_VERSION } from './workspace'
import { defaultWorkspace, newId } from './defaultState'

const STORAGE_KEY_BASE = 'bulk-pricing-app:config'

/** Clé localStorage par utilisateur, pour ne pas mélanger les configs sur un poste partagé. */
export function storageKey(userId: string | null): string {
  return userId ? `${STORAGE_KEY_BASE}:${userId}` : STORAGE_KEY_BASE
}

const OverfillRuleSchema = z.object({
  id: z.string(),
  minG: z.number(),
  maxG: z.number().nullable(),
  extraG: z.number(),
})

const VariantSchema = z.object({
  id: z.string(),
  nominalWeightG: z.number(),
  shopifyVariantId: z.string().nullish().transform((v) => v ?? null),
})

const GlobalParamsSchema = z.object({
  coutAchatKg: z.number(),
  tauxCoutSurCA: z.number(),
  tvaRate: z.number(),
  gapMode: z.enum(['fixed', 'percent']),
  gapValue: z.number(),
  promoPct: z.number(),
  referenceVariantId: z.string().nullable(),
})

const PricingInputSchema = z.object({
  global: GlobalParamsSchema,
  overfillRules: z.array(OverfillRuleSchema),
  variants: z.array(VariantSchema),
})

/**
 * Schéma de l'ancienne configuration unique (schemaVersion 1).
 * À CONSERVER indéfiniment : sans lui, les données déjà enregistrées
 * chez les utilisateurs ne pourraient plus être migrées et seraient perdues.
 */
const AppConfigV1Schema = PricingInputSchema.extend({
  schemaVersion: z.number(),
})

const ProductConfigSchema = PricingInputSchema.extend({
  id: z.string(),
  name: z.string(),
  shopifyProductId: z.string().nullish().transform((v) => v ?? null),
  shopifyProductHandle: z.string().nullish().transform((v) => v ?? null),
  shopifyUpdatedAt: z.string().nullish().transform((v) => v ?? null),
  lastPublishedAt: z.string().nullish().transform((v) => v ?? null),
})

const WorkspaceSchema = z.object({
  schemaVersion: z.number(),
  products: z.array(ProductConfigSchema),
  activeProductId: z.string().nullable(),
})

/** Enveloppe l'ancienne configuration unique dans un premier produit. */
export function migrateV1toV2(
  v1: AppConfigV1,
  idFactory: () => string = () => newId('p'),
): Workspace {
  const product: ProductConfig = {
    id: idFactory(),
    name: 'Produit 1',
    shopifyProductId: null,
    shopifyProductHandle: null,
    shopifyUpdatedAt: null,
    lastPublishedAt: null,
    global: v1.global,
    overfillRules: v1.overfillRules,
    // on normalise la forme des variantes pour que la sortie de la migration
    // soit identique à celle d'une lecture v2 validée (migration idempotente)
    variants: v1.variants.map((v) => ({ ...v, shopifyVariantId: v.shopifyVariantId ?? null })),
  }
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    products: [product],
    activeProductId: product.id,
  }
}

/** Répare un espace de travail incohérent (id actif orphelin, liste vide). */
function normalize(workspace: Workspace): Workspace {
  if (workspace.products.length === 0) return defaultWorkspace()
  const activeExists = workspace.products.some((p) => p.id === workspace.activeProductId)
  return {
    ...workspace,
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    activeProductId: activeExists ? workspace.activeProductId : workspace.products[0].id,
  }
}

/**
 * Aiguillage par version AVANT toute validation : on ne tamponne jamais
 * la version courante sur des données non migrées (sinon perte silencieuse).
 */
export function migrateWorkspace(data: unknown): Workspace {
  const version = (data as { schemaVersion?: unknown } | null)?.schemaVersion

  if (version === WORKSPACE_SCHEMA_VERSION) {
    const parsed = WorkspaceSchema.safeParse(data)
    return parsed.success ? normalize(parsed.data) : defaultWorkspace()
  }

  if (version === 1) {
    const parsed = AppConfigV1Schema.safeParse(data)
    return parsed.success ? migrateV1toV2(parsed.data) : defaultWorkspace()
  }

  return defaultWorkspace()
}

export function loadWorkspace(userId: string | null = null): Workspace {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return defaultWorkspace()
    return migrateWorkspace(JSON.parse(raw))
  } catch {
    return defaultWorkspace()
  }
}

export function saveWorkspace(workspace: Workspace, userId: string | null = null): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(workspace))
  } catch {
    // stockage plein ou indisponible : on ignore, l'app reste utilisable en mémoire
  }
}

/** Import d'un fichier JSON exporté : accepte l'ancien et le nouveau format. */
export function parseImportedWorkspace(json: string): Workspace | null {
  try {
    const data: unknown = JSON.parse(json)
    const version = (data as { schemaVersion?: unknown } | null)?.schemaVersion
    if (version !== 1 && version !== WORKSPACE_SCHEMA_VERSION) return null
    const migrated = migrateWorkspace(data)
    // migrateWorkspace retombe sur les valeurs par défaut en cas d'échec :
    // on refuse l'import plutôt que d'écraser le travail en cours.
    if (version === 1) {
      return AppConfigV1Schema.safeParse(data).success ? migrated : null
    }
    return WorkspaceSchema.safeParse(data).success ? migrated : null
  } catch {
    return null
  }
}

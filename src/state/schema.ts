import { z } from 'zod'
import type { AppConfig } from '../engine/types'
import { CURRENT_SCHEMA_VERSION, defaultConfig } from './defaultState'

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
})

const AppConfigSchema = z.object({
  schemaVersion: z.number(),
  global: z.object({
    coutAchatKg: z.number(),
    tauxCoutSurCA: z.number(),
    tvaRate: z.number(),
    gapMode: z.enum(['fixed', 'percent']),
    gapValue: z.number(),
    promoPct: z.number(),
    referenceVariantId: z.string().nullable(),
  }),
  overfillRules: z.array(OverfillRuleSchema),
  variants: z.array(VariantSchema),
})

export function migrateConfig(data: unknown): AppConfig {
  // Futures migrations : if ((data as any)?.schemaVersion < 2) data = migrateV1toV2(data)
  const result = AppConfigSchema.safeParse(data)
  if (!result.success) return defaultConfig()
  return { ...result.data, schemaVersion: CURRENT_SCHEMA_VERSION }
}

export function loadConfig(userId: string | null = null): AppConfig {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return defaultConfig()
    return migrateConfig(JSON.parse(raw))
  } catch {
    return defaultConfig()
  }
}

export function saveConfig(config: AppConfig, userId: string | null = null): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(config))
  } catch {
    // stockage plein ou indisponible : on ignore, l'app reste utilisable en mémoire
  }
}

export function parseImportedConfig(json: string): AppConfig | null {
  try {
    const result = AppConfigSchema.safeParse(JSON.parse(json))
    return result.success ? { ...result.data, schemaVersion: CURRENT_SCHEMA_VERSION } : null
  } catch {
    return null
  }
}

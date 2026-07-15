import { supabase } from '../lib/supabase'
import type { AppConfig } from '../engine/types'
import { migrateConfig } from './schema'

/** Config de l'utilisateur en base, ou null s'il n'en a pas encore (premier login). */
export async function fetchRemoteConfig(userId: string): Promise<AppConfig | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_configs')
    .select('config')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return migrateConfig(data.config)
}

export async function upsertRemoteConfig(userId: string, config: AppConfig): Promise<void> {
  if (!supabase) return
  await supabase
    .from('user_configs')
    .upsert({ user_id: userId, config, updated_at: new Date().toISOString() })
}

import { supabase } from '../lib/supabase'
import type { Workspace } from './workspace'
import { migrateWorkspace } from './schema'

/**
 * Espace de travail de l'utilisateur en base, ou null s'il n'en a pas encore.
 * La colonne `config` contient l'ancienne config unique (v1) ou la nouvelle
 * liste de produits (v2) : la migration s'occupe des deux.
 */
export async function fetchRemoteWorkspace(userId: string): Promise<Workspace | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_configs')
    .select('config')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return migrateWorkspace(data.config)
}

export async function upsertRemoteWorkspace(userId: string, workspace: Workspace): Promise<void> {
  if (!supabase) return
  await supabase
    .from('user_configs')
    .upsert({ user_id: userId, config: workspace, updated_at: new Date().toISOString() })
}

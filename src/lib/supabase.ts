import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Client Supabase, ou null si les variables d'environnement ne sont pas définies.
 * Sans configuration, l'app fonctionne en mode local (localStorage uniquement, sans connexion).
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Type du lien d'authentification à l'arrivée sur la page (invite, recovery…),
 * capturé AVANT que le client Supabase ne consomme le hash de l'URL.
 */
export const initialAuthLinkType: string | null = (() => {
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  const match = hash.match(/[#&]type=([a-z]+)/)
  return match ? match[1] : null
})()

/**
 * Client Supabase, ou null si les variables d'environnement ne sont pas définies.
 * Sans configuration, l'app fonctionne en mode local (localStorage uniquement, sans connexion).
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

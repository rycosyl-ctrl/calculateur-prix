import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppConfig, GlobalParams, OverfillRule, Variant } from '../engine/types'
import { defaultConfig, newId } from './defaultState'
import { loadConfig, saveConfig } from './schema'
import { fetchRemoteConfig, upsertRemoteConfig } from './remoteConfig'

export type Action =
  | { type: 'SET_GLOBAL_PARAM'; patch: Partial<GlobalParams> }
  | { type: 'ADD_OVERFILL_RULE' }
  | { type: 'UPDATE_OVERFILL_RULE'; id: string; patch: Partial<Omit<OverfillRule, 'id'>> }
  | { type: 'REMOVE_OVERFILL_RULE'; id: string }
  | { type: 'ADD_VARIANT'; nominalWeightG?: number }
  | { type: 'UPDATE_VARIANT'; id: string; patch: Partial<Omit<Variant, 'id'>> }
  | { type: 'REMOVE_VARIANT'; id: string }
  | { type: 'SET_REFERENCE_VARIANT'; id: string }
  | { type: 'RESET_TO_DEFAULTS' }
  | { type: 'IMPORT_CONFIG'; config: AppConfig }

function reducer(state: AppConfig, action: Action): AppConfig {
  switch (action.type) {
    case 'SET_GLOBAL_PARAM':
      return { ...state, global: { ...state.global, ...action.patch } }
    case 'ADD_OVERFILL_RULE':
      return {
        ...state,
        overfillRules: [...state.overfillRules, { id: newId('r'), minG: 0, maxG: null, extraG: 0 }],
      }
    case 'UPDATE_OVERFILL_RULE':
      return {
        ...state,
        overfillRules: state.overfillRules.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r,
        ),
      }
    case 'REMOVE_OVERFILL_RULE':
      return { ...state, overfillRules: state.overfillRules.filter((r) => r.id !== action.id) }
    case 'ADD_VARIANT': {
      const maxWeight = Math.max(0, ...state.variants.map((v) => v.nominalWeightG))
      const variant: Variant = {
        id: newId('v'),
        nominalWeightG: action.nominalWeightG ?? (maxWeight > 0 ? maxWeight * 2 : 10),
      }
      return { ...state, variants: [...state.variants, variant] }
    }
    case 'UPDATE_VARIANT':
      return {
        ...state,
        variants: state.variants.map((v) => (v.id === action.id ? { ...v, ...action.patch } : v)),
      }
    case 'REMOVE_VARIANT': {
      const variants = state.variants.filter((v) => v.id !== action.id)
      const referenceVariantId =
        state.global.referenceVariantId === action.id ? null : state.global.referenceVariantId
      return { ...state, variants, global: { ...state.global, referenceVariantId } }
    }
    case 'SET_REFERENCE_VARIANT':
      return { ...state, global: { ...state.global, referenceVariantId: action.id } }
    case 'RESET_TO_DEFAULTS':
      return defaultConfig()
    case 'IMPORT_CONFIG':
      return action.config
  }
}

interface AppStateContextValue {
  config: AppConfig
  dispatch: React.Dispatch<Action>
  /** true tant que la config distante n'a pas été chargée (utilisateur connecté uniquement) */
  syncing: boolean
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({
  userId = null,
  children,
}: {
  userId?: string | null
  children: ReactNode
}) {
  const [config, dispatch] = useReducer(reducer, userId, loadConfig)
  // Connecté : on attend la config distante avant d'autoriser les sauvegardes,
  // pour ne pas écraser la base avec les valeurs par défaut locales.
  const [hydrated, setHydrated] = useState(userId === null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchRemoteConfig(userId).then((remote) => {
      if (cancelled) return
      if (remote) dispatch({ type: 'IMPORT_CONFIG', config: remote })
      setHydrated(true)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!hydrated) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      saveConfig(config, userId)
      if (userId) upsertRemoteConfig(userId, config)
    }, 300)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [config, hydrated, userId])

  const value = useMemo(
    () => ({ config, dispatch, syncing: !hydrated }),
    [config, hydrated],
  )
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState doit être utilisé sous AppStateProvider')
  return ctx
}

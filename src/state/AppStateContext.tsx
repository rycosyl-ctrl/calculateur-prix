import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import type { ReactNode } from 'react'
import type { AppConfig, GlobalParams, OverfillRule, Variant } from '../engine/types'
import { defaultConfig, newId } from './defaultState'
import { loadConfig, saveConfig } from './schema'

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
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [config, dispatch] = useReducer(reducer, undefined, loadConfig)

  // sauvegarde débouncée en localStorage
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => saveConfig(config), 300)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [config])

  const value = useMemo(() => ({ config, dispatch }), [config])
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState doit être utilisé sous AppStateProvider')
  return ctx
}

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { GlobalParams, OverfillRule, Variant } from '../engine/types'
import type { ProductConfig, Workspace } from './workspace'
import { activeProduct } from './workspace'
import { defaultProduct, newId } from './defaultState'
import { loadWorkspace, saveWorkspace } from './schema'
import { fetchRemoteWorkspace, upsertRemoteWorkspace } from './remoteConfig'

/** Actions appliquées au produit actif (comportement d'origine, inchangé). */
type ProductAction =
  | { type: 'SET_GLOBAL_PARAM'; patch: Partial<GlobalParams> }
  | { type: 'ADD_OVERFILL_RULE' }
  | { type: 'UPDATE_OVERFILL_RULE'; id: string; patch: Partial<Omit<OverfillRule, 'id'>> }
  | { type: 'REMOVE_OVERFILL_RULE'; id: string }
  | { type: 'ADD_VARIANT'; nominalWeightG?: number }
  | { type: 'UPDATE_VARIANT'; id: string; patch: Partial<Omit<Variant, 'id'>> }
  | { type: 'REMOVE_VARIANT'; id: string }
  | { type: 'SET_REFERENCE_VARIANT'; id: string }
  | { type: 'RESET_PRODUCT' }

/** Actions de niveau espace de travail (liste de produits). */
type WorkspaceAction =
  | { type: 'ADD_PRODUCT'; name?: string }
  | { type: 'RENAME_PRODUCT'; id: string; name: string }
  | { type: 'REMOVE_PRODUCT'; id: string }
  | { type: 'DUPLICATE_PRODUCT'; id: string }
  | { type: 'SET_ACTIVE_PRODUCT'; id: string }
  | { type: 'IMPORT_WORKSPACE'; workspace: Workspace }

export type Action = ProductAction | WorkspaceAction

const PRODUCT_ACTIONS: ReadonlySet<string> = new Set<ProductAction['type']>([
  'SET_GLOBAL_PARAM',
  'ADD_OVERFILL_RULE',
  'UPDATE_OVERFILL_RULE',
  'REMOVE_OVERFILL_RULE',
  'ADD_VARIANT',
  'UPDATE_VARIANT',
  'REMOVE_VARIANT',
  'SET_REFERENCE_VARIANT',
  'RESET_PRODUCT',
])

function isProductAction(action: Action): action is ProductAction {
  return PRODUCT_ACTIONS.has(action.type)
}

function productReducer(state: ProductConfig, action: ProductAction): ProductConfig {
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
        shopifyVariantId: null,
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
    case 'RESET_PRODUCT': {
      // remet les paramètres à zéro sans casser le lien Shopify ni renommer
      const fresh = defaultProduct(state.name)
      return { ...fresh, id: state.id, name: state.name,
        shopifyProductId: state.shopifyProductId,
        shopifyProductHandle: state.shopifyProductHandle,
        shopifyUpdatedAt: state.shopifyUpdatedAt,
        lastPublishedAt: state.lastPublishedAt }
    }
  }
}

function reducer(state: Workspace, action: Action): Workspace {
  if (isProductAction(action)) {
    return {
      ...state,
      products: state.products.map((p) =>
        p.id === state.activeProductId ? productReducer(p, action) : p,
      ),
    }
  }

  switch (action.type) {
    case 'ADD_PRODUCT': {
      const product = defaultProduct(action.name ?? `Produit ${state.products.length + 1}`)
      return { ...state, products: [...state.products, product], activeProductId: product.id }
    }
    case 'RENAME_PRODUCT':
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.id ? { ...p, name: action.name } : p,
        ),
      }
    case 'DUPLICATE_PRODUCT': {
      const source = state.products.find((p) => p.id === action.id)
      if (!source) return state
      // nouveaux ids de variantes, en reportant la référence sur la copie
      const idMap = new Map(source.variants.map((v) => [v.id, newId('v')]))
      const copy: ProductConfig = {
        ...source,
        id: newId('p'),
        name: `${source.name} (copie)`,
        shopifyProductId: null,
        shopifyProductHandle: null,
        shopifyUpdatedAt: null,
        lastPublishedAt: null,
        variants: source.variants.map((v) => ({
          ...v,
          id: idMap.get(v.id)!,
          shopifyVariantId: null,
        })),
        overfillRules: source.overfillRules.map((r) => ({ ...r, id: newId('r') })),
        global: {
          ...source.global,
          referenceVariantId: source.global.referenceVariantId
            ? idMap.get(source.global.referenceVariantId) ?? null
            : null,
        },
      }
      return { ...state, products: [...state.products, copy], activeProductId: copy.id }
    }
    case 'REMOVE_PRODUCT': {
      const products = state.products.filter((p) => p.id !== action.id)
      if (products.length === 0) {
        const fresh = defaultProduct('Produit 1')
        return { ...state, products: [fresh], activeProductId: fresh.id }
      }
      const activeProductId =
        state.activeProductId === action.id ? products[0].id : state.activeProductId
      return { ...state, products, activeProductId }
    }
    case 'SET_ACTIVE_PRODUCT':
      return { ...state, activeProductId: action.id }
    case 'IMPORT_WORKSPACE':
      return action.workspace
  }
}

interface AppStateContextValue {
  /** Produit actif : ce que consomment les panneaux de paramètres et le moteur */
  config: ProductConfig
  dispatch: React.Dispatch<Action>
  /** true tant que la config distante n'a pas été chargée (utilisateur connecté uniquement) */
  syncing: boolean
  workspace: Workspace
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({
  userId = null,
  children,
}: {
  userId?: string | null
  children: ReactNode
}) {
  const [workspace, dispatch] = useReducer(reducer, userId, loadWorkspace)
  // Connecté : on attend la config distante avant d'autoriser les sauvegardes,
  // pour ne pas écraser la base avec les valeurs par défaut locales.
  const [hydrated, setHydrated] = useState(userId === null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchRemoteWorkspace(userId).then((remote) => {
      if (cancelled) return
      if (remote) dispatch({ type: 'IMPORT_WORKSPACE', workspace: remote })
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
      saveWorkspace(workspace, userId)
      if (userId) upsertRemoteWorkspace(userId, workspace)
    }, 300)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [workspace, hydrated, userId])

  const value = useMemo(() => {
    // migrateWorkspace/normalize garantissent au moins un produit et un id actif valide
    const config = activeProduct(workspace) ?? workspace.products[0]
    return { config, dispatch, syncing: !hydrated, workspace }
  }, [workspace, hydrated])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState doit être utilisé sous AppStateProvider')
  return ctx
}

import { describe, expect, it } from 'vitest'
import { migrateV1toV2, migrateWorkspace, parseImportedWorkspace } from '../schema'
import { defaultWorkspace } from '../defaultState'
import { WORKSPACE_SCHEMA_VERSION } from '../workspace'
import type { AppConfigV1 } from '../../engine/types'

const v1: AppConfigV1 = {
  schemaVersion: 1,
  global: {
    coutAchatKg: 1234.5,
    tauxCoutSurCA: 0.28,
    tvaRate: 0.055,
    gapMode: 'percent',
    gapValue: 0.12,
    promoPct: -70,
    referenceVariantId: 'v100',
  },
  overfillRules: [
    { id: 'r1', minG: 3, maxG: 50, extraG: 0.5 },
    { id: 'r2', minG: 100, maxG: null, extraG: 1 },
  ],
  variants: [
    { id: 'v50', nominalWeightG: 50 },
    { id: 'v100', nominalWeightG: 100 },
  ],
}

describe('migrateV1toV2', () => {
  const workspace = migrateV1toV2(v1, () => 'p-fixe')

  it('enveloppe l’ancienne config dans un unique produit actif', () => {
    expect(workspace.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION)
    expect(workspace.products).toHaveLength(1)
    expect(workspace.activeProductId).toBe('p-fixe')
    expect(workspace.products[0].id).toBe('p-fixe')
    expect(workspace.products[0].name).toBe('Produit 1')
  })

  it('préserve à l’identique tous les paramètres de calcul', () => {
    const p = workspace.products[0]
    expect(p.global).toEqual(v1.global)
    expect(p.overfillRules).toEqual(v1.overfillRules)
    expect(p.global.referenceVariantId).toBe('v100')
    // les variantes gagnent seulement le champ Shopify, à null
    expect(p.variants).toEqual([
      { id: 'v50', nominalWeightG: 50, shopifyVariantId: null },
      { id: 'v100', nominalWeightG: 100, shopifyVariantId: null },
    ])
  })

  it('ne lie le produit à aucun produit Shopify', () => {
    const p = workspace.products[0]
    expect(p.shopifyProductId).toBeNull()
    expect(p.lastPublishedAt).toBeNull()
  })
})

describe('migrateWorkspace — aiguillage par version', () => {
  it('migre une configuration v1 au lieu de la jeter', () => {
    const result = migrateWorkspace(v1)
    expect(result.products).toHaveLength(1)
    expect(result.products[0].global.coutAchatKg).toBe(1234.5)
  })

  it('RÉGRESSION : une v1 ne doit jamais ressortir estampillée v2 sans migration', () => {
    const result = migrateWorkspace(v1)
    // si la migration était sautée, on aurait encore les clés v1 à la racine
    expect(result).not.toHaveProperty('global')
    expect(result).not.toHaveProperty('variants')
    expect(result.products[0].variants.map((v) => v.nominalWeightG)).toEqual([50, 100])
  })

  it('laisse passer un espace de travail v2 intact (idempotence)', () => {
    const v2 = migrateV1toV2(v1, () => 'p-fixe')
    expect(migrateWorkspace(v2)).toEqual(v2)
    expect(migrateWorkspace(migrateWorkspace(v2))).toEqual(v2)
  })

  it('retombe sur les valeurs par défaut pour des données corrompues', () => {
    for (const bad of [null, undefined, {}, 42, 'x', { schemaVersion: 1 }, { schemaVersion: 99 }]) {
      const result = migrateWorkspace(bad)
      expect(result.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION)
      expect(result.products).toHaveLength(1)
    }
  })

  it('répare un id de produit actif orphelin', () => {
    const v2 = migrateV1toV2(v1, () => 'p-fixe')
    const result = migrateWorkspace({ ...v2, activeProductId: 'disparu' })
    expect(result.activeProductId).toBe('p-fixe')
  })

  it('remplace une liste de produits vide par les valeurs par défaut', () => {
    const result = migrateWorkspace({
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      products: [],
      activeProductId: null,
    })
    expect(result.products).toHaveLength(1)
  })

  it('accepte une v2 dont les champs Shopify sont absents (ajoutés après coup)', () => {
    const result = migrateWorkspace({
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      products: [
        {
          id: 'p1',
          name: 'Sans champs Shopify',
          global: v1.global,
          overfillRules: v1.overfillRules,
          variants: v1.variants,
        },
      ],
      activeProductId: 'p1',
    })
    expect(result.products[0].shopifyProductId).toBeNull()
    expect(result.products[0].variants[0].shopifyVariantId).toBeNull()
  })
})

describe('parseImportedWorkspace', () => {
  it('importe un ancien export v1', () => {
    const result = parseImportedWorkspace(JSON.stringify(v1))
    expect(result?.products[0].global.coutAchatKg).toBe(1234.5)
  })

  it('importe un export v2', () => {
    const v2 = defaultWorkspace()
    expect(parseImportedWorkspace(JSON.stringify(v2))?.products).toHaveLength(1)
  })

  it('refuse un fichier invalide plutôt que d’écraser le travail en cours', () => {
    expect(parseImportedWorkspace('pas du json')).toBeNull()
    expect(parseImportedWorkspace('{"schemaVersion":1}')).toBeNull()
    expect(parseImportedWorkspace('{"schemaVersion":2,"products":"x"}')).toBeNull()
    expect(parseImportedWorkspace('{}')).toBeNull()
  })
})

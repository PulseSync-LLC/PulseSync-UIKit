/**
 * Визуальный граф блюпринта (как в UE5): узлы на канвасе, связи секция → элемент.
 */

import type { AddonSettingsSchema, AddonSettingsSection, AddonSettingsItem, AddonSettingsNodeLayout } from './types'

export type BlueprintNodeType = 'section' | 'item'

export interface BlueprintNodeBase {
    id: string
    type: BlueprintNodeType
    position: { x: number; y: number }
}

export interface BlueprintSectionNode extends BlueprintNodeBase {
    type: 'section'
    title: string
}

export interface BlueprintItemNode extends BlueprintNodeBase {
    type: 'item'
    /** id секции-родителя (BlueprintSectionNode.id) */
    sectionId: string
    /** Данные элемента (id, name, description, type, …) */
    item: AddonSettingsItem
}

export type BlueprintNode = BlueprintSectionNode | BlueprintItemNode

export interface BlueprintGraph {
    nodes: BlueprintNode[]
}

import {
    SECTION_HEADER_H,
    ITEM_NODE_H,
    GAP_SECTION_TO_ITEMS,
    GAP_BETWEEN_ITEMS,
    GAP_BETWEEN_SECTIONS,
    ITEM_INDENT_X,
} from './constants'

const LAYOUT_START_X = 48
const LAYOUT_START_Y = 32

/**
 * Stable section id by index so layout can be merged when re-building from schema.
 */
function sectionIdByIndex(secIdx: number): string {
    return `section_${secIdx}`
}

/**
 * Build blueprint graph from schema. Node positions are stored in the graph and
 * persist across onChange; they are only reset when building from schema without
 * a previous graph.
 *
 * @param schema - Addon settings schema (sections/items)
 * @param previousGraph - If provided, node positions are taken from here when
 *   the same node id exists (sections matched by index, items by item.id).
 *   This way the editor "remembers" layout when schema is re-applied.
 */
export function schemaToBlueprintGraph(
    schema: AddonSettingsSchema,
    previousGraph?: BlueprintGraph
): BlueprintGraph {
    const nodes: BlueprintNode[] = []

    const savedPositions = new Map<string, { x: number; y: number }>()
    const savedSectionIds = new Map<string, string>()

    if (schema.nodes && schema.nodes.length > 0) {
        for (const nl of schema.nodes) {
            savedPositions.set(nl.id, nl.position)
            if (nl.sectionId) savedSectionIds.set(nl.id, nl.sectionId)
        }
    }

    if (previousGraph) {
        for (const n of previousGraph.nodes) {
            savedPositions.set(n.id, n.position)
            if (n.type === 'item' && (n as BlueprintItemNode).sectionId) {
                savedSectionIds.set(n.id, (n as BlueprintItemNode).sectionId)
            }
        }
    }

    let y = LAYOUT_START_Y
    schema.sections.forEach((sec, secIdx) => {
        const sectionId = sectionIdByIndex(secIdx)
        const position = savedPositions.get(sectionId) ?? { x: LAYOUT_START_X, y }

        nodes.push({
            id: sectionId,
            type: 'section',
            title: sec.title,
            position,
        })
        y += SECTION_HEADER_H + GAP_SECTION_TO_ITEMS
        sec.items.forEach((item, itemIdx) => {
            const itemId = item.id || `${sectionId}_item_${itemIdx}`
            const normalizedItem = { ...item, id: itemId }
            if (normalizedItem.type === 'text' && normalizedItem.buttons) {
                normalizedItem.buttons = normalizedItem.buttons.map((btn, bi) => ({
                    ...btn,
                    id: btn.id || `${itemId}_btn_${bi}`,
                }))
            }
            const itemPosition = savedPositions.get(itemId)
                ?? { x: LAYOUT_START_X + ITEM_INDENT_X, y }
            nodes.push({
                id: itemId,
                type: 'item',
                sectionId,
                item: normalizedItem,
                position: itemPosition,
            })
            y += ITEM_NODE_H + GAP_BETWEEN_ITEMS
        })
        y += GAP_BETWEEN_SECTIONS
    })

    return { nodes }
}

export function blueprintGraphToSchema(graph: BlueprintGraph): AddonSettingsSchema {
    const sectionNodes = graph.nodes.filter((n): n is BlueprintSectionNode => n.type === 'section')
    const itemNodes = graph.nodes.filter((n): n is BlueprintItemNode => n.type === 'item')
    const sectionIds = new Set(sectionNodes.map(s => s.id))

    const sections: AddonSettingsSection[] = sectionNodes.map(sec => {
        const items = itemNodes
            .filter(it => it.sectionId === sec.id && sectionIds.has(it.sectionId))
            .sort((a, b) => (a.item.order ?? 0) - (b.item.order ?? 0))
            .map(it => it.item)
        return { title: sec.title, items }
    })

    const nodeLayouts: AddonSettingsNodeLayout[] = graph.nodes.map(n => {
        const layout: AddonSettingsNodeLayout = {
            id: n.id,
            type: n.type,
            position: n.position,
        }
        if (n.type === 'item' && (n as BlueprintItemNode).sectionId) {
            layout.sectionId = (n as BlueprintItemNode).sectionId
        }
        return layout
    })

    return { sections, nodes: nodeLayouts }
}

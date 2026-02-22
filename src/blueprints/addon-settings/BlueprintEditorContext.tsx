import React, { createContext, useCallback, useContext, useState } from 'react'
import type { BlueprintGraph, BlueprintSectionNode, BlueprintItemNode } from './blueprint-graph'
import { createEmptyItem } from './createDefault'
import type { AddonSettingsItem, AddonSettingsItemType } from './types'
import {
    ITEM_NODE_H,
    GAP_SECTION_TO_ITEMS,
    GAP_BETWEEN_ITEMS,
    ITEM_INDENT_X,
    SECTION_HEADER_H,
} from './constants'

function getSectionNodes(graph: BlueprintGraph): BlueprintSectionNode[] {
    return graph.nodes.filter((n): n is BlueprintSectionNode => n.type === 'section')
}
function getItemNodes(graph: BlueprintGraph): BlueprintItemNode[] {
    return graph.nodes.filter((n): n is BlueprintItemNode => n.type === 'item')
}

export interface ContextMenuItem {
    label: string
    onClick: () => void
    danger?: boolean
}

export interface ConnectionDropPayload {
    sectionId: string
    portX: number
    portY: number
    dropX: number
    dropY: number
}

export interface BlueprintEditorContextValue {
    graph: BlueprintGraph
    onChange: (graph: BlueprintGraph) => void

    contextMenu: { x: number; y: number; items: ContextMenuItem[] } | null
    setContextMenu: (menu: { x: number; y: number; items: ContextMenuItem[] } | null) => void

    updateSectionTitle: (sectionId: string, title: string) => void
    updateItem: (itemNodeId: string, item: AddonSettingsItem) => void
    addSectionAt: (pos: { x: number; y: number }) => void
    addItemToSection: (sectionId: string, type?: AddonSettingsItemType) => void
    createItemAtDrop: (type: AddonSettingsItemType, sectionId: string, pos: { x: number; y: number }) => void
    attachItemToSection: (sectionId: string, itemNodeId: string) => void
    deleteNode: (nodeId: string) => void
    duplicateItem: (itemN: BlueprintItemNode) => void
    detachItem: (itemN: BlueprintItemNode) => void
    detachItemById: (itemNodeId: string) => void
    getSectionNodes: () => BlueprintSectionNode[]
    getItemNodes: () => BlueprintItemNode[]
}

const Ctx = createContext<BlueprintEditorContextValue | null>(null)

export function useBlueprintEditor() {
    const v = useContext(Ctx)
    if (!v) throw new Error('useBlueprintEditor must be used inside BlueprintEditorProvider')
    return v
}

function nextSectionId(graph: BlueprintGraph): string {
    const sectionNodes = graph.nodes.filter(n => n.type === 'section')
    const used = new Set(
        sectionNodes.map(n => {
            const m = n.id.match(/^section_(\d+)$/)
            return m ? parseInt(m[1]!, 10) : -1
        })
    )
    let idx = 0
    while (used.has(idx)) idx++
    return `section_${idx}`
}

export function BlueprintEditorProvider({
    graph,
    onChange,
    children,
}: {
    graph: BlueprintGraph
    onChange: (graph: BlueprintGraph) => void
    children: React.ReactNode
}) {
    const [contextMenu, setContextMenu] = useState<{
        x: number
        y: number
        items: ContextMenuItem[]
    } | null>(null)

    const updateSectionTitle = useCallback(
        (sectionId: string, title: string) => {
            onChange({
                ...graph,
                nodes: graph.nodes.map(n =>
                    n.id === sectionId && n.type === 'section' ? { ...n, title } : n
                ),
            })
        },
        [graph, onChange]
    )

    const updateItem = useCallback(
        (itemNodeId: string, item: AddonSettingsItem) => {
            onChange({
                ...graph,
                nodes: graph.nodes.map(n =>
                    n.id === itemNodeId && n.type === 'item' ? { ...n, item } : n
                ),
            })
        },
        [graph, onChange]
    )

    const addSectionAt = useCallback(
        (pos: { x: number; y: number }) => {
            const id = nextSectionId(graph)
            onChange({
                ...graph,
                nodes: [
                    ...graph.nodes,
                    {
                        id,
                        type: 'section',
                        title: 'New Section',
                        position: { x: pos.x, y: pos.y },
                    } as BlueprintSectionNode,
                ],
            })
            setContextMenu(null)
        },
        [graph, onChange]
    )

    const addItemToSection = useCallback(
        (sectionId: string, type: AddonSettingsItemType = 'button') => {
            const sec = graph.nodes.find(n => n.id === sectionId) as BlueprintSectionNode | undefined
            if (!sec) return
            const newItem = createEmptyItem(type) as AddonSettingsItem
            const itemNodesUnder = getItemNodes(graph).filter(n => n.sectionId === sectionId)
            const lastY =
                itemNodesUnder.length > 0
                    ? Math.max(...itemNodesUnder.map(n => n.position.y)) + ITEM_NODE_H + GAP_BETWEEN_ITEMS
                    : sec.position.y + SECTION_HEADER_H + GAP_SECTION_TO_ITEMS
            onChange({
                ...graph,
                nodes: [
                    ...graph.nodes,
                    {
                        id: newItem.id,
                        type: 'item',
                        sectionId,
                        item: newItem,
                        position: { x: sec.position.x + ITEM_INDENT_X + 60, y: lastY },
                    } as BlueprintItemNode,
                ],
            })
            setContextMenu(null)
        },
        [graph, onChange]
    )

    const createItemAtDrop = useCallback(
        (type: AddonSettingsItemType, sectionId: string, pos: { x: number; y: number }) => {
            const newItem = createEmptyItem(type) as AddonSettingsItem
            onChange({
                ...graph,
                nodes: [
                    ...graph.nodes,
                    {
                        id: newItem.id,
                        type: 'item',
                        sectionId,
                        item: newItem,
                        position: { x: pos.x, y: pos.y },
                    } as BlueprintItemNode,
                ],
            })
            setContextMenu(null)
        },
        [graph, onChange]
    )

    const attachItemToSection = useCallback(
        (sectionId: string, itemNodeId: string) => {
            onChange({
                ...graph,
                nodes: graph.nodes.map(n =>
                    n.id === itemNodeId && n.type === 'item'
                        ? { ...n, sectionId }
                        : n
                ),
            })
            setContextMenu(null)
        },
        [graph, onChange]
    )

    const deleteNode = useCallback(
        (nodeId: string) => {
            const node = graph.nodes.find(n => n.id === nodeId)
            if (!node) return
            if (node.type === 'section') {
                onChange({
                    ...graph,
                    nodes: graph.nodes.filter(
                        n =>
                            n.id !== nodeId &&
                            (n.type !== 'item' || (n as BlueprintItemNode).sectionId !== nodeId)
                    ),
                })
            } else {
                onChange({ ...graph, nodes: graph.nodes.filter(n => n.id !== nodeId) })
            }
            setContextMenu(null)
        },
        [graph, onChange]
    )

    const duplicateItem = useCallback(
        (itemN: BlueprintItemNode) => {
            const newItem = { ...itemN.item, id: `item_${Date.now()}` }
            const pos = { x: itemN.position.x + 30, y: itemN.position.y + 40 }
            onChange({
                ...graph,
                nodes: [
                    ...graph.nodes,
                    {
                        id: newItem.id,
                        type: 'item',
                        sectionId: itemN.sectionId,
                        item: newItem,
                        position: pos,
                    } as BlueprintItemNode,
                ],
            })
            setContextMenu(null)
        },
        [graph, onChange]
    )

    const detachItem = useCallback(
        (itemN: BlueprintItemNode) => {
            onChange({
                ...graph,
                nodes: graph.nodes.map(n =>
                    n.id === itemN.id && n.type === 'item' ? { ...n, sectionId: '' } : n
                ),
            })
            setContextMenu(null)
        },
        [graph, onChange]
    )

    const detachItemById = useCallback(
        (itemNodeId: string) => {
            onChange({
                ...graph,
                nodes: graph.nodes.map(n =>
                    n.id === itemNodeId && n.type === 'item' ? { ...n, sectionId: '' } : n
                ),
            })
        },
        [graph, onChange]
    )

    const value: BlueprintEditorContextValue = {
        graph,
        onChange,
        contextMenu,
        setContextMenu,
        updateSectionTitle,
        updateItem,
        addSectionAt,
        addItemToSection,
        createItemAtDrop,
        attachItemToSection,
        deleteNode,
        duplicateItem,
        detachItem,
        detachItemById,
        getSectionNodes: () => getSectionNodes(graph),
        getItemNodes: () => getItemNodes(graph),
    }

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

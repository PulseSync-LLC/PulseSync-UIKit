import React, { useCallback, useEffect, useRef } from 'react'
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    useReactFlow,
    BackgroundVariant,
    SelectionMode,
    type Node,
    type Edge,
    type OnConnect,
    type OnEdgesDelete,
    type NodeTypes,
    type Connection,
    ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import { Button } from '../../components/Button'
import { BlueprintEditorProvider, useBlueprintEditor } from './BlueprintEditorContext'
import { BlueprintContextMenu } from './BlueprintContextMenu'
import { SectionNode } from './SectionNode'
import { ItemNode } from './ItemNode'
import type { BlueprintGraph, BlueprintItemNode, BlueprintSectionNode } from './blueprint-graph'
import type { AddonSettingsItemType } from './types'
import styles from './visual-blueprint-editor.module.scss'

export interface VisualBlueprintEditorProps {
    graph: BlueprintGraph
    onChange: (graph: BlueprintGraph) => void
    className?: string
}

const nodeTypes: NodeTypes = {
    section: SectionNode as any,
    item: ItemNode as any,
}

const ALL_ITEM_TYPES: { label: string; type: AddonSettingsItemType }[] = [
    { label: 'Text', type: 'text' },
    { label: 'Toggle', type: 'button' },
    { label: 'Slider', type: 'slider' },
    { label: 'File Picker', type: 'file_picker' },
    { label: 'Color Picker', type: 'color_picker' },
    { label: 'Select', type: 'select' },
]

function graphToFlowNodes(graph: BlueprintGraph): Node[] {
    const itemNodes = graph.nodes.filter((n): n is BlueprintItemNode => n.type === 'item')
    const itemCountBySection = new Map<string, number>()
    for (const it of itemNodes) {
        if (it.sectionId) {
            itemCountBySection.set(it.sectionId, (itemCountBySection.get(it.sectionId) ?? 0) + 1)
        }
    }

    return graph.nodes.map(node => {
        if (node.type === 'section') {
            return {
                id: node.id,
                type: 'section',
                position: node.position,
                data: {
                    title: (node as BlueprintSectionNode).title,
                    itemsCount: itemCountBySection.get(node.id) ?? 0,
                },
            }
        }
        const itemNode = node as BlueprintItemNode
        return {
            id: node.id,
            type: 'item',
            position: node.position,
            data: {
                sectionId: itemNode.sectionId,
                item: itemNode.item,
            },
        }
    })
}

function graphToFlowEdges(graph: BlueprintGraph): Edge[] {
    const itemNodes = graph.nodes.filter((n): n is BlueprintItemNode => n.type === 'item')
    return itemNodes
        .filter(n => n.sectionId)
        .map(n => ({
            id: `edge-${n.sectionId}-${n.id}`,
            source: n.sectionId,
            target: n.id,
            sourceHandle: 'exec-out',
            targetHandle: 'exec-in',
            type: 'default',
            style: { stroke: 'var(--ps-border, #444)', strokeWidth: 2 },
            animated: false,
        }))
}

function VisualBlueprintEditorInner({ className }: { className?: string }) {
    const {
        graph,
        onChange,
        contextMenu,
        setContextMenu,
        addSectionAt,
        createItemAtDrop,
        attachItemToSection,
        detachItemById,
        getSectionNodes,
    } = useBlueprintEditor()

    const { screenToFlowPosition } = useReactFlow()
    const selfUpdate = useRef(false)
    const connectStartRef = useRef<{ nodeId: string; handleId: string | null } | null>(null)

    const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(graphToFlowNodes(graph))
    const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(graphToFlowEdges(graph))

    useEffect(() => {
        if (selfUpdate.current) {
            selfUpdate.current = false
            return
        }
        setFlowNodes(graphToFlowNodes(graph))
        setFlowEdges(graphToFlowEdges(graph))
    }, [graph, setFlowNodes, setFlowEdges])

    const onNodeDragStop = useCallback(
        (_event: React.MouseEvent, _node: Node, allNodes: Node[]) => {
            selfUpdate.current = true
            const posMap = new Map(allNodes.map(n => [n.id, n.position]))
            onChange({
                ...graph,
                nodes: graph.nodes.map(n => {
                    const pos = posMap.get(n.id)
                    return pos ? { ...n, position: pos } : n
                }),
            })
        },
        [graph, onChange]
    )

    const onConnect: OnConnect = useCallback(
        (connection: Connection) => {
            if (connection.source && connection.target) {
                attachItemToSection(connection.source, connection.target)
            }
        },
        [attachItemToSection]
    )

    const onConnectStart = useCallback(
        (_: any, params: { nodeId: string | null; handleId: string | null }) => {
            if (params.nodeId) {
                connectStartRef.current = { nodeId: params.nodeId, handleId: params.handleId }
            }
        },
        []
    )

    const onConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent) => {
            const start = connectStartRef.current
            connectStartRef.current = null
            if (!start) return

            const sourceNode = graph.nodes.find(n => n.id === start.nodeId)
            if (!sourceNode || sourceNode.type !== 'section') return

            const target = (event as MouseEvent).target as HTMLElement
            if (target.closest('.react-flow__node')) return

            const clientX = 'clientX' in event ? event.clientX : (event as TouchEvent).touches[0]?.clientX ?? 0
            const clientY = 'clientY' in event ? event.clientY : (event as TouchEvent).touches[0]?.clientY ?? 0
            const flowPos = screenToFlowPosition({ x: clientX, y: clientY })

            setContextMenu({
                x: clientX,
                y: clientY,
                items: ALL_ITEM_TYPES.map(t => ({
                    label: `Create ${t.label}`,
                    onClick: () => createItemAtDrop(t.type, start.nodeId, flowPos),
                })),
            })
        },
        [graph, screenToFlowPosition, setContextMenu, createItemAtDrop]
    )

    const onEdgesDelete: OnEdgesDelete = useCallback(
        (deletedEdges: Edge[]) => {
            for (const edge of deletedEdges) {
                detachItemById(edge.target)
            }
        },
        [detachItemById]
    )

    const onPaneContextMenu = useCallback(
        (event: React.MouseEvent | MouseEvent) => {
            event.preventDefault()
            const e = event as MouseEvent
            const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
            setContextMenu({
                x: e.clientX,
                y: e.clientY,
                items: [
                    { label: 'Add Section', onClick: () => addSectionAt(flowPos) },
                ],
            })
        },
        [addSectionAt, setContextMenu, screenToFlowPosition]
    )

    const addSection = () => {
        const sections = getSectionNodes()
        const n = sections.length
        addSectionAt({ x: 200, y: 100 + n * 200 })
    }

    return (
        <div className={clsx(styles.wrapper, className)}>
            <div className={styles.toolbar}>
                <Button variant="primary" size="sm" onClick={addSection}>
                    + Section
                </Button>
                <span className={styles.zoomLabel}>Blueprint Editor</span>
            </div>

            <div className={styles.flowContainer}>
                <ReactFlow
                    nodes={flowNodes}
                    edges={flowEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeDragStop={onNodeDragStop}
                    onConnect={onConnect}
                    onConnectStart={onConnectStart}
                    onConnectEnd={onConnectEnd}
                    onEdgesDelete={onEdgesDelete}
                    onPaneContextMenu={onPaneContextMenu}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    snapToGrid
                    snapGrid={[20, 20]}
                    nodeDragThreshold={5}
                    selectionOnDrag
                    selectionMode={SelectionMode.Partial}
                    panOnDrag={[2]}
                    panOnScroll={false}
                    zoomOnScroll
                    defaultEdgeOptions={{
                        type: 'default',
                        style: { stroke: 'var(--ps-border, #444)', strokeWidth: 2 },
                    }}
                    proOptions={{ hideAttribution: true }}
                    connectionLineStyle={{ stroke: 'var(--ps-accent, #66e3ff)', strokeWidth: 2, strokeDasharray: '8 4' }}
                    minZoom={0.15}
                    maxZoom={2}
                    deleteKeyCode={['Backspace', 'Delete']}
                    multiSelectionKeyCode="Shift"
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={20}
                        size={1}
                        color="rgba(255,255,255,0.04)"
                    />
                    <Controls
                        showInteractive={false}
                        position="bottom-left"
                    />
                </ReactFlow>
            </div>

            {contextMenu &&
                createPortal(
                    <BlueprintContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        items={contextMenu.items}
                        onClose={() => setContextMenu(null)}
                    />,
                    document.body
                )}
        </div>
    )
}

export function VisualBlueprintEditor({
    graph,
    onChange,
    className,
}: VisualBlueprintEditorProps) {
    return (
        <ReactFlowProvider>
            <BlueprintEditorProvider graph={graph} onChange={onChange}>
                <VisualBlueprintEditorInner className={className} />
            </BlueprintEditorProvider>
        </ReactFlowProvider>
    )
}

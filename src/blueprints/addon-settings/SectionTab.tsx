/**
 * @deprecated Use VisualBlueprintEditor which now uses ReactFlow internally.
 * SectionTab was part of the old custom canvas implementation.
 */
import React from 'react'
import type { BlueprintSectionNode } from './blueprint-graph'

export interface SectionTabProps {
    node: BlueprintSectionNode
    index: number
    isActive: boolean
}

export function SectionTab(_props: SectionTabProps) {
    return null
}

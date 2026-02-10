import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { Tooltip } from '../Tooltip'
import styles from './textinput.module.scss'

/* ── Types ── */

export interface TextInputCommand {
    /** Template key inserted into the text, e.g. "{track}" */
    key: string
    /** Human-readable label */
    label: string
}

export interface TextInputProps {
    /** Field name / id */
    name: string
    /** Label above the input */
    label?: string
    /** Optional description shown in a tooltip on "?" icon */
    description?: string
    /** Placeholder when empty */
    placeholder?: string
    /** Controlled value */
    value: string
    /** Called on text change */
    onChange?: (value: string) => void
    /** Called when input loses focus */
    onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void
    /** Show command insertion button */
    showCommandsButton?: boolean
    /** Available commands */
    commands?: TextInputCommand[]
    /** Custom commands button content (default: keyboard icon) */
    commandsButtonContent?: React.ReactNode
    /** Hint text below the field */
    hint?: string
    /** Error message (replaces hint) */
    error?: string
    /** Whether the field has been touched (for showing errors) */
    touched?: boolean
    /** Default value — shows reset when differs */
    defaultValue?: string
    /** Custom reset text */
    resetText?: string
    /** Disable interaction */
    disabled?: boolean
    /** Additional className */
    className?: string
    /** aria-label */
    ariaLabel?: string
}

/* ── Helpers ── */

function getTextNodes(root: Node): Text[] {
    const out: Text[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: node =>
            node.textContent && node.textContent.length >= 0
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT,
    })
    let n = walker.nextNode()
    while (n) { out.push(n as Text); n = walker.nextNode() }
    return out
}

function restoreSelectionByOffsets(root: HTMLElement, start: number, end: number) {
    const textNodes = getTextNodes(root)
    const totalLen = textNodes.reduce((acc, t) => acc + (t.textContent?.length ?? 0), 0)

    const s = Math.max(0, Math.min(start, totalLen))
    const e = Math.max(0, Math.min(end, totalLen))

    let startNode: Text | HTMLElement = root, startOff = 0
    let endNode: Text | HTMLElement = root, endOff = 0
    let acc = 0

    for (const tn of textNodes) {
        const len = tn.textContent?.length ?? 0
        const next = acc + len
        if (s >= acc && s <= next) { startNode = tn; startOff = s - acc }
        if (e >= acc && e <= next) { endNode = tn; endOff = e - acc }
        acc = next
    }

    const range = document.createRange()
    try {
        if (textNodes.length === 0) {
            range.selectNodeContents(root); range.collapse(false)
        } else {
            range.setStart(startNode, startOff); range.setEnd(endNode, endOff)
        }
        const sel = window.getSelection()
        sel?.removeAllRanges(); sel?.addRange(range)
    } catch {
        range.selectNodeContents(root); range.collapse(false)
        const sel = window.getSelection()
        sel?.removeAllRanges(); sel?.addRange(range)
    }
}

function KeyboardIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
            <line x1="6" y1="8" x2="6" y2="8" /><line x1="10" y1="8" x2="10" y2="8" />
            <line x1="14" y1="8" x2="14" y2="8" /><line x1="18" y1="8" x2="18" y2="8" />
            <line x1="6" y1="12" x2="6" y2="12" /><line x1="10" y1="12" x2="10" y2="12" />
            <line x1="14" y1="12" x2="14" y2="12" /><line x1="18" y1="12" x2="18" y2="12" />
            <line x1="8" y1="16" x2="16" y2="16" />
        </svg>
    )
}

/* ── Component ── */

export function TextInput({
    name,
    label,
    description,
    placeholder,
    value,
    onChange,
    onBlur,
    showCommandsButton = false,
    commands = [],
    commandsButtonContent,
    hint,
    error,
    touched,
    defaultValue: resetValue,
    resetText = 'Reset',
    disabled,
    className,
    ariaLabel,
}: TextInputProps) {
    const [isFocused, setIsFocused] = useState(false)
    const [cmdOpen, setCmdOpen] = useState(false)
    const [cmdClosing, setCmdClosing] = useState(false)
    const editorRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const fieldRef = useRef<HTMLDivElement>(null)
    const cmdPanelRef = useRef<HTMLDivElement>(null)
    const placeholderRef = useRef<HTMLSpanElement>(null)
    const lastValueRef = useRef(value)
    const selectionRef = useRef<{ start: number; end: number } | null>(null)
    const [mounted, setMounted] = useState(false)
    const [cmdPanelStyle, setCmdPanelStyle] = useState<React.CSSProperties>({})

    useEffect(() => setMounted(true), [])

    const showCmdPanel = cmdOpen || cmdClosing
    const showError = touched && error
    const canReset = resetValue !== undefined && value !== resetValue

    /** Immediately sync placeholder visibility via DOM (no React batching delay) */
    const syncPlaceholder = useCallback((text: string) => {
        if (placeholderRef.current) {
            placeholderRef.current.style.display = text ? 'none' : ''
        }
    }, [])

    const closeCmdPanel = useCallback(() => {
        if (!cmdOpen) return
        setCmdClosing(true)
    }, [cmdOpen])

    const handleCmdAnimEnd = useCallback(() => {
        if (cmdClosing) {
            setCmdClosing(false)
            setCmdOpen(false)
        }
    }, [cmdClosing])

    /* ── Selection management ── */

    const saveSelection = useCallback(() => {
        const root = editorRef.current
        const sel = window.getSelection()
        if (!root || !sel || sel.rangeCount === 0) return
        const range = sel.getRangeAt(0)
        const pre = range.cloneRange()
        pre.selectNodeContents(root)
        pre.setEnd(range.startContainer, range.startOffset)
        const start = pre.toString().length
        selectionRef.current = { start, end: start + range.toString().length }
    }, [])

    const setCursorToEnd = useCallback(() => {
        const el = editorRef.current
        if (!el) return
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(el)
        range.collapse(false)
        sel?.removeAllRanges()
        sel?.addRange(range)
    }, [])

    /* ── Sync external value → DOM ── */

    useLayoutEffect(() => {
        const el = editorRef.current
        if (!el) return
        const domText = (el.textContent || '').replace(/\u200B/g, '')
        if (domText !== value) {
            if (value) el.textContent = value
            else el.innerHTML = '<br>'
        }
        lastValueRef.current = value
        /* Keep placeholder in sync with value prop */
        syncPlaceholder(value)
        const hasFocus = document.activeElement === el
        if (hasFocus) {
            if (selectionRef.current) {
                restoreSelectionByOffsets(el, selectionRef.current.start, selectionRef.current.end)
            } else {
                setCursorToEnd()
            }
        }
    }, [value, setCursorToEnd, syncPlaceholder])

    /* ── Input handling ── */

    const handleInput = () => {
        const root = editorRef.current
        if (!root) return
        const newValue = root.textContent?.replace(/\u200B/g, '') || ''

        /* Immediately hide/show placeholder — no waiting for React */
        syncPlaceholder(newValue)

        /* Ensure empty editor always has <br> for cursor positioning */
        if (newValue === '' && root.innerHTML !== '<br>') {
            root.innerHTML = '<br>'
        }

        if (newValue !== lastValueRef.current) {
            saveSelection()
            lastValueRef.current = newValue
            onChange?.(newValue)
        }
    }

    const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!editorRef.current) return
        editorRef.current.focus()
        if (!editorRef.current.contains(e.target as Node)) setCursorToEnd()
    }

    /* ── Command insertion ── */

    const insertCommand = (cmd: string) => {
        const el = editorRef.current
        if (!el) return

        /* If editor is "empty" (only <br>), clear it before insertion */
        const currentText = (el.textContent || '').replace(/\u200B/g, '')
        if (!currentText) {
            el.textContent = ''
        }

        el.focus()
        const sel = window.getSelection()
        if (!sel || sel.rangeCount === 0) {
            /* No selection — place cursor at end */
            const range = document.createRange()
            range.selectNodeContents(el)
            range.collapse(false)
            sel?.removeAllRanges()
            sel?.addRange(range)
        }
        const range = sel!.getRangeAt(0)
        range.deleteContents()
        const text = document.createTextNode(cmd)
        range.insertNode(text)
        range.setStartAfter(text)
        range.setEndAfter(text)
        sel!.removeAllRanges()
        sel!.addRange(range)
        handleInput()
        saveSelection()
        closeCmdPanel()
    }

    const updateCmdPanelPosition = useCallback(() => {
        const el = fieldRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        setCmdPanelStyle({
            position: 'fixed',
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
            zIndex: 10050,
        })
    }, [])

    useEffect(() => {
        if (!cmdOpen) return
        updateCmdPanelPosition()
        window.addEventListener('scroll', updateCmdPanelPosition, true)
        window.addEventListener('resize', updateCmdPanelPosition)
        return () => {
            window.removeEventListener('scroll', updateCmdPanelPosition, true)
            window.removeEventListener('resize', updateCmdPanelPosition)
        }
    }, [cmdOpen, updateCmdPanelPosition])

    /* Close commands on outside click — panel may be in portal */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (containerRef.current?.contains(target) || cmdPanelRef.current?.contains(target)) return
            closeCmdPanel()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div
            ref={containerRef}
            className={clsx(styles.wrapper, showError && styles.hasError, disabled && styles.disabled, className)}
        >
            {(label || canReset) && (
                <div className={styles.labelRow}>
                    {label && (
                        <div className={styles.label}>
                            {label}
                            {description && (
                                <Tooltip content={description} position="right">
                                    <span className={styles.descDot}>?</span>
                                </Tooltip>
                            )}
                        </div>
                    )}
                    {canReset && (
                        <button type="button" className={styles.resetBtn} onClick={() => onChange?.(resetValue!)}>
                            {resetText}
                        </button>
                    )}
                </div>
            )}

            <div ref={fieldRef} className={styles.field} onClick={handleFieldClick} style={{ position: 'relative' }}>
                <div className={styles.editorWrap}>
                    {placeholder && (
                        <span
                            ref={placeholderRef}
                            className={styles.placeholder}
                            style={value ? { display: 'none' } : undefined}
                        >
                            {placeholder}
                        </span>
                    )}
                    <div
                        ref={editorRef}
                        id={name}
                        role="textbox"
                        contentEditable={!disabled}
                        suppressContentEditableWarning
                        className={styles.editor}
                        spellCheck="true"
                        aria-label={ariaLabel}
                        aria-multiline="true"
                        aria-invalid={Boolean(showError)}
                        aria-errormessage={showError ? `${name}-error` : undefined}
                        onInput={handleInput}
                        onFocus={() => { setIsFocused(true); saveSelection() }}
                        onKeyUp={saveSelection}
                        onMouseUp={saveSelection}
                        onBlur={e => { setIsFocused(false); onBlur?.(e) }}
                    />
                </div>

                {showCommandsButton && commands.length > 0 && (
                    <button
                        type="button"
                        className={clsx(styles.cmdBtn, cmdOpen && styles.cmdBtnActive)}
                        onClick={e => {
                            e.stopPropagation()
                            if (cmdOpen) closeCmdPanel()
                            else setCmdOpen(true)
                        }}
                    >
                        {commandsButtonContent ?? <KeyboardIcon />}
                    </button>
                )}

                {mounted && showCmdPanel && commands.length > 0 && createPortal(
                    <div
                        ref={cmdPanelRef}
                        className={clsx(styles.cmdPanel, cmdClosing && styles.cmdPanelClosing)}
                        style={cmdPanelStyle}
                        onAnimationEnd={handleCmdAnimEnd}
                    >
                        {commands.map(cmd => (
                            <button
                                key={cmd.key}
                                type="button"
                                className={styles.cmdItem}
                                onClick={() => insertCommand(cmd.key)}
                            >
                                <span className={styles.cmdKey}>{cmd.key}</span>
                                <span className={styles.cmdSep}>—</span>
                                <span className={styles.cmdLabel}>{cmd.label}</span>
                            </button>
                        ))}
                    </div>,
                    document.body,
                )}
            </div>

            {showError && (
                <div id={`${name}-error`} className={styles.error}>{error}</div>
            )}
            {!showError && hint && (
                <div className={styles.hint}>{hint}</div>
            )}
        </div>
    )
}

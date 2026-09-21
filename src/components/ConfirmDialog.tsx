/**
 * ConfirmDialog — modal confirmation dialog.
 * Uses role="dialog", aria-modal, Escape to close, returns focus on close.
 */

import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  confirmDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmDestructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const prevFocusRef = useRef<HTMLElement | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement
      // Focus the dialog for keyboard trap
      setTimeout(() => dialogRef.current?.focus(), 50)
    } else if (prevFocusRef.current) {
      prevFocusRef.current.focus()
      prevFocusRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl p-6 outline-none"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <h3 className="text-lg font-semibold mb-1" style={{ color: '#1D1D1F' }}>
          {title}
        </h3>
        {description && (
          <p className="text-sm mb-5" style={{ color: '#6E6E73' }}>
            {description}
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 h-10 rounded-xl text-sm font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: 'rgba(0,0,0,0.04)',
              color: '#1D1D1F',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 h-10 rounded-xl text-sm font-medium text-white cursor-pointer transition-colors"
            style={{
              backgroundColor: confirmDestructive ? '#FF3B30' : '#007AFF',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

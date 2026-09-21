/**
 * UndoToast — shows "Deleted · Undo" for 6 seconds after a destructive action.
 */

interface UndoToastProps {
  visible: boolean
  onUndo: () => void
  message?: string
}

export function UndoToast({ visible, onUndo, message = 'Deleted' }: UndoToastProps) {
  if (!visible) return null

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 h-12 rounded-2xl"
      style={{
        backgroundColor: '#1D1D1F',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      <span className="text-sm text-white font-medium">{message}</span>
      <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
      <button
        onClick={onUndo}
        className="text-sm font-semibold cursor-pointer"
        style={{ color: '#007AFF' }}
      >
        Undo
      </button>
    </div>
  )
}

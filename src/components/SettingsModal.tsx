import { useBudget, P } from '../store'
import { useState, useEffect } from 'react'

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { settings, updateSettings } = useBudget()
  const [name, setName] = useState(settings.displayName)

  // Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSave() {
    if (name.trim()) {
      updateSettings({ displayName: name.trim() })
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
      padding: 24,
    }}>
      <div style={{
        background: P.card,
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 24px 48px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: P.ink, margin: 0, marginBottom: 4 }}>Settings</h2>
          <p style={{ fontSize: 14, color: P.tertiary, margin: 0 }}>Customize your profile.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: P.secondary }}>Display Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{
              padding: '12px 16px',
              fontSize: 16,
              background: 'rgba(0,0,0,0.035)',
              border: 'none',
              borderRadius: 12,
              outline: 'none',
              color: P.ink,
              fontWeight: 500,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '12px',
              background: P.blue.solid,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(0,0,0,0.05)',
              color: P.secondary,
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

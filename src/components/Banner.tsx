/**
 * Banner — dismissible notice banner and persistent error banner.
 */

interface BannerProps {
  notice: string | null
  persistError: string | null
  onDismissNotice: () => void
}

export function Banner({ notice, persistError, onDismissNotice }: BannerProps) {
  if (!notice && !persistError) return null

  return (
    <div className="max-w-5xl mx-auto px-6">
      {persistError && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl mb-3 text-sm"
          style={{
            backgroundColor: '#FFF0EF',
            color: '#FF3B30',
            border: '1px solid rgba(255,59,48,0.15)',
          }}
        >
          <span>{persistError}</span>
        </div>
      )}
      {notice && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl mb-3 text-sm"
          style={{
            backgroundColor: '#EBF4FF',
            color: '#007AFF',
            border: '1px solid rgba(0,122,255,0.15)',
          }}
        >
          <span>{notice}</span>
          <button
            onClick={onDismissNotice}
            className="ml-3 text-xs font-medium cursor-pointer"
            style={{ color: '#007AFF' }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

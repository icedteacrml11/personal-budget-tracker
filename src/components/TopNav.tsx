/**
 * TopNav — sticky frosted-glass navigation bar.
 * Avatar with initials, tab buttons, responsive.
 */

export type TabId = 'home' | 'wallet' | 'expenses' | 'people'

interface TopNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  displayName: string
  onSettingsClick: () => void
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'people', label: 'People' },
]

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 0 || words[0] === '') return '?'
  if (words.length === 1) return words[0]![0]!.toUpperCase()
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase()
}

export function TopNav({ activeTab, onTabChange, displayName, onSettingsClick }: TopNavProps) {
  const initials = getInitials(displayName)

  return (
    <nav
      className="sticky top-0 z-40 safe-top"
      style={{
        backgroundColor: 'rgba(245,245,247,0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Left: Avatar + Name */}
        <button
          onClick={onSettingsClick}
          className="flex items-center gap-3 cursor-pointer"
          aria-label="Open settings"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
            style={{ backgroundColor: '#007AFF' }}
          >
            {initials}
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium leading-tight" style={{ color: '#1D1D1F' }}>
              {displayName}
            </span>
            <span className="text-[11px] leading-tight" style={{ color: '#AEAEB2' }}>
              Personal budget
            </span>
          </div>
        </button>

        {/* Right: Tabs */}
        <div className="flex items-center gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                activeTab === tab.id ? 'font-medium' : ''
              }`}
              style={{
                color: activeTab === tab.id ? '#1D1D1F' : '#8E8E93',
                backgroundColor: activeTab === tab.id ? 'rgba(0,0,0,0.07)' : 'transparent',
                fontWeight: activeTab === tab.id ? 500 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

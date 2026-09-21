/**
 * AddButton — circular blue "+" that rotates to "×" when open.
 * Respects prefers-reduced-motion.
 */

interface AddButtonProps {
  isOpen: boolean
  onClick: () => void
  label?: string
}

export function AddButton({ isOpen, onClick, label = 'Add' }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Close' : label}
      className="flex items-center justify-center w-11 h-11 rounded-full text-white text-2xl font-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 shrink-0 cursor-pointer"
      style={{
        backgroundColor: '#007AFF',
        transition: 'transform 200ms ease, background-color 150ms ease',
        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 3V19M3 11H19" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </button>
  )
}

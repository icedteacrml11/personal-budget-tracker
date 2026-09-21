/**
 * Money — renders a currency value in DM Mono.
 * Uses − (U+2212) for negatives, optional + for signed mode.
 */

import { useMoney } from '../store'

interface MoneyProps {
  cents: number
  signed?: boolean
  short?: boolean
  className?: string
  style?: React.CSSProperties
}

export function Money({ cents, signed, short, className = '', style }: MoneyProps) {
  const { fmt, fmtShort } = useMoney()

  let text = short ? fmtShort(cents) : fmt(cents)

  // Add + sign for positive amounts in signed mode
  if (signed && cents > 0) {
    text = `+${text}`
  }

  return (
    <span
      className={className}
      style={{
        fontFamily: "'DM Mono', monospace",
        ...style,
      }}
    >
      {text}
    </span>
  )
}

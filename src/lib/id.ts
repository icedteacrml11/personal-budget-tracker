/**
 * Generate a unique string ID.
 * Uses crypto.randomUUID() with a fallback for non-secure contexts
 * (e.g. testing over a LAN http:// URL).
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // Falls through to fallback
    }
  }
  // Fallback: generate a UUID v4-like string from Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

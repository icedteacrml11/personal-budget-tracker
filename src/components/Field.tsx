/**
 * Field — label + input wrapper with styled input,
 * inline error, and aria-invalid.
 */

import { type InputHTMLAttributes, type ReactNode, useId } from 'react'

interface FieldProps {
  label: string
  error?: string
  children?: ReactNode
  inputProps?: InputHTMLAttributes<HTMLInputElement>
  select?: boolean
  selectProps?: React.SelectHTMLAttributes<HTMLSelectElement>
  selectChildren?: ReactNode
}

export function Field({ label, error, children, inputProps, select, selectProps, selectChildren }: FieldProps) {
  const id = useId()

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: '#6E6E73' }}
      >
        {label}
      </label>
      {children ? (
        children
      ) : select ? (
        <select
          id={id}
          {...selectProps}
          className={`h-11 px-3 rounded-xl text-sm font-normal outline-none transition-colors ${selectProps?.className ?? ''}`}
          style={{
            backgroundColor: 'rgba(0,0,0,0.04)',
            border: '1.5px solid transparent',
            color: '#1D1D1F',
            ...selectProps?.style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#007AFF'
            selectProps?.onFocus?.(e)
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'transparent'
            selectProps?.onBlur?.(e)
          }}
        >
          {selectChildren}
        </select>
      ) : (
        <input
          id={id}
          {...inputProps}
          aria-invalid={!!error}
          className={`h-11 px-3 rounded-xl text-sm font-normal outline-none transition-colors ${inputProps?.className ?? ''}`}
          style={{
            backgroundColor: 'rgba(0,0,0,0.04)',
            border: error ? '1.5px solid #FF3B30' : '1.5px solid transparent',
            color: '#1D1D1F',
            ...inputProps?.style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#007AFF'
            inputProps?.onFocus?.(e)
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? '#FF3B30' : 'transparent'
            inputProps?.onBlur?.(e)
          }}
        />
      )}
      {error && (
        <p className="text-xs" style={{ color: '#FF3B30' }}>
          {error}
        </p>
      )}
    </div>
  )
}

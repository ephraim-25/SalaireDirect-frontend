import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Aide affichée sous le champ (reliée au champ via aria-describedby). */
  hint?: string
  icon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, required, ...props }, ref) => {
    const autoId = useId()
    const inputId = id ?? autoId
    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-800">
            {label}
            {required && (
              <span className="ml-0.5 text-red-700" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              'min-h-11 w-full rounded-lg border border-gray-400 bg-white px-4 py-2.5 text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-1',
              'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600',
              'placeholder:text-gray-500',
              icon && 'pl-10',
              error && 'border-red-700 focus:ring-red-700',
              className
            )}
            {...props}
          />
        </div>
        {hint && !error && (
          <p id={hintId} className="mt-1 text-xs text-gray-600">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

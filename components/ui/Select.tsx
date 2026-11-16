import { SelectHTMLAttributes, forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, id, required, ...props }, ref) => {
    const autoId = useId()
    const selectId = id ?? autoId
    const errorId = error ? `${selectId}-error` : undefined

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-gray-800">
            {label}
            {required && (
              <span className="ml-0.5 text-red-700" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={cn(
              'min-h-11 w-full appearance-none rounded-lg border border-gray-400 bg-white py-2.5 pl-4 pr-10 text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-1',
              'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600',
              error && 'border-red-700 focus:ring-red-700',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select

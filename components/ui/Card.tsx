import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, title, subtitle, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm', className)}
      {...props}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export default Card

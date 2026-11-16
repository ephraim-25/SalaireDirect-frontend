import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  /** Affiche un indicateur de chargement et désactive le bouton. */
  loading?: boolean
}

type Variant = NonNullable<ButtonProps['variant']>
type Size = NonNullable<ButtonProps['size']>

/** Classes partagées entre <Button> et les liens présentés comme des boutons. */
export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-60',
    {
      'bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-700': variant === 'primary',
      'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-600': variant === 'secondary',
      'border border-gray-400 bg-white text-gray-900 hover:bg-gray-100 focus-visible:ring-gray-600': variant === 'outline',
      'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700': variant === 'danger',
    },
    {
      // Cibles tactiles : 44 px en taille normale (recommandation WCAG 2.5.5 / mobile).
      'min-h-9 px-3 text-sm': size === 'sm',
      'min-h-11 px-4 text-base': size === 'md',
      'min-h-12 px-6 text-lg': size === 'lg',
    },
    className
  )
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClasses(variant, size, className)}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button

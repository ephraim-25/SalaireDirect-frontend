import Link from 'next/link'
import { ComponentProps } from 'react'
import { buttonClasses } from '@/components/ui/Button'

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

/** Lien de navigation présenté comme un bouton (un lien reste un <a>, pas un <button>). */
export default function ButtonLink({ variant = 'primary', size = 'md', className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />
}

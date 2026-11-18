import { ReactNode } from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

interface AuthShellProps {
  title: string
  subtitle: string
  icon: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/** Mise en page commune aux pages de connexion, d'inscription et de réinitialisation. */
export default function AuthShell({ title, subtitle, icon, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 text-gray-900">
      <main id="contenu" className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-8 text-center">
            <div
              className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-white"
              aria-hidden="true"
            >
              {icon}
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">SalaireDirect</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-gray-700">{subtitle}</p>
          </div>

          {children}

          {footer && <div className="mt-6 text-center text-sm text-gray-700">{footer}</div>}
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-gray-700">
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Connexion chiffrée (HTTPS)
          </p>
          <p>
            <Link href="/legal/confidentialite" className="underline hover:text-gray-900">
              Confidentialité
            </Link>
            {' · '}
            <Link href="/legal/cgu" className="underline hover:text-gray-900">
              Conditions d&apos;utilisation
            </Link>
            {' · '}
            <Link href="/legal/mentions-legales" className="underline hover:text-gray-900">
              Mentions légales
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

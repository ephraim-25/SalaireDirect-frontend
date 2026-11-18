'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Calculator, CalendarDays, Clock, Gift, LayoutDashboard, Loader2, LogOut, Menu, Users, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Employés', href: '/employees', icon: Users },
  { name: 'Variables du mois', href: '/variables', icon: CalendarDays },
  { name: 'Calcul de la paie', href: '/calculation', icon: Calculator },
  { name: 'Historique', href: '/history', icon: Clock },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { user, signOut, trialDaysRemaining } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <Link href="/dashboard" onClick={onNavigate} className="text-2xl font-bold text-gray-900">
          SalaireDirect
        </Link>
      </div>

      <nav aria-label="Navigation principale" className="flex-1 space-y-1 px-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-lg px-4 py-2.5 font-medium transition-colors',
                active ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-gray-200 p-4">
        {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
          <p className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-900">
            <Gift className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            Essai gratuit : {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''} restant
            {trialDaysRemaining > 1 ? 's' : ''}
          </p>
        )}
        {user?.email && (
          <p className="truncate px-1 text-xs text-gray-600" title={user.email}>
            {user.email}
          </p>
        )}
        <Button variant="outline" className="w-full" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Déconnexion
        </Button>
      </div>
    </div>
  )
}

/**
 * Coque commune des pages connectées : navigation, lien d'évitement, repère <main>
 * et vérification de la session côté client.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [loading, user, router, pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  if (loading || !user) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-700">
        <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden="true" />
        Chargement de votre espace…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <a
        href="#contenu"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 font-medium text-blue-800 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu principal
      </a>

      {/* Barre mobile */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 lg:hidden">
        <span className="text-lg font-bold text-gray-900">SalaireDirect</span>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        >
          {menuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </header>

      {/* Menu mobile (rendu uniquement lorsqu'il est ouvert) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <aside id="menu-mobile" className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:flex">
        {/* Barre latérale bureau */}
        <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white lg:sticky lg:top-0 lg:block lg:h-screen">
          <SidebarContent />
        </aside>

        <main id="contenu" tabIndex={-1} className="min-w-0 flex-1 p-4 focus:outline-none sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

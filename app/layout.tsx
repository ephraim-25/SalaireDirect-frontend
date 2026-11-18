import type { Metadata, Viewport } from 'next'
// Police auto-hébergée (aucune requête vers Google Fonts : conforme RGPD, plus rapide).
import '@fontsource-variable/inter'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: {
    default: 'SalaireDirect — Gestion de paie automatisée',
    template: '%s · SalaireDirect',
  },
  description: 'Solution SaaS de gestion de la paie pour les PME, écoles et ONG en RD Congo.',
  applicationName: 'SalaireDirect',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1d4ed8',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            gutter={8}
            toastOptions={{
              duration: 5000,
              // Couleurs à contraste ≥ 4,5:1 avec le texte blanc (WCAG AA).
              style: { background: '#1f2937', color: '#ffffff' },
              success: { style: { background: '#047857', color: '#ffffff' } },
              error: { style: { background: '#b91c1c', color: '#ffffff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}

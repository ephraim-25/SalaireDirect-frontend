import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface LegalPageProps {
  title: string
  updatedAt: string
  children: ReactNode
}

export const TODO = ({ children }: { children: ReactNode }) => (
  <mark className="rounded bg-amber-100 px-1 text-amber-900">[À compléter : {children}]</mark>
)

export default function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold">
            SalaireDirect
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-blue-800 underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>
      <main id="contenu" className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">Dernière mise à jour : {updatedAt}</p>
        <div className="mt-8 space-y-6 leading-relaxed text-gray-800 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_li]:ml-5 [&_li]:list-disc [&_a]:text-blue-800 [&_a]:underline">
          {children}
        </div>
      </main>
    </div>
  )
}

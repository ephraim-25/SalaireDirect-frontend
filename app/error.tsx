'use client'

import { useEffect } from 'react'
import Button from '@/components/ui/Button'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main id="contenu" className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center text-gray-900">
      <h1 className="text-3xl font-bold">Une erreur est survenue</h1>
      <p className="mt-3 max-w-md text-gray-700">
        Nous n&apos;avons pas pu afficher cette page. Vos données ne sont pas perdues : réessayez dans un instant.
      </p>
      <Button className="mt-6" onClick={reset}>
        Réessayer
      </Button>
    </main>
  )
}

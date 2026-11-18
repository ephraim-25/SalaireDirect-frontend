import Link from 'next/link'

export const metadata = { title: 'Page introuvable' }

export default function NotFound() {
  return (
    <main id="contenu" className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center text-gray-900">
      <p className="text-sm font-semibold text-blue-800">Erreur 404</p>
      <h1 className="mt-2 text-3xl font-bold">Page introuvable</h1>
      <p className="mt-3 max-w-md text-gray-700">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-5 font-medium text-white hover:bg-blue-800"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  )
}

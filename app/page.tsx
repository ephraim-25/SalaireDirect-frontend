import Link from 'next/link'
import { ArrowRight, CheckCircle, FileText, Shield, Users } from 'lucide-react'

const FEATURES = [
  {
    icon: Shield,
    iconColor: 'text-blue-300',
    iconBg: 'bg-blue-500/10',
    title: 'Calculs IPR et CNSS automatiques',
    text: 'Barème IPR progressif, cotisations CNSS salariale et patronale et déductions pour enfants à charge appliqués automatiquement.',
  },
  {
    icon: FileText,
    iconColor: 'text-green-300',
    iconBg: 'bg-green-500/10',
    title: 'Bulletins de paie en PDF',
    text: 'Générez des bulletins de paie clairs, prêts à être remis à vos salariés.',
  },
  {
    icon: Users,
    iconColor: 'text-purple-300',
    iconBg: 'bg-purple-500/10',
    title: 'Gestion multi-salariés',
    text: 'Gérez vos effectifs, saisissez les variables mensuelles (primes, heures supplémentaires, absences) et retrouvez tout l’historique.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <a
        href="#contenu"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 font-medium text-blue-800 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu principal
      </a>

      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600" aria-hidden="true">
              <FileText className="h-5 w-5 text-white" />
            </span>
            <span className="text-xl font-bold">SalaireDirect</span>
          </Link>
          <nav aria-label="Accès au compte" className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/auth/login"
              className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-slate-200 hover:text-white"
            >
              Se connecter
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500"
            >
              Essai gratuit
              <span className="sr-only"> de 7 jours</span>
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenu">
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-28">
          <div className="text-center">
            <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200">
              <Shield className="h-4 w-4" aria-hidden="true" />
              Pensé pour la réglementation de la RD Congo (IPR, CNSS)
            </p>

            <h1 className="mb-6 text-balance text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Automatisez votre paie en RDC
              <br />
              <span className="text-blue-300">sans erreur de calcul</span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-200 sm:text-xl">
              Solution de gestion de la paie pour les PME, écoles et ONG. Calculs IPR et CNSS automatiques, bulletins PDF
              en un clic, essai gratuit de 7 jours.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/register"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-500 sm:w-auto"
              >
                Démarrer l&apos;essai gratuit
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="/auth/login"
                className="flex w-full items-center justify-center rounded-xl bg-slate-700 px-8 py-4 text-lg font-semibold text-white hover:bg-slate-600 sm:w-auto"
              >
                Se connecter
              </Link>
            </div>

            <ul className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-slate-300 sm:flex-row sm:gap-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" aria-hidden="true" />
                Sans carte bancaire
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" aria-hidden="true" />
                Essai de 7 jours
              </li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="pourquoi" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 id="pourquoi" className="mb-4 text-3xl font-bold sm:text-4xl">
              Pourquoi choisir SalaireDirect ?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">Une solution conçue pour simplifier la paie en RD Congo.</p>
          </div>

          <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-8">
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${feature.iconBg}`} aria-hidden="true">
                  <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                </div>
                <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                <p className="text-slate-300">{feature.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-blue-800 p-8 text-center sm:p-12 lg:p-16">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Prêt à simplifier votre paie ?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
              Créez votre compte en deux minutes et calculez votre première paie dès aujourd&apos;hui.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-800 hover:bg-blue-50"
            >
              Commencer l&apos;essai gratuit
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-700/50 bg-slate-900/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-300 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} SalaireDirect. Tous droits réservés.</p>
          <nav aria-label="Informations légales">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <li>
                <Link href="/legal/mentions-legales" className="inline-flex min-h-11 items-center underline hover:text-white">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/legal/confidentialite" className="inline-flex min-h-11 items-center underline hover:text-white">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/legal/cgu" className="inline-flex min-h-11 items-center underline hover:text-white">
                  Conditions d&apos;utilisation
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  )
}

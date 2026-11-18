'use client'

import { useCallback, useState } from 'react'
import { CheckCircle2, Circle, Loader2, Users, Wallet } from 'lucide-react'
import ButtonLink from '@/components/ui/ButtonLink'
import Card from '@/components/ui/Card'
import ErrorBanner from '@/components/ui/ErrorBanner'
import PageHeader from '@/components/ui/PageHeader'
import { api } from '@/lib/api'
import { useApiResource } from '@/lib/useApiResource'
import { formatMoney, formatPeriod } from '@/lib/utils'
import {
  BackendEmployee,
  PayrollPeriod,
  isPeriodValidated,
  payslipToTotalsRow,
  totalsByCurrency,
} from '@/types'

export default function DashboardPage() {
  const [now] = useState(() => new Date())
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const fetchData = useCallback(async () => {
    const [employees, payrolls] = await Promise.all([
      api.get<BackendEmployee[]>('/employees'),
      api.get<PayrollPeriod[]>('/payrolls'),
    ])
    return {
      activeEmployees: (Array.isArray(employees) ? employees : []).filter((e) => e.status === 'active').length,
      currentPayroll: (Array.isArray(payrolls) ? payrolls : []).find((p) => Number(p.month) === month && Number(p.year) === year),
    }
  }, [month, year])

  const { data, error, isLoading, reload } = useApiResource(fetchData)

  const payslips = data?.currentPayroll?.payslips ?? []
  const totals = totalsByCurrency(payslips.map(payslipToTotalsRow))
  const hasPayroll = Boolean(data?.currentPayroll)
  const isValidated = data?.currentPayroll ? isPeriodValidated(data.currentPayroll.status) : false

  const steps = [
    { label: 'Ajouter vos salariés', done: (data?.activeEmployees ?? 0) > 0, href: '/employees' },
    { label: `Calculer la paie de ${formatPeriod(month, year)}`, done: hasPayroll, href: '/calculation' },
    { label: 'Valider et clôturer la paie du mois', done: isValidated, href: '/calculation' },
  ]

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description={`Vue d’ensemble de la paie de ${formatPeriod(month, year)}`}
        actions={
          <>
            <ButtonLink href="/employees" variant="outline">
              <Users className="h-4 w-4" aria-hidden="true" />
              Gérer les employés
            </ButtonLink>
            <ButtonLink href="/calculation">
              <Wallet className="h-4 w-4" aria-hidden="true" />
              Calculer la paie
            </ButtonLink>
          </>
        }
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      {isLoading && !data ? (
        <div role="status" className="flex items-center justify-center py-16 text-gray-700">
          <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden="true" />
          Chargement des données…
        </div>
      ) : (
        <>
          <section aria-label="Indicateurs" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-sm text-gray-700">Employés actifs</p>
              <p className="mt-1 text-3xl font-bold">{data?.activeEmployees ?? 0}</p>
            </Card>

            <Card className="p-5">
              <p className="text-sm text-gray-700">Paie de {formatPeriod(month, year)}</p>
              <p className="mt-1 text-xl font-bold">
                {!hasPayroll ? 'Pas encore calculée' : isValidated ? 'Clôturée' : 'Brouillon'}
              </p>
              <p className="mt-1 text-sm text-gray-600">{payslips.length} bulletin(s) enregistré(s)</p>
            </Card>

            {totals.map((t) => (
              <Card key={t.currency} className="p-5">
                <p className="text-sm text-gray-700">Masse salariale brute ({t.currency})</p>
                <p className="mt-1 text-2xl font-bold">{formatMoney(t.gross, t.currency)}</p>
                <dl className="mt-2 space-y-0.5 text-sm text-gray-700">
                  <div className="flex justify-between gap-2">
                    <dt>Net à payer</dt>
                    <dd className="font-medium">{formatMoney(t.net, t.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>CNSS (sal. + pat.)</dt>
                    <dd className="font-medium">{formatMoney(t.cnssEmployee + t.cnssEmployer, t.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>IPR</dt>
                    <dd className="font-medium">{formatMoney(t.ipr, t.currency)}</dd>
                  </div>
                </dl>
              </Card>
            ))}
          </section>

          <Card title="Pour démarrer" subtitle="Les trois étapes d’un mois de paie">
            <ol className="space-y-2">
              {steps.map((step) => (
                <li key={step.label}>
                  <ButtonLink
                    href={step.href}
                    variant="outline"
                    className="w-full justify-start gap-3 text-left"
                    aria-label={`${step.label} — ${step.done ? 'terminé' : 'à faire'}`}
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-700" aria-hidden="true" />
                    ) : (
                      <Circle className="h-5 w-5 flex-shrink-0 text-gray-500" aria-hidden="true" />
                    )}
                    {step.label}
                  </ButtonLink>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </>
  )
}

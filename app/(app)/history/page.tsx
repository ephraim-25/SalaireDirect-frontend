'use client'

import { useCallback, useState } from 'react'
import { Calendar, CheckCircle, ChevronDown, Clock, Download, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import ButtonLink from '@/components/ui/ButtonLink'
import Card from '@/components/ui/Card'
import ErrorBanner from '@/components/ui/ErrorBanner'
import PageHeader from '@/components/ui/PageHeader'
import Select from '@/components/ui/Select'
import { api } from '@/lib/api'
import { useApiResource } from '@/lib/useApiResource'
import {
  MONTH_OPTIONS,
  downloadCsv,
  errorMessage,
  formatDate,
  formatMoney,
  formatPeriod,
  normalizeCurrency,
  yearOptions,
} from '@/lib/utils'
import { PayrollPeriod, isPeriodValidated, payslipToTotalsRow, totalsByCurrency } from '@/types'

const ALL = 'all'

function StatusBadge({ status }: { status: string }) {
  if (isPeriodValidated(status)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-900">
        <CheckCircle className="h-3 w-3" aria-hidden="true" />
        Clôturée
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-900">
      <Clock className="h-3 w-3" aria-hidden="true" />
      Brouillon
    </span>
  )
}

export default function HistoryPage() {
  const [selectedYear, setSelectedYear] = useState(ALL)
  const [selectedMonth, setSelectedMonth] = useState(ALL)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    const data = await api.get<PayrollPeriod[]>('/payrolls')
    return Array.isArray(data) ? data : []
  }, [])
  const { data, error, isLoading, reload } = useApiResource(fetchHistory)

  const periods = (data ?? []).filter(
    (p) =>
      (selectedYear === ALL || String(p.year) === selectedYear) &&
      (selectedMonth === ALL || String(p.month) === selectedMonth)
  )

  const exportPeriod = (period: PayrollPeriod) => {
    setDownloadingId(period.id)
    try {
      downloadCsv(
        `paie-${period.year}-${String(period.month).padStart(2, '0')}.csv`,
        ['Employé', 'Devise', 'Salaire de base', 'Primes', 'Heures sup.', 'Absences', 'Avances', 'Brut', 'CNSS salarié', 'CNSS patronal', 'IPR', 'Net à payer'],
        (period.payslips ?? []).map((p) => [
          p.employees ? `${p.employees.first_name} ${p.employees.last_name}` : 'Employé',
          normalizeCurrency(p.salary_currency),
          Number(p.base_salary) || 0,
          Number(p.bonuses) || 0,
          Number(p.overtime) || 0,
          Number(p.absences_deductions) || 0,
          Number(p.advances) || 0,
          Number(p.gross_salary) || 0,
          Number(p.cnss_employee) || 0,
          Number(p.cnss_employer) || 0,
          Number(p.ipr) || 0,
          Number(p.net_payable) || 0,
        ])
      )
    } catch (err) {
      toast.error(errorMessage(err, "Erreur lors de l'export"))
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <>
      <PageHeader title="Historique des paies" description="Consultez les périodes de paie enregistrées et exportez-les" />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Select label="Mois" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value={ALL}>Tous les mois</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
          <Select label="Année" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value={ALL}>Toutes les années</option>
            {yearOptions().map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoading && !data ? (
        <Card className="p-6 py-16 text-center">
          <div role="status">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-gray-600" aria-hidden="true" />
            <p className="text-gray-700">Chargement de l&apos;historique…</p>
          </div>
        </Card>
      ) : periods.length === 0 ? (
        <Card className="p-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100" aria-hidden="true">
            <Calendar className="h-10 w-10 text-gray-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Aucune période trouvée</h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-gray-700">
            Aucune paie enregistrée ne correspond à ces filtres. Une paie apparaît ici une fois enregistrée depuis la page de calcul.
          </p>
          <ButtonLink href="/calculation">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Calculer la paie
          </ButtonLink>
        </Card>
      ) : (
        <ul className="space-y-4">
          {periods.map((period) => {
            const slips = period.payslips ?? []
            const totals = totalsByCurrency(slips.map(payslipToTotalsRow))
            const label = formatPeriod(Number(period.month), Number(period.year))
            return (
              <li key={period.id}>
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-bold capitalize text-gray-900">{label}</h2>
                        <StatusBadge status={period.status} />
                      </div>
                      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                        <div>
                          <dt className="text-gray-700">Bulletins</dt>
                          <dd className="font-semibold text-gray-900">{slips.length}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-700">Masse salariale brute</dt>
                          <dd className="font-semibold text-gray-900">
                            {totals.length ? totals.map((t) => <span key={t.currency} className="block">{formatMoney(t.gross, t.currency)}</span>) : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-700">Net à payer total</dt>
                          <dd className="font-semibold text-gray-900">
                            {totals.length ? totals.map((t) => <span key={t.currency} className="block">{formatMoney(t.net, t.currency)}</span>) : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-700">Créée le</dt>
                          <dd className="font-semibold text-gray-900">{formatDate(period.created_at)}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex w-full gap-2 sm:w-auto">
                      <ButtonLink
                        href={`/calculation?month=${period.month}&year=${period.year}`}
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                      >
                        Recalculer
                        <span className="sr-only"> {label}</span>
                      </ButtonLink>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        disabled={slips.length === 0}
                        loading={downloadingId === period.id}
                        onClick={() => exportPeriod(period)}
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Export CSV
                        <span className="sr-only"> {label}</span>
                      </Button>
                    </div>
                  </div>

                  {slips.length > 0 && (
                    <details className="group mt-4 border-t border-gray-200 pt-3">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-blue-800">
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                        Voir le détail des {slips.length} bulletin(s)
                      </summary>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <caption className="sr-only">Bulletins de {label}</caption>
                          <thead>
                            <tr className="border-b border-gray-300 text-gray-800">
                              <th scope="col" className="px-2 py-2 font-semibold">Salarié</th>
                              <th scope="col" className="px-2 py-2 text-right font-semibold">Brut</th>
                              <th scope="col" className="px-2 py-2 text-right font-semibold">Net à payer</th>
                              <th scope="col" className="px-2 py-2 text-center font-semibold">Bulletin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {slips.map((p) => {
                              const name = p.employees ? `${p.employees.first_name} ${p.employees.last_name}` : 'Employé'
                              const currency = normalizeCurrency(p.salary_currency)
                              return (
                                <tr key={p.id}>
                                  <th scope="row" className="px-2 py-2 text-left font-medium text-gray-900">{name}</th>
                                  <td className="px-2 py-2 text-right tabular-nums">{formatMoney(Number(p.gross_salary) || 0, currency)}</td>
                                  <td className="px-2 py-2 text-right font-semibold tabular-nums">{formatMoney(Number(p.net_payable) || 0, currency)}</td>
                                  <td className="px-2 py-2 text-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      aria-label={`Télécharger le bulletin de ${name}`}
                                      onClick={async () => {
                                        const toastId = toast.loading('Génération du bulletin…')
                                        try {
                                          await api.download(`/pdf/payslip/${p.id}`, `bulletin-${name.replace(/\s+/g, '-').toLowerCase()}-${period.year}-${String(period.month).padStart(2, '0')}.pdf`)
                                          toast.success('Bulletin téléchargé', { id: toastId })
                                        } catch (err) {
                                          toast.error(errorMessage(err, 'Erreur lors du téléchargement'), { id: toastId })
                                        }
                                      }}
                                    >
                                      <FileText className="h-4 w-4" aria-hidden="true" />
                                      PDF
                                    </Button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

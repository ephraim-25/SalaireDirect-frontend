'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Calculator, CheckCircle, Download, FileText, Info, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/ui/PageHeader'
import Select from '@/components/ui/Select'
import { api } from '@/lib/api'
import {
  Currency,
  MONTH_OPTIONS,
  downloadCsv,
  errorMessage,
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
  formatPeriod,
  yearOptions,
} from '@/lib/utils'
import {
  BackendEmployee,
  BackendVariable,
  CalculateResponse,
  PayrollCalculation,
  SaveMonthResponse,
  mapBackendToEmployee,
  totalsByCurrency,
} from '@/types'

/**
 * Hypothèses de valorisation appliquées AVANT l'envoi au moteur de calcul.
 * À faire valider par un expert-comptable / la législation du travail RDC,
 * et idéalement à déplacer côté backend.
 */
const MONTHLY_WORK_HOURS = 173.33 // 40 h/semaine
const OVERTIME_MULTIPLIER = 1.5
const WORKING_DAYS_PER_MONTH = 26

const round2 = (n: number) => Math.round(n * 100) / 100

interface Saved {
  status: 'draft' | 'closed'
  payslipIds: Record<string, string>
}

function CalculationContent() {
  const searchParams = useSearchParams()
  const [month, setMonth] = useState(() => searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const [year, setYear] = useState(() => searchParams.get('year') ?? String(new Date().getFullYear()))
  const [rate, setRate] = useState('2800')
  const [calculations, setCalculations] = useState<PayrollCalculation[] | null>(null)
  const [legalRates, setLegalRates] = useState<CalculateResponse['legal_parameters']>()
  const [saved, setSaved] = useState<Saved | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  const period = formatPeriod(Number(month), Number(year))
  const rateValue = parseFloat(rate.replace(',', '.'))
  const rateError = rate !== '' && !(rateValue > 0) ? 'Saisissez un taux supérieur à zéro.' : undefined

  const resetResult = () => {
    setCalculations(null)
    setSaved(null)
  }

  const handleCalculate = async () => {
    if (!(rateValue > 0)) {
      toast.error('Saisissez un taux de change valide.')
      return
    }

    setIsCalculating(true)
    const toastId = toast.loading('Calcul en cours…')
    try {
      const allEmployees = await api.get<BackendEmployee[]>('/employees')
      const employees = (Array.isArray(allEmployees) ? allEmployees : [])
        .map(mapBackendToEmployee)
        .filter((e) => e.status === 'Actif')

      if (employees.length === 0) {
        toast.error('Aucun salarié actif : ajoutez des employés avant de calculer la paie.', { id: toastId })
        return
      }

      // Une erreur ici doit interrompre le calcul : l'ignorer produirait des bulletins sans primes ni absences.
      const monthlyVars = await api.get<BackendVariable[]>('/payrolls/variables', { params: { month, year } })
      const variables = Array.isArray(monthlyVars) ? monthlyVars : []

      const payloads = employees.map((emp) => {
        const mine = variables.filter((v) => v.employee_id === emp.id)
        const sum = (type: string, field: 'amount' | 'quantity', fallback = 0) =>
          mine.filter((v) => v.type === type).reduce((acc, v) => acc + (Number(v[field]) || fallback), 0)

        const hourlyRate = emp.baseSalary > 0 ? emp.baseSalary / MONTHLY_WORK_HOURS : 0
        const dailyRate = emp.baseSalary > 0 ? emp.baseSalary / WORKING_DAYS_PER_MONTH : 0

        return {
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          baseSalary: emp.baseSalary,
          currency: emp.currency,
          primes: sum('prime', 'amount'),
          overtime: round2(sum('heures_sup', 'quantity') * hourlyRate * OVERTIME_MULTIPLIER),
          absences: round2(sum('absence', 'quantity', 1) * dailyRate),
          advances: sum('avance', 'amount'),
          numberOfDependents: emp.numberOfDependents,
        }
      })

      const res = await api.post<CalculateResponse>('/payrolls/calculate', {
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        usd_cdf_rate: rateValue,
        employees: payloads,
      })

      if (!res?.calculations) throw new Error('Réponse de calcul invalide.')
      setCalculations(res.calculations)
      setLegalRates(res.legal_parameters)
      setSaved(null)
      toast.success(`Calcul terminé pour ${res.calculations.length} salarié(s). Pensez à enregistrer la paie.`, { id: toastId })
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors du calcul de la paie'), { id: toastId })
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSave = async (status: 'draft' | 'closed') => {
    if (!calculations) return
    setIsSaving(true)
    const toastId = toast.loading(status === 'closed' ? 'Clôture de la paie…' : 'Enregistrement…')
    try {
      const res = await api.post<SaveMonthResponse>('/payrolls/save-month', {
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        usd_cdf_rate: rateValue,
        status,
        calculations,
      })
      setSaved({
        status,
        payslipIds: Object.fromEntries((res.payslips ?? []).map((p) => [p.employee_id, p.id])),
      })
      setConfirmClose(false)
      toast.success(status === 'closed' ? `Paie de ${period} clôturée.` : 'Brouillon enregistré.', { id: toastId })
    } catch (err) {
      toast.error(errorMessage(err, "Erreur lors de l'enregistrement"), { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadPayslip = async (calc: PayrollCalculation) => {
    const payslipId = saved?.payslipIds[calc.employeeId]
    if (!payslipId) return
    const toastId = toast.loading('Génération du bulletin…')
    try {
      const slug = calc.employeeName.replace(/\s+/g, '-').toLowerCase()
      await api.download(`/pdf/payslip/${payslipId}`, `bulletin-${slug}-${year}-${month.padStart(2, '0')}.pdf`)
      toast.success('Bulletin téléchargé', { id: toastId })
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors du téléchargement'), { id: toastId })
    }
  }

  const handleExport = () => {
    if (!calculations) return
    downloadCsv(
      `paie-${year}-${month.padStart(2, '0')}.csv`,
      ['Employé', 'Devise', 'Salaire de base', 'Primes', 'Heures sup.', 'Absences', 'Avances', 'Brut', 'CNSS salarié', 'CNSS patronal', 'IPR', 'Net à payer'],
      calculations.map((c) => [
        c.employeeName,
        c.currency,
        c.baseSalary,
        c.primes,
        c.overtime,
        c.absences,
        c.advances,
        c.grossSalary,
        c.cnssEmployee,
        c.cnssEmployer,
        c.ipr,
        c.netSalary,
      ])
    )
  }

  const totals = calculations
    ? totalsByCurrency(
        calculations.map((c) => ({
          currency: c.currency,
          gross: c.grossSalary,
          net: c.netSalary,
          cnssEmployee: c.cnssEmployee,
          cnssEmployer: c.cnssEmployer,
          ipr: c.ipr,
        }))
      )
    : []

  const sumColumn = (currency: Currency, key: keyof PayrollCalculation) =>
    (calculations ?? []).filter((c) => c.currency === currency).reduce((acc, c) => acc + (Number(c[key]) || 0), 0)

  const fmt = (value: number, currency: Currency) => formatNumber(value, currency === 'CDF' ? 0 : 2)
  const employeeRate = legalRates ? formatPercent(legalRates.cnss_employee_rate) : null
  const employerRate = legalRates ? formatPercent(legalRates.cnss_employer_rate) : null
  const isClosed = saved?.status === 'closed'

  return (
    <>
      <PageHeader
        title="Calcul de la paie"
        description="Calcul de l'IPR et des cotisations CNSS, puis enregistrement des bulletins"
        actions={
          calculations && (
            <>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Exporter en CSV
              </Button>
              <Button variant="secondary" onClick={() => handleSave('draft')} loading={isSaving} disabled={isClosed}>
                <Save className="h-4 w-4" aria-hidden="true" />
                Enregistrer le brouillon
              </Button>
              <Button onClick={() => setConfirmClose(true)} disabled={isSaving || isClosed}>
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                {isClosed ? 'Paie clôturée' : 'Valider et clôturer'}
              </Button>
            </>
          )
        }
      />

      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-col items-end gap-4 sm:flex-row">
          <Select
            label="Mois de paie"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value)
              resetResult()
            }}
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
          <Select
            label="Année"
            value={year}
            onChange={(e) => {
              setYear(e.target.value)
              resetResult()
            }}
          >
            {yearOptions().map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </Select>
          <Input
            label="Taux de change (1 USD en CDF)"
            type="text"
            inputMode="decimal"
            value={rate}
            onChange={(e) => {
              setRate(e.target.value)
              resetResult()
            }}
            error={rateError}
          />
          <Button onClick={handleCalculate} loading={isCalculating} className="w-full sm:w-auto">
            <Calculator className="h-4 w-4" aria-hidden="true" />
            {isCalculating ? 'Calcul en cours…' : 'Calculer la paie'}
          </Button>
        </div>
      </Card>

      {!calculations ? (
        <Card className="p-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-800" aria-hidden="true">
            <Calculator className="h-10 w-10" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Prêt à calculer la paie de {period}</h2>
          <p className="mx-auto max-w-md text-sm text-gray-700">
            Le calcul utilise vos salariés actifs et les variables saisies pour ce mois (primes, heures supplémentaires,
            absences, avances). Rien n&apos;est enregistré tant que vous ne l&apos;avez pas demandé.
          </p>
        </Card>
      ) : (
        <>
          {saved && (
            <div role="status" className="mb-6 flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-900">
              <CheckCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {isClosed ? `La paie de ${period} est clôturée. ` : `Brouillon de ${period} enregistré. `}
              Les bulletins PDF sont disponibles ci-dessous.
            </div>
          )}

          <section aria-label="Totaux" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {totals.map((t) => (
              <Card key={t.currency} className="p-4 sm:p-5">
                <h2 className="mb-2 text-sm font-semibold text-gray-700">
                  Totaux en {t.currency} ({t.count} salarié{t.count > 1 ? 's' : ''})
                </h2>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-700">Brut</dt>
                    <dd className="font-semibold">{formatMoney(t.gross, t.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-700">Net à payer</dt>
                    <dd className="text-lg font-bold text-blue-800">{formatMoney(t.net, t.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-700">CNSS patronale</dt>
                    <dd className="font-semibold">{formatMoney(t.cnssEmployer, t.currency)}</dd>
                  </div>
                </dl>
              </Card>
            ))}
          </section>

          <Card title={`Détail des bulletins — ${period}`} className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Détail du calcul de la paie de {period} par salarié. Montants exprimés dans la devise de chaque salarié.
                </caption>
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50 text-gray-800">
                    <th scope="col" className="px-3 py-3 font-semibold">Salarié</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Devise</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Base</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Primes</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">H. sup.</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Absences</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Avances</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Brut</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">CNSS sal.</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">IPR</th>
                    <th scope="col" className="bg-blue-50 px-3 py-3 text-right font-bold text-blue-900">Net à payer</th>
                    <th scope="col" className="px-3 py-3 text-center font-semibold">Bulletin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {calculations.map((c) => (
                    <tr key={c.employeeId} className="hover:bg-gray-50">
                      <th scope="row" className="px-3 py-3 text-left font-medium text-gray-900">{c.employeeName}</th>
                      <td className="px-3 py-3 text-gray-800">{c.currency}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmt(c.baseSalary, c.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-green-800">{fmt(c.primes, c.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-blue-800">{fmt(c.overtime, c.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-red-800">{fmt(c.absences, c.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-orange-900">{fmt(c.advances, c.currency)}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">{fmt(c.grossSalary, c.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmt(c.cnssEmployee, c.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmt(c.ipr, c.currency)}</td>
                      <td className="bg-blue-50 px-3 py-3 text-right font-bold tabular-nums text-blue-900">{fmt(c.netSalary, c.currency)}</td>
                      <td className="px-3 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!saved}
                          onClick={() => handleDownloadPayslip(c)}
                          title={saved ? undefined : 'Enregistrez la paie pour générer les bulletins'}
                          aria-label={`Télécharger le bulletin de ${c.employeeName}`}
                        >
                          <FileText className="h-4 w-4" aria-hidden="true" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {totals.map((t) => (
                    <tr key={t.currency} className="border-t-2 border-gray-400 bg-gray-100 font-bold text-gray-900">
                      <th scope="row" className="px-3 py-3 text-left">Total</th>
                      <td className="px-3 py-3">{t.currency}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmt(sumColumn(t.currency, 'baseSalary'), t.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmt(sumColumn(t.currency, 'primes'), t.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmt(sumColumn(t.currency, 'overtime'), t.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmt(sumColumn(t.currency, 'absences'), t.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmt(sumColumn(t.currency, 'advances'), t.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmt(t.gross, t.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmt(t.cnssEmployee, t.currency)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmt(t.ipr, t.currency)}</td>
                      <td className="bg-blue-100 px-3 py-3 text-right tabular-nums text-blue-900">{fmt(t.net, t.currency)}</td>
                      <td />
                    </tr>
                  ))}
                </tfoot>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card title="Cotisations CNSS à reverser">
              <div className="space-y-4">
                {totals.map((t) => (
                  <dl key={t.currency} className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3 text-sm">
                      <dt className="text-gray-800">Part salariale{employeeRate ? ` (${employeeRate})` : ''}</dt>
                      <dd className="font-bold text-blue-900">{formatMoney(t.cnssEmployee, t.currency)}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-purple-50 p-3 text-sm">
                      <dt className="text-gray-800">Part patronale{employerRate ? ` (${employerRate})` : ''}</dt>
                      <dd className="font-bold text-purple-900">{formatMoney(t.cnssEmployer, t.currency)}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-100 p-3 text-sm font-bold">
                      <dt className="text-gray-900">Total CNSS</dt>
                      <dd className="text-gray-900">{formatMoney(t.cnssEmployee + t.cnssEmployer, t.currency)}</dd>
                    </div>
                  </dl>
                ))}
              </div>
            </Card>

            <Card title="Impôt professionnel sur les revenus (IPR)">
              <div className="space-y-3">
                {totals.map((t) => (
                  <div key={t.currency} className="flex items-center justify-between rounded-xl bg-amber-50 p-3 text-sm">
                    <span className="text-gray-800">IPR retenu ({t.currency})</span>
                    <span className="font-bold text-amber-900">{formatMoney(t.ipr, t.currency)}</span>
                  </div>
                ))}
                <p className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>
                    Barème progressif appliqué par le serveur
                    {legalRates?.effective_date ? ` (paramètres en vigueur au ${formatDate(legalRates.effective_date)})` : ''}. Taux de change
                    utilisé : 1 USD = {formatNumber(rateValue, 0)} CDF.
                  </span>
                </p>
              </div>
            </Card>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmClose}
        title={`Clôturer la paie de ${period} ?`}
        confirmLabel="Valider et clôturer"
        variant="primary"
        loading={isSaving}
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => handleSave('closed')}
      >
        <p>
          Les {calculations?.length ?? 0} bulletins seront enregistrés et la période sera marquée comme clôturée. Vérifiez
          les montants avant de confirmer.
        </p>
      </ConfirmDialog>
    </>
  )
}

export default function CalculationPage() {
  return (
    <Suspense fallback={null}>
      <CalculationContent />
    </Suspense>
  )
}

'use client'

import { useCallback, useState } from 'react'
import { CalendarDays, Clock, DollarSign, Plus, RefreshCw, Trash2, UserMinus, type LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ErrorBanner from '@/components/ui/ErrorBanner'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/ui/PageHeader'
import Select from '@/components/ui/Select'
import { api } from '@/lib/api'
import { useApiResource } from '@/lib/useApiResource'
import { Currency, MONTH_OPTIONS, errorMessage, formatMoney, formatNumber, formatPeriod, yearOptions } from '@/lib/utils'
import {
  BackendEmployee,
  BackendVariable,
  MonthlyVariable,
  VariableType,
  mapBackendToEmployee,
  mapBackendVariable,
} from '@/types'

const VARIABLE_TYPES: { value: VariableType; label: string; icon: LucideIcon; color: string; bg: string }[] = [
  { value: 'prime', label: 'Prime', icon: DollarSign, color: 'text-green-800', bg: 'bg-green-100' },
  { value: 'heures_sup', label: 'Heures supplémentaires', icon: Clock, color: 'text-blue-800', bg: 'bg-blue-100' },
  { value: 'absence', label: 'Absence', icon: UserMinus, color: 'text-red-800', bg: 'bg-red-100' },
  { value: 'avance', label: 'Avance sur salaire', icon: DollarSign, color: 'text-orange-800', bg: 'bg-orange-100' },
]

const emptyForm = { employeeId: '', type: 'prime' as VariableType, amount: '', quantity: '', description: '' }

export default function VariablesPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth() + 1))
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()))
  const [formData, setFormData] = useState(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toDelete, setToDelete] = useState<MonthlyVariable | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchEmployees = useCallback(async () => {
    const data = await api.get<BackendEmployee[]>('/employees')
    return (Array.isArray(data) ? data : []).map(mapBackendToEmployee)
  }, [])
  const employeesResource = useApiResource(fetchEmployees)
  const employees = employeesResource.data ?? []

  const fetchVariables = useCallback(async () => {
    const data = await api.get<BackendVariable[]>('/payrolls/variables', {
      params: { month: selectedMonth, year: selectedYear },
    })
    return (Array.isArray(data) ? data : []).map(mapBackendVariable)
  }, [selectedMonth, selectedYear])
  const variablesResource = useApiResource(fetchVariables)
  const variables = variablesResource.data ?? []

  const error = variablesResource.error ?? employeesResource.error
  const reloadAll = () => {
    employeesResource.reload()
    variablesResource.reload()
  }

  const employeeById = (id: string) => employees.find((e) => e.id === id)
  const selectedEmployee = employeeById(formData.employeeId)
  const formCurrency: Currency = selectedEmployee?.currency ?? 'USD'
  const typeInfo = (type: string) => VARIABLE_TYPES.find((t) => t.value === type)
  const monthLabel = formatPeriod(Number(selectedMonth), Number(selectedYear))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseFloat(formData.amount)
    const quantity = parseFloat(formData.quantity)

    if ((formData.type === 'prime' || formData.type === 'avance') && !(amount > 0)) {
      toast.error('Saisissez un montant supérieur à zéro.')
      return
    }
    if ((formData.type === 'heures_sup' || formData.type === 'absence') && !(quantity > 0)) {
      toast.error(formData.type === 'absence' ? "Saisissez un nombre de jours d'absence." : "Saisissez un nombre d'heures.")
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/payrolls/variables', {
        employee_id: formData.employeeId,
        type: formData.type,
        amount: formData.type === 'prime' || formData.type === 'avance' ? amount : undefined,
        quantity: formData.type === 'heures_sup' || formData.type === 'absence' ? quantity : undefined,
        description: formData.description.trim(),
        month: parseInt(selectedMonth, 10),
        year: parseInt(selectedYear, 10),
      })
      toast.success('Variable ajoutée')
      setFormData((prev) => ({ ...emptyForm, employeeId: prev.employeeId }))
      variablesResource.reload()
    } catch (err) {
      toast.error(errorMessage(err, "Erreur lors de l'enregistrement"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setIsDeleting(true)
    try {
      await api.delete(`/payrolls/variables/${toDelete.id}`)
      toast.success('Variable supprimée')
      setToDelete(null)
      variablesResource.reload()
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la suppression'))
    } finally {
      setIsDeleting(false)
    }
  }

  // Récapitulatif : les montants sont additionnés par devise du salarié, jamais mélangés.
  const sumAmounts = (type: VariableType) => {
    const byCurrency = new Map<Currency, number>()
    for (const v of variables.filter((x) => x.type === type)) {
      const currency = employeeById(v.employeeId)?.currency ?? 'USD'
      byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + (v.amount ?? 0))
    }
    return Array.from(byCurrency.entries())
  }
  const totalPrimes = sumAmounts('prime')
  const totalAdvances = sumAmounts('avance')
  const totalHours = variables.filter((v) => v.type === 'heures_sup').reduce((s, v) => s + (v.quantity ?? 0), 0)
  const totalAbsenceDays = variables.filter((v) => v.type === 'absence').reduce((s, v) => s + (v.quantity ?? 1), 0)

  const renderMoneyList = (entries: [Currency, number][]) =>
    entries.length === 0 ? '—' : entries.map(([currency, value]) => <span key={currency} className="block">{formatMoney(value, currency)}</span>)

  return (
    <>
      <PageHeader
        title="Variables du mois"
        description="Primes, heures supplémentaires, absences et avances sur salaire"
        actions={
          <Button variant="outline" onClick={reloadAll} disabled={variablesResource.isLoading} aria-label="Actualiser">
            <RefreshCw className={`h-4 w-4 ${variablesResource.isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={reloadAll} />}

      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Select label="Mois de paie" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
          <Select label="Année" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {yearOptions().map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card title="Ajouter une variable" className="lg:sticky lg:top-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Salarié concerné"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
              >
                <option value="">Sélectionner un salarié</option>
                {employees
                  .filter((emp) => emp.status === 'Actif')
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                      {emp.position ? ` (${emp.position})` : ''}
                    </option>
                  ))}
              </Select>

              <Select
                label="Type de variable"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as VariableType, amount: '', quantity: '' })}
              >
                {VARIABLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>

              {formData.type === 'prime' || formData.type === 'avance' ? (
                <Input
                  label={`Montant (${formCurrency})`}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  hint={selectedEmployee ? `Devise du salaire de ${selectedEmployee.firstName}.` : 'Choisissez un salarié pour connaître la devise.'}
                  required
                />
              ) : formData.type === 'heures_sup' ? (
                <Input
                  label="Nombre d'heures"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0.5"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              ) : (
                <Input
                  label="Nombre de jours d'absence"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0.5"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              )}

              <Input
                label="Motif / description"
                placeholder="Ex. : prime de rendement"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />

              <Button type="submit" className="w-full" loading={isSubmitting}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? 'Enregistrement…' : 'Ajouter la variable'}
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title={`Variables enregistrées — ${monthLabel}`}>
            {variablesResource.isLoading && !variablesResource.data ? (
              <div role="status" aria-label="Chargement" className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            ) : variables.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDays className="mx-auto mb-3 h-16 w-16 text-gray-400" aria-hidden="true" />
                <p className="font-medium text-gray-900">Aucune variable saisie pour ce mois</p>
                <p className="mt-1 text-sm text-gray-700">Utilisez le formulaire pour renseigner primes, absences ou avances.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {variables.map((variable) => {
                  const info = typeInfo(variable.type)
                  const employee = employeeById(variable.employeeId)
                  const Icon = info?.icon
                  return (
                    <li key={variable.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex-shrink-0 rounded-full p-2.5 ${info?.bg ?? 'bg-gray-100'} ${info?.color ?? 'text-gray-800'}`} aria-hidden="true">
                          {Icon && <Icon className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {employee ? `${employee.firstName} ${employee.lastName}` : 'Employé inconnu'}
                          </p>
                          <p className="truncate text-xs text-gray-700">{variable.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {variable.amount !== undefined
                              ? formatMoney(variable.amount, employee?.currency ?? 'USD')
                              : variable.quantity !== undefined
                                ? `${formatNumber(variable.quantity, Number.isInteger(variable.quantity) ? 0 : 1)} ${variable.type === 'absence' ? 'j' : 'h'}`
                                : '—'}
                          </p>
                          <span className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[11px] text-gray-800">{info?.label}</span>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setToDelete(variable)}
                          aria-label={`Supprimer la variable « ${variable.description} »`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {variables.length > 0 && (
            <Card title="Récapitulatif">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-green-200 bg-green-50 p-3.5">
                  <dt className="text-xs font-medium text-green-900">Primes</dt>
                  <dd className="mt-1 text-lg font-bold text-green-900">{renderMoneyList(totalPrimes)}</dd>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                  <dt className="text-xs font-medium text-blue-900">Heures supplémentaires</dt>
                  <dd className="mt-1 text-lg font-bold text-blue-900">{formatNumber(totalHours, 1)} h</dd>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
                  <dt className="text-xs font-medium text-red-900">Jours d&apos;absence</dt>
                  <dd className="mt-1 text-lg font-bold text-red-900">{formatNumber(totalAbsenceDays, 1)} j</dd>
                </div>
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-3.5">
                  <dt className="text-xs font-medium text-orange-900">Avances</dt>
                  <dd className="mt-1 text-lg font-bold text-orange-900">{renderMoneyList(totalAdvances)}</dd>
                </div>
              </dl>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Supprimer cette variable ?"
        confirmLabel="Supprimer"
        loading={isDeleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      >
        <p>
          « {toDelete?.description} » sera retirée du mois de {monthLabel}. Pensez à relancer le calcul de la paie.
        </p>
      </ConfirmDialog>
    </>
  )
}

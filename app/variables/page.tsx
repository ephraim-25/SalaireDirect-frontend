'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Clock, 
  UserMinus, 
  ArrowLeft,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { MonthlyVariable, Employee, BackendEmployee, mapBackendToEmployee } from '@/types'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function VariablesPage() {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState('11')
  const [selectedYear, setSelectedYear] = useState('2026')

  const [employees, setEmployees] = useState<Employee[]>([])
  const [variables, setVariables] = useState<MonthlyVariable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'prime' as 'prime' | 'heures_sup' | 'absence' | 'avance',
    amount: '',
    quantity: '',
    description: ''
  })

  const variableTypes = [
    { value: 'prime', label: 'Prime', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'heures_sup', label: 'Heures Sup.', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'absence', label: 'Absence', icon: UserMinus, color: 'text-red-600', bg: 'bg-red-50' },
    { value: 'avance', label: 'Avance sur salaire', icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' }
  ]

  // Charger la liste des employés
  const fetchEmployees = useCallback(async () => {
    try {
      const data = await api.get<BackendEmployee[]>('/employees')
      const mapped = Array.isArray(data) ? data.map(mapBackendToEmployee) : []
      setEmployees(mapped)
      return mapped
    } catch {
      return []
    }
  }, [])

  // Charger les variables du mois
  const fetchVariables = useCallback(async (showToast = false) => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const [varsData] = await Promise.all([
        api.get<any[]>('/payrolls/variables', {
          params: { month: selectedMonth, year: selectedYear }
        }),
        fetchEmployees()
      ])

      const mappedVars: MonthlyVariable[] = (varsData || []).map((v) => ({
        id: v.id,
        employeeId: v.employee_id,
        type: v.type,
        amount: v.amount ? Number(v.amount) : undefined,
        quantity: v.quantity ? Number(v.quantity) : undefined,
        description: v.description,
        month: String(v.month),
        year: Number(v.year),
        created_at: v.created_at
      }))

      setVariables(mappedVars)
      if (showToast) {
        toast.success(`${mappedVars.length} variable(s) chargée(s)`)
      }
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors du chargement des variables'
      setFetchError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear, fetchEmployees])

  useEffect(() => {
    fetchVariables()
  }, [fetchVariables])

  const handleAddVariable = async () => {
    if (!formData.employeeId) {
      toast.error('Veuillez sélectionner un employé')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Veuillez saisir une description')
      return
    }

    if (
      (formData.type === 'prime' || formData.type === 'avance') &&
      (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0)
    ) {
      toast.error('Veuillez saisir un montant valide')
      return
    }

    if (
      formData.type === 'heures_sup' &&
      (!formData.quantity || isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0)
    ) {
      toast.error('Veuillez saisir un nombre d’heures valide')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Enregistrement de la variable...')

    try {
      const payload = {
        employee_id: formData.employeeId,
        type: formData.type,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
        description: formData.description.trim(),
        month: parseInt(selectedMonth, 10),
        year: parseInt(selectedYear, 10)
      }

      const res = await api.post<any>('/payrolls/variables', payload)

      const newVar: MonthlyVariable = {
        id: res.id,
        employeeId: res.employee_id,
        type: res.type,
        amount: res.amount ? Number(res.amount) : undefined,
        quantity: res.quantity ? Number(res.quantity) : undefined,
        description: res.description,
        month: String(res.month),
        year: Number(res.year)
      }

      setVariables(prev => [newVar, ...prev])
      toast.success('Variable ajoutée avec succès', { id: toastId })

      setFormData({
        employeeId: '',
        type: 'prime',
        amount: '',
        quantity: '',
        description: ''
      })
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de l’enregistrement de la variable', { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteVariable = async (id: string) => {
    setDeletingId(id)
    const toastId = toast.loading('Suppression en cours...')

    try {
      await api.delete(`/payrolls/variables/${id}`)
      setVariables(prev => prev.filter(v => v.id !== id))
      toast.success('Variable supprimée', { id: toastId })
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression', { id: toastId })
    } finally {
      setDeletingId(null)
    }
  }

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId)
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Employé inconnu'
  }

  const getVariableType = (type: string) => {
    return variableTypes.find(v => v.value === type)
  }

  const filteredVariables = variables.filter(
    v => String(v.month) === selectedMonth && Number(v.year) === parseInt(selectedYear, 10)
  )

  const monthLabel = new Date(parseInt(selectedYear, 10), parseInt(selectedMonth, 10) - 1).toLocaleDateString(
    'fr-FR',
    { month: 'long', year: 'numeric' }
  )

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              aria-label="Retour au tableau de bord"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Variables du Mois
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Saisie des primes, heures supplémentaires, absences et acomptes
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchVariables(true)}
            disabled={isLoading}
            className="flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Message d'erreur */}
        {fetchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{fetchError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchVariables(true)}>
              Réessayer
            </Button>
          </div>
        )}

        {/* Sélecteur Mois / Année */}
        <Card className="mb-6 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select
                label="Mois de paie"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="1">Janvier</option>
                <option value="2">Février</option>
                <option value="3">Mars</option>
                <option value="4">Avril</option>
                <option value="5">Mai</option>
                <option value="6">Juin</option>
                <option value="7">Juillet</option>
                <option value="8">Août</option>
                <option value="9">Septembre</option>
                <option value="10">Octobre</option>
                <option value="11">Novembre</option>
                <option value="12">Décembre</option>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                label="Année"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </Select>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire d'ajout rapide (Mobile First) */}
          <div className="lg:col-span-1">
            <Card title="Ajouter une Variable" className="sticky top-4">
              <div className="space-y-4">
                <Select
                  label="Salarié concerné"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un salarié</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.position || 'Employé'})
                    </option>
                  ))}
                </Select>

                <Select
                  label="Type de variable"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  {variableTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Select>

                {formData.type === 'prime' || formData.type === 'avance' ? (
                  <Input
                    label="Montant (USD)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Ex: 50.00"
                    required
                  />
                ) : formData.type === 'heures_sup' ? (
                  <Input
                    label="Nombre d'heures"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Ex: 8"
                    required
                  />
                ) : (
                  <Input
                    label="Nombre de jours d'absence"
                    type="number"
                    step="1"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Ex: 2"
                    required
                  />
                )}

                <Input
                  label="Motif / Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Prime de rendement, Retard, etc."
                  required
                />

                <Button
                  onClick={handleAddVariable}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter la variable
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Liste des variables */}
          <div className="lg:col-span-2 space-y-6">
            <Card title={`Variables enregistrées - ${monthLabel}`}>
              {isLoading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredVariables.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Aucune variable saisie pour ce mois</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Utilisez le formulaire pour renseigner les primes, absences ou acomptes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVariables.map((variable) => {
                    const typeInfo = getVariableType(variable.type)
                    return (
                      <div
                        key={variable.id}
                        className="flex items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2.5 rounded-full ${typeInfo?.bg || 'bg-gray-100'} ${typeInfo?.color || 'text-gray-600'} flex-shrink-0`}>
                            {typeInfo?.icon && <typeInfo.icon className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {getEmployeeName(variable.employeeId)}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{variable.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-gray-900 text-sm">
                              {variable.amount ? `${variable.amount.toLocaleString('fr-FR')} USD` : 
                               variable.quantity ? `${variable.quantity}h / j` : '-'}
                            </p>
                            <span className="text-[11px] text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                              {typeInfo?.label}
                            </span>
                          </div>

                          <Button
                            variant="danger"
                            size="sm"
                            disabled={deletingId === variable.id}
                            onClick={() => handleDeleteVariable(variable.id)}
                            className="px-2.5"
                          >
                            {deletingId === variable.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Récapitulatif mensuel */}
            {filteredVariables.length > 0 && (
              <Card title="Récapitulatif des variables" className="p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-xs text-green-700 font-medium">Total Primes</p>
                    <p className="text-lg font-bold text-green-800 mt-1">
                      {filteredVariables
                        .filter(v => v.type === 'prime')
                        .reduce((sum, v) => sum + (v.amount || 0), 0)
                        .toLocaleString('fr-FR')} $
                    </p>
                  </div>

                  <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-700 font-medium">Total Heures Sup.</p>
                    <p className="text-lg font-bold text-blue-800 mt-1">
                      {filteredVariables
                        .filter(v => v.type === 'heures_sup')
                        .reduce((sum, v) => sum + (v.quantity || 0), 0)} h
                    </p>
                  </div>

                  <div className="p-3.5 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-xs text-red-700 font-medium">Absences</p>
                    <p className="text-lg font-bold text-red-800 mt-1">
                      {filteredVariables.filter(v => v.type === 'absence').length} j
                    </p>
                  </div>

                  <div className="p-3.5 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-xs text-orange-700 font-medium">Total Avances</p>
                    <p className="text-lg font-bold text-orange-800 mt-1">
                      {filteredVariables
                        .filter(v => v.type === 'avance')
                        .reduce((sum, v) => sum + (v.amount || 0), 0)
                        .toLocaleString('fr-FR')} $
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

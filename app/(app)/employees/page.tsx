'use client'

import { useCallback, useState } from 'react'
import { Phone, Plus, RefreshCw, Search, Pencil, Trash2, UserCheck, UserX, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ErrorBanner from '@/components/ui/ErrorBanner'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import Select from '@/components/ui/Select'
import { api } from '@/lib/api'
import { useApiResource } from '@/lib/useApiResource'
import { Currency, errorMessage, formatDate, formatMoney } from '@/lib/utils'
import {
  BackendEmployee,
  Employee,
  MaritalStatus,
  MobileMoneyProvider,
  mapBackendToEmployee,
  mapEmployeeToBackend,
} from '@/types'

interface EmployeeForm {
  firstName: string
  lastName: string
  position: string
  cnssNumber: string
  baseSalary: string
  currency: Currency
  mobileMoneyProvider: MobileMoneyProvider | ''
  mobileMoneyNumber: string
  whatsappNumber: string
  maritalStatus: MaritalStatus
  numberOfDependents: string
  hireDate: string
  status: 'Actif' | 'Inactif'
}

type PendingAction =
  | { kind: 'deactivate'; employee: Employee }
  | { kind: 'delete'; employee: Employee }
  | null

const PHONE_PATTERN = /^\+?[0-9 ]{9,16}$/

function emptyForm(): EmployeeForm {
  return {
    firstName: '',
    lastName: '',
    position: '',
    cnssNumber: '',
    baseSalary: '',
    currency: 'USD',
    mobileMoneyProvider: '',
    mobileMoneyNumber: '',
    whatsappNumber: '',
    maritalStatus: 'Célibataire',
    numberOfDependents: '0',
    hireDate: new Date().toISOString().split('T')[0],
    status: 'Actif',
  }
}

function formFromEmployee(e: Employee): EmployeeForm {
  return {
    firstName: e.firstName,
    lastName: e.lastName,
    position: e.position,
    cnssNumber: e.cnssNumber,
    baseSalary: String(e.baseSalary),
    currency: e.currency,
    mobileMoneyProvider: e.mobileMoneyProvider ?? '',
    mobileMoneyNumber: e.mobileMoneyNumber ?? '',
    whatsappNumber: e.whatsappNumber ?? '',
    maritalStatus: (e.maritalStatus as MaritalStatus) || 'Célibataire',
    numberOfDependents: String(e.numberOfDependents),
    hireDate: e.hireDate,
    status: e.status,
  }
}

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<EmployeeForm>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'baseSalary' | 'mobileMoneyNumber' | 'whatsappNumber', string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [isActing, setIsActing] = useState(false)

  const fetchEmployees = useCallback(async () => {
    const data = await api.get<BackendEmployee[]>('/employees')
    return (Array.isArray(data) ? data : []).map(mapBackendToEmployee)
  }, [])
  const { data, error, isLoading, reload } = useApiResource(fetchEmployees)
  const employees = data ?? []

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredEmployees = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName} ${emp.position} ${emp.cnssNumber}`.toLowerCase().includes(normalizedSearch)
  )

  const openCreate = () => {
    setEditingEmployee(null)
    setFormData(emptyForm())
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const openEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData(formFromEmployee(employee))
    setFieldErrors({})
    setIsModalOpen(true)
  }

  const update = <K extends keyof EmployeeForm>(key: K, value: EmployeeForm[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors: typeof fieldErrors = {}
    const salary = parseFloat(formData.baseSalary)
    if (Number.isNaN(salary) || salary < 0) errors.baseSalary = 'Saisissez un salaire valide (nombre positif).'
    if (formData.mobileMoneyNumber && !PHONE_PATTERN.test(formData.mobileMoneyNumber.trim()))
      errors.mobileMoneyNumber = 'Numéro invalide. Exemple : +243 970 000 000'
    if (formData.whatsappNumber && !PHONE_PATTERN.test(formData.whatsappNumber.trim()))
      errors.whatsappNumber = 'Numéro invalide. Exemple : +243 970 000 000'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = mapEmployeeToBackend({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      position: formData.position.trim(),
      cnssNumber: formData.cnssNumber.trim(),
      baseSalary: salary,
      currency: formData.currency,
      mobileMoneyProvider: formData.mobileMoneyProvider || undefined,
      mobileMoneyNumber: formData.mobileMoneyNumber.trim() || undefined,
      whatsappNumber: formData.whatsappNumber.trim() || undefined,
      maritalStatus: formData.maritalStatus,
      numberOfDependents: parseInt(formData.numberOfDependents, 10) || 0,
      hireDate: formData.hireDate,
      status: formData.status,
    })

    setIsSubmitting(true)
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, payload)
        toast.success('Employé modifié')
      } else {
        await api.post('/employees', payload)
        toast.success('Employé créé')
      }
      setIsModalOpen(false)
      reload()
    } catch (err) {
      toast.error(errorMessage(err, "Erreur lors de l'enregistrement"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const reactivate = async (employee: Employee) => {
    try {
      await api.put(`/employees/${employee.id}`, { status: 'active' })
      toast.success(`${employee.firstName} ${employee.lastName} est de nouveau actif`)
      reload()
    } catch (err) {
      toast.error(errorMessage(err, 'Erreur lors de la réactivation'))
    }
  }

  const confirmPendingAction = async () => {
    if (!pendingAction) return
    setIsActing(true)
    try {
      if (pendingAction.kind === 'deactivate') {
        // Le backend désactive (suppression douce) : l'historique de paie est conservé.
        await api.delete(`/employees/${pendingAction.employee.id}`)
        toast.success('Employé désactivé')
      } else {
        await api.delete(`/employees/${pendingAction.employee.id}`, { params: { permanent: 'true' } })
        toast.success('Employé supprimé définitivement')
      }
      setPendingAction(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err, "Erreur lors de l'opération"))
    } finally {
      setIsActing(false)
    }
  }

  const pendingName = pendingAction ? `${pendingAction.employee.firstName} ${pendingAction.employee.lastName}` : ''

  return (
    <>
      <PageHeader
        title="Employés"
        description={isLoading && !data ? 'Chargement…' : `${employees.length} employé(s) enregistré(s)`}
        actions={
          <>
            <Button variant="outline" onClick={reload} disabled={isLoading} aria-label="Actualiser la liste">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </Button>
            <Button onClick={openCreate} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter un employé
            </Button>
          </>
        }
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <div className="mb-6">
        <Input
          type="search"
          label="Rechercher un employé"
          placeholder="Nom, poste ou numéro CNSS"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-5 w-5" />}
        />
      </div>

      {isLoading && !data && (
        <div role="status" aria-label="Chargement de la liste" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-5/6 rounded bg-gray-200" />
                <div className="h-3 w-2/3 rounded bg-gray-200" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {data && filteredEmployees.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => {
            const fullName = `${employee.firstName} ${employee.lastName}`
            const active = employee.status === 'Actif'
            return (
              <li key={employee.id}>
                <Card className="h-full p-4 sm:p-5">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
                        aria-hidden="true"
                      >
                        <Users className="h-5 w-5 text-blue-800" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold leading-snug text-gray-900">{fullName}</h2>
                        <p className="truncate text-sm text-gray-700">{employee.position || 'Poste non défini'}</p>
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {employee.status}
                    </span>
                  </div>

                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 py-1">
                      <dt className="text-gray-700">Salaire de base</dt>
                      <dd className="font-semibold text-gray-900">{formatMoney(employee.baseSalary, employee.currency)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 py-1">
                      <dt className="text-gray-700">N° CNSS</dt>
                      <dd className="font-mono text-gray-900">{employee.cnssNumber || '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 py-1">
                      <dt className="text-gray-700">Embauche</dt>
                      <dd className="text-gray-900">{formatDate(employee.hireDate)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2 py-1">
                      <dt className="text-gray-700">Mobile Money</dt>
                      <dd className="flex items-center gap-1 text-gray-900">
                        <Phone className="h-3.5 w-3.5 text-gray-600" aria-hidden="true" />
                        {employee.mobileMoneyNumber
                          ? `${employee.mobileMoneyProvider ? employee.mobileMoneyProvider + ' · ' : ''}${employee.mobileMoneyNumber}`
                          : 'Non renseigné'}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(employee)}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Modifier
                      <span className="sr-only"> {fullName}</span>
                    </Button>
                    {active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPendingAction({ kind: 'deactivate', employee })}
                      >
                        <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                        Désactiver
                        <span className="sr-only"> {fullName}</span>
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => reactivate(employee)}>
                          <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Réactiver
                          <span className="sr-only"> {fullName}</span>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setPendingAction({ kind: 'delete', employee })}
                          aria-label={`Supprimer définitivement ${fullName}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      {data && filteredEmployees.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 py-16 text-center">
          <Users className="mx-auto mb-4 h-16 w-16 text-gray-400" aria-hidden="true" />
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            {searchTerm ? 'Aucun résultat' : 'Aucun employé enregistré'}
          </h2>
          <p className="mx-auto mb-6 max-w-sm text-sm text-gray-700">
            {searchTerm
              ? `Aucun employé ne correspond à « ${searchTerm} ».`
              : 'Ajoutez votre premier salarié pour démarrer la gestion de la paie.'}
          </p>
          {!searchTerm && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter un employé
            </Button>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingEmployee ? "Modifier l'employé" : 'Ajouter un employé'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Prénom" autoComplete="off" value={formData.firstName} onChange={(e) => update('firstName', e.target.value)} required />
            <Input label="Nom" autoComplete="off" value={formData.lastName} onChange={(e) => update('lastName', e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Poste / fonction"
              placeholder="Ex. : enseignant, comptable"
              value={formData.position}
              onChange={(e) => update('position', e.target.value)}
              required
            />
            <Input
              label="Numéro d'immatriculation CNSS"
              value={formData.cnssNumber}
              onChange={(e) => update('cnssNumber', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input
                  label="Salaire de base"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={formData.baseSalary}
                  onChange={(e) => update('baseSalary', e.target.value)}
                  error={fieldErrors.baseSalary}
                  required
                />
              </div>
              <Select label="Devise" value={formData.currency} onChange={(e) => update('currency', e.target.value as Currency)}>
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Opérateur Mobile Money"
                value={formData.mobileMoneyProvider}
                onChange={(e) => update('mobileMoneyProvider', e.target.value as MobileMoneyProvider | '')}
              >
                <option value="">Aucun</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Orange Money">Orange Money</option>
                <option value="Airtel Money">Airtel Money</option>
              </Select>
              <Input
                label="N° Mobile Money"
                type="tel"
                autoComplete="off"
                placeholder="+243 …"
                value={formData.mobileMoneyNumber}
                onChange={(e) => update('mobileMoneyNumber', e.target.value)}
                error={fieldErrors.mobileMoneyNumber}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Numéro WhatsApp"
              type="tel"
              autoComplete="off"
              placeholder="+243 …"
              value={formData.whatsappNumber}
              onChange={(e) => update('whatsappNumber', e.target.value)}
              error={fieldErrors.whatsappNumber}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select label="État civil" value={formData.maritalStatus} onChange={(e) => update('maritalStatus', e.target.value as MaritalStatus)}>
                <option value="Célibataire">Célibataire</option>
                <option value="Marié(e)">Marié(e)</option>
                <option value="Divorcé(e)">Divorcé(e)</option>
                <option value="Veuf/Veuve">Veuf/Veuve</option>
              </Select>
              <Input
                label="Enfants à charge"
                type="number"
                inputMode="numeric"
                min="0"
                max="20"
                value={formData.numberOfDependents}
                onChange={(e) => update('numberOfDependents', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Date d'embauche" type="date" value={formData.hireDate} onChange={(e) => update('hireDate', e.target.value)} required />
            <Select label="Statut" value={formData.status} onChange={(e) => update('status', e.target.value as 'Actif' | 'Inactif')}>
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
            </Select>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" disabled={isSubmitting} onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" loading={isSubmitting}>
              {isSubmitting ? 'Enregistrement…' : editingEmployee ? "Enregistrer les modifications" : "Ajouter l'employé"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={pendingAction?.kind === 'delete' ? 'Supprimer définitivement ?' : 'Désactiver cet employé ?'}
        confirmLabel={pendingAction?.kind === 'delete' ? 'Supprimer définitivement' : 'Désactiver'}
        variant={pendingAction?.kind === 'delete' ? 'danger' : 'primary'}
        loading={isActing}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      >
        {pendingAction?.kind === 'delete' ? (
          <p>
            Les données de <strong>{pendingName}</strong> seront effacées de manière irréversible. Cette action ne peut pas
            être annulée.
          </p>
        ) : (
          <p>
            <strong>{pendingName}</strong> ne sera plus inclus dans les prochains calculs de paie. Son historique est
            conservé et vous pourrez le réactiver à tout moment.
          </p>
        )}
      </ConfirmDialog>
    </>
  )
}

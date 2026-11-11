'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  DollarSign, 
  ArrowLeft,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { Employee, BackendEmployee, mapBackendToEmployee, mapEmployeeToBackend } from '@/types'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function EmployeesPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    cnssNumber: '',
    baseSalary: '',
    currency: 'USD' as 'USD' | 'FC',
    mobileMoneyProvider: '' as 'Airtel' | 'Vodacom' | 'Orange' | 'M-Pesa' | '',
    mobileMoneyNumber: '',
    whatsappNumber: '',
    maritalStatus: 'Célibataire' as 'Célibataire' | 'Marié(e)' | 'Divorcé(e)' | 'Veuf/Veuve',
    numberOfDependents: '0',
    hireDate: '',
    status: 'Actif' as 'Actif' | 'Inactif'
  })

  // Chargement des employés depuis l'API backend
  const fetchEmployees = useCallback(async (showToast = false) => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const data = await api.get<BackendEmployee[]>('/employees')
      const mapped = Array.isArray(data) ? data.map(mapBackendToEmployee) : []
      setEmployees(mapped)
      if (showToast) {
        toast.success(`${mapped.length} employé(s) chargé(s)`)
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Erreur lors du chargement des employés'
      setFetchError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName} ${emp.position} ${emp.cnssNumber}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const handleAddEmployee = () => {
    setEditingEmployee(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
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
      status: 'Actif'
    })
    setIsModalOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position,
      cnssNumber: employee.cnssNumber,
      baseSalary: employee.baseSalary.toString(),
      currency: employee.currency === 'FC' ? 'FC' : 'USD',
      mobileMoneyProvider: (employee.mobileMoneyProvider as any) || '',
      mobileMoneyNumber: employee.mobileMoneyNumber || '',
      whatsappNumber: employee.whatsappNumber || '',
      maritalStatus: employee.maritalStatus as any,
      numberOfDependents: employee.numberOfDependents.toString(),
      hireDate: employee.hireDate || '',
      status: employee.status === 'Inactif' ? 'Inactif' : 'Actif'
    })
    setIsModalOpen(true)
  }

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${name} ?`)) {
      return
    }

    setDeletingId(id)
    const toastId = toast.loading('Suppression en cours...')

    try {
      await api.delete(`/employees/${id}`)
      setEmployees(prev => prev.filter(emp => emp.id !== id))
      toast.success('Employé supprimé avec succès', { id: toastId })
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression', { id: toastId })
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Le prénom et le nom sont obligatoires')
      return
    }

    if (!formData.baseSalary || isNaN(parseFloat(formData.baseSalary))) {
      toast.error('Veuillez renseigner un salaire de base valide')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading(
      editingEmployee ? 'Modification de l’employé...' : 'Création de l’employé...'
    )

    const payload = mapEmployeeToBackend({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      position: formData.position.trim(),
      cnssNumber: formData.cnssNumber.trim(),
      baseSalary: parseFloat(formData.baseSalary),
      currency: formData.currency,
      mobileMoneyProvider: formData.mobileMoneyProvider || undefined,
      mobileMoneyNumber: formData.mobileMoneyNumber.trim() || undefined,
      whatsappNumber: formData.whatsappNumber.trim() || undefined,
      maritalStatus: formData.maritalStatus,
      numberOfDependents: parseInt(formData.numberOfDependents, 10) || 0,
      hireDate: formData.hireDate,
      status: formData.status
    })

    try {
      if (editingEmployee) {
        const updatedBackend = await api.put<BackendEmployee>(
          `/employees/${editingEmployee.id}`,
          payload
        )
        const updated = mapBackendToEmployee(updatedBackend)
        setEmployees(prev =>
          prev.map(emp => (emp.id === editingEmployee.id ? updated : emp))
        )
        toast.success('Employé modifié avec succès', { id: toastId })
      } else {
        const createdBackend = await api.post<BackendEmployee>(
          '/employees',
          payload
        )
        const created = mapBackendToEmployee(createdBackend)
        setEmployees(prev => [created, ...prev])
        toast.success('Employé créé avec succès', { id: toastId })
      }

      setIsModalOpen(false)
    } catch (err: any) {
      toast.error(err?.message || 'Une erreur est survenue lors de l’enregistrement', {
        id: toastId
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Responsive */}
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
                Gestion des Employés
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                {isLoading ? 'Chargement...' : `${employees.length} employé(s) enregistré(s)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEmployees(true)}
              disabled={isLoading}
              title="Rafraîchir la liste"
              className="flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleAddEmployee} className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-1.5" />
              Ajouter Employé
            </Button>
          </div>
        </div>

        {/* Message d'erreur avec bouton réessai */}
        {fetchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{fetchError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchEmployees(true)}>
              Réessayer
            </Button>
          </div>
        )}

        {/* Recherche */}
        <div className="mb-6">
          <Input
            placeholder="Rechercher par nom, poste, matricule CNSS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5 text-gray-400" />}
          />
        </div>

        {/* État de chargement (Skeleton Cards optimisé pour smartphone) */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Liste des employés */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="p-4 sm:p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 leading-snug">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">{employee.position || 'Poste non défini'}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      employee.status === 'Actif'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {employee.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-gray-600 py-1 border-b border-gray-100">
                    <span className="text-gray-500">Salaire de base:</span>
                    <span className="font-semibold text-gray-900">
                      {employee.baseSalary.toLocaleString('fr-FR')} {employee.currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600 py-1 border-b border-gray-100">
                    <span className="text-gray-500">CNSS:</span>
                    <span className="font-mono text-gray-800">{employee.cnssNumber || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600 py-1">
                    <span className="text-gray-500">Mobile Money:</span>
                    <span className="flex items-center gap-1 text-gray-800">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {employee.mobileMoneyNumber || 'Non renseigné'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleEditEmployee(employee)}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={deletingId === employee.id}
                    onClick={() => handleDeleteEmployee(employee.id, `${employee.firstName} ${employee.lastName}`)}
                    className="px-3"
                  >
                    {deletingId === employee.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* État vide */}
        {!isLoading && filteredEmployees.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {searchTerm ? 'Aucun résultat trouvé' : 'Aucun employé enregistré'}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              {searchTerm
                ? `Aucun employé ne correspond à votre recherche "${searchTerm}".`
                : 'Ajoutez votre premier salarié pour démarrer la gestion de paie automatique.'}
            </p>
            {!searchTerm && (
              <Button onClick={handleAddEmployee}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un employé
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modal Ajout / Modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingEmployee ? 'Modifier l’Employé' : 'Ajouter un Employé'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prénom"
              placeholder="Ex: Jean"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Nom"
              placeholder="Ex: Mutombo"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Poste / Fonction"
              placeholder="Ex: Enseignant, Comptable..."
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              required
            />
            <Input
              label="Numéro d’immatriculation CNSS"
              placeholder="Ex: CNSS-001"
              value={formData.cnssNumber}
              onChange={(e) => setFormData({ ...formData, cnssNumber: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input
                  label="Salaire de base"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 500"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-1">
                <Select
                  label="Devise"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'USD' | 'FC' })}
                >
                  <option value="USD">USD ($)</option>
                  <option value="FC">CDF (FC)</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Opérateur Mobile Money"
                value={formData.mobileMoneyProvider}
                onChange={(e) => setFormData({ ...formData, mobileMoneyProvider: e.target.value as any })}
              >
                <option value="">Sélectionner</option>
                <option value="M-Pesa">M-Pesa (Vodacom)</option>
                <option value="Orange">Orange Money</option>
                <option value="Airtel">Airtel Money</option>
              </Select>
              <Input
                label="N° Mobile Money"
                placeholder="+243..."
                value={formData.mobileMoneyNumber}
                onChange={(e) => setFormData({ ...formData, mobileMoneyNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Numéro WhatsApp"
              placeholder="+243..."
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="État civil"
                value={formData.maritalStatus}
                onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as any })}
              >
                <option value="Célibataire">Célibataire</option>
                <option value="Marié(e)">Marié(e)</option>
                <option value="Divorcé(e)">Divorcé(e)</option>
                <option value="Veuf/Veuve">Veuf/Veuve</option>
              </Select>
              <Input
                label="Enfants à charge"
                type="number"
                min="0"
                max="20"
                value={formData.numberOfDependents}
                onChange={(e) => setFormData({ ...formData, numberOfDependents: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date d'embauche"
              type="date"
              value={formData.hireDate}
              onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              required
            />
            <Select
              label="Statut"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : editingEmployee ? (
                'Modifier l’employé'
              ) : (
                'Ajouter l’employé'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

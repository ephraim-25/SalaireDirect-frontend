'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  ArrowLeft, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock,
  Loader2,
  Filter,
  FileText
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

interface PayrollPeriod {
  id: string
  month: number
  year: number
  status: 'draft' | 'validated' | 'closed'
  totalGrossSalary: number
  totalNetSalary: number
  employeeCount: number
  createdAt: string
  validatedAt?: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await api.get<PayrollPeriod[]>('/payrolls/history', {
        params: { month: selectedMonth, year: selectedYear }
      })
      setPeriods(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading history:', error)
      setPeriods([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getMonthName = (month: number) => {
    return new Date(2024, month - 1).toLocaleDateString('fr-FR', { month: 'long' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Validé
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3" />
            Clôturé
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Brouillon
          </span>
        )
    }
  }

  const handleViewPeriod = (period: PayrollPeriod) => {
    router.push(`/calculation?month=${period.month}&year=${period.year}`)
  }

  const handleDownloadPeriod = async (period: PayrollPeriod) => {
    const toastId = toast.loading('Téléchargement du récapitulatif...')
    try {
      const monthName = getMonthName(period.month)
      const filename = `recapitulatif-paie-${monthName}-${period.year}.pdf`
      await api.download(`/pdf/payroll-summary/${period.id}`, filename)
      toast.success('Récapitulatif téléchargé', { id: toastId })
    } catch (err: any) {
      toast.error(err?.message || 'Erreur de téléchargement', { id: toastId })
    }
  }

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
                Historique des Paies
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Consultez et téléchargez les bulletins des périodes passées
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrer par :</span>
            </div>
            <div className="flex-1 w-full">
              <Select
                label="Mois"
                value={selectedMonth.toString()}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
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
            <div className="flex-1 w-full">
              <Select
                label="Année"
                value={selectedYear.toString()}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Content */}
        {isLoading ? (
          <Card className="text-center py-16 p-6">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Chargement de l'historique...</p>
          </Card>
        ) : periods.length === 0 ? (
          <Card className="text-center py-16 p-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aucune période trouvée
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Aucune paie n'a été enregistrée pour {getMonthName(selectedMonth)} {selectedYear}.
            </p>
            <Button onClick={() => router.push('/calculation')}>
              <FileText className="w-4 h-4 mr-2" />
              Calculer la paie
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {periods.map((period) => (
              <Card key={period.id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {getMonthName(period.month)} {period.year}
                      </h3>
                      {getStatusBadge(period.status)}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Salariés</p>
                        <p className="font-semibold text-gray-900">{period.employeeCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Masse salariale brute</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(period.totalGrossSalary)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Net à payer total</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(period.totalNetSalary)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date de création</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(period.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPeriod(period)}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir détails
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadPeriod(period)}
                      className="flex-1 sm:flex-none"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

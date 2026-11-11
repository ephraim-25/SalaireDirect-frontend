'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  LogOut,
  Menu,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Gift,
  Loader2
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { BackendEmployee, mapBackendToEmployee } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const { signOut, trialDaysRemaining, user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    activeEmployees: 0,
    totalGrossSalary: 0,
    totalCnssEmployee: 0,
    totalCnssEmployer: 0,
    totalIpr: 0,
  })

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Load employees
      const employeesData = await api.get<BackendEmployee[]>('/employees')
      const employees = Array.isArray(employeesData) ? employeesData.map(mapBackendToEmployee) : []
      const activeEmployees = employees.filter(e => e.status === 'Actif')
      
      // Load recent payroll calculations (current month)
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      
      let payrollData: any = null
      try {
        payrollData = await api.get('/payrolls/calculations', {
          params: { month: currentMonth, year: currentYear }
        })
      } catch {
        // No payroll data for current month
      }

      const totalGrossSalary = payrollData?.calculations?.reduce((sum: number, calc: any) => 
        sum + (Number(calc.grossSalary) || 0), 0) || 0
      const totalCnssEmployee = payrollData?.calculations?.reduce((sum: number, calc: any) => 
        sum + (Number(calc.cnssEmployee) || 0), 0) || 0
      const totalCnssEmployer = payrollData?.calculations?.reduce((sum: number, calc: any) => 
        sum + (Number(calc.cnssEmployer) || 0), 0) || 0
      const totalIpr = payrollData?.calculations?.reduce((sum: number, calc: any) => 
        sum + (Number(calc.ipr) || 0), 0) || 0

      setStats({
        activeEmployees: activeEmployees.length,
        totalGrossSalary,
        totalCnssEmployee,
        totalCnssEmployer,
        totalIpr,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleLogout = async () => {
    await signOut()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const recentActivities = [
    {
      id: 1,
      action: 'Nouvel employé ajouté',
      employee: 'Jean Mutombo',
      time: 'Il y a 2 heures',
      status: 'success'
    },
    {
      id: 2,
      action: 'Prime de performance',
      employee: 'Marie Nseka',
      time: 'Il y a 5 heures',
      status: 'success'
    },
    {
      id: 3,
      action: 'Absence signalée',
      employee: 'Pierre Kabongo',
      time: 'Hier',
      status: 'warning'
    },
    {
      id: 4,
      action: 'Avance sur salaire',
      employee: 'Anne Mbala',
      time: 'Il y a 2 jours',
      status: 'info'
    }
  ]

  const navItems = [
    { name: 'Tableau de bord', href: '/dashboard', icon: TrendingUp },
    { name: 'Employés', href: '/employees', icon: Users },
    { name: 'Variables du mois', href: '/variables', icon: Calendar },
    { name: 'Calcul Paie', href: '/calculation', icon: DollarSign },
    { name: 'Historique', href: '/history', icon: Clock },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">SalaireDirect</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">SalaireDirect</h1>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              ))}
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Tableau de bord
              </h2>
              <p className="text-gray-600 mt-1">
                Vue d'ensemble de la paie de {currentMonth}
              </p>
            </div>

            {/* Free Trial Banner */}
            {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Gift className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900 text-sm">Essai gratuit en cours</p>
                      <p className="text-xs text-blue-700">
                        {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''} restant{trialDaysRemaining > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success('Contactez-nous pour activer votre abonnement')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Passer à l'offre premium →
                  </button>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {isLoading ? (
                <div className="col-span-4 flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  <Card className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Employés Actifs</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeEmployees}</p>
                        <p className="text-xs text-gray-500 mt-1">Total salariés</p>
                      </div>
                      <div className="bg-blue-500 p-3 rounded-lg">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Masse Salariale</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalGrossSalary)}</p>
                        <p className="text-xs text-gray-500 mt-1">{currentMonth}</p>
                      </div>
                      <div className="bg-green-500 p-3 rounded-lg">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Cotisations CNSS</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalCnssEmployee + stats.totalCnssEmployer)}</p>
                        <p className="text-xs text-gray-500 mt-1">Salarial + Patronal</p>
                      </div>
                      <div className="bg-purple-500 p-3 rounded-lg">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">IPR Total</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalIpr)}</p>
                        <p className="text-xs text-gray-500 mt-1">Impôt sur revenu</p>
                      </div>
                      <div className="bg-orange-500 p-3 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <Card title="Actions Rapides" className="mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="primary"
                  onClick={() => router.push('/employees')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Ajouter Employé
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/variables')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Saisir Variables
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/calculation')}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Calculer Paie
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.success('Export en cours...')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Exporter Rapport
                </Button>
              </div>
            </Card>

            {/* Recent Activities */}
            <Card title="Activités Récentes">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className={`p-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-100' :
                      activity.status === 'warning' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {activity.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {activity.status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                      {activity.status === 'info' && <Clock className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.employee}</p>
                    </div>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

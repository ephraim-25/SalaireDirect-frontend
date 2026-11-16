import { type Currency, normalizeCurrency } from '@/lib/utils'

export type MobileMoneyProvider = 'M-Pesa' | 'Orange Money' | 'Airtel Money'
export type MaritalStatus = 'Célibataire' | 'Marié(e)' | 'Divorcé(e)' | 'Veuf/Veuve'

export interface Employee {
  id: string
  firstName: string
  lastName: string
  position: string
  cnssNumber: string
  baseSalary: number
  currency: Currency
  mobileMoneyProvider?: MobileMoneyProvider
  mobileMoneyNumber?: string
  whatsappNumber?: string
  maritalStatus: string
  numberOfDependents: number
  hireDate: string
  status: 'Actif' | 'Inactif'
}

export interface BackendEmployee {
  id: string
  company_id: string
  first_name: string
  last_name: string
  position?: string | null
  hire_date?: string | null
  cnss_number?: string | null
  base_salary: number
  salary_currency: 'USD' | 'CDF'
  mobile_money_number?: string | null
  mobile_money_operator?: MobileMoneyProvider | null
  whatsapp_number?: string | null
  marital_status?: string | null
  dependent_children: number
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

/** Convertit un employé backend (snake_case) en employé frontend (camelCase). */
export function mapBackendToEmployee(be: BackendEmployee): Employee {
  return {
    id: be.id,
    firstName: be.first_name,
    lastName: be.last_name,
    position: be.position || '',
    cnssNumber: be.cnss_number || '',
    baseSalary: Number(be.base_salary) || 0,
    currency: normalizeCurrency(be.salary_currency),
    mobileMoneyProvider: be.mobile_money_operator || undefined,
    mobileMoneyNumber: be.mobile_money_number || '',
    whatsappNumber: be.whatsapp_number || '',
    maritalStatus: be.marital_status || 'Célibataire',
    numberOfDependents: be.dependent_children || 0,
    hireDate: be.hire_date || '',
    status: be.status === 'active' ? 'Actif' : 'Inactif',
  }
}

/** Convertit un employé frontend en payload pour le backend NestJS. */
export function mapEmployeeToBackend(emp: Partial<Employee>): Record<string, string | number> {
  const payload: Record<string, string | number> = {
    first_name: emp.firstName ?? '',
    last_name: emp.lastName ?? '',
    position: emp.position || '',
    cnss_number: emp.cnssNumber || '',
    base_salary: Number(emp.baseSalary) || 0,
    salary_currency: normalizeCurrency(emp.currency),
    dependent_children: Number(emp.numberOfDependents) || 0,
    status: emp.status === 'Inactif' ? 'inactive' : 'active',
  }

  if (emp.hireDate) payload.hire_date = emp.hireDate
  if (emp.mobileMoneyNumber) payload.mobile_money_number = emp.mobileMoneyNumber
  if (emp.mobileMoneyProvider) payload.mobile_money_operator = emp.mobileMoneyProvider
  if (emp.whatsappNumber) payload.whatsapp_number = emp.whatsappNumber
  if (emp.maritalStatus) payload.marital_status = emp.maritalStatus

  return payload
}

/* ------------------------------ Variables du mois ------------------------------ */

export type VariableType = 'prime' | 'heures_sup' | 'absence' | 'avance'

export interface BackendVariable {
  id: string
  employee_id: string
  type: VariableType
  amount?: number | string | null
  quantity?: number | string | null
  description: string
  month: number | string
  year: number | string
  created_at?: string
}

export interface MonthlyVariable {
  id: string
  employeeId: string
  type: VariableType
  amount?: number
  quantity?: number
  description: string
  month: number
  year: number
}

export function mapBackendVariable(v: BackendVariable): MonthlyVariable {
  return {
    id: v.id,
    employeeId: v.employee_id,
    type: v.type,
    amount: v.amount ? Number(v.amount) : undefined,
    quantity: v.quantity ? Number(v.quantity) : undefined,
    description: v.description,
    month: Number(v.month),
    year: Number(v.year),
  }
}

/* ------------------------------------ Paie ------------------------------------- */

/** Ligne de calcul renvoyée par POST /payrolls/calculate (montants dans la devise du salarié). */
export interface PayrollCalculation {
  employeeId: string
  employeeName: string
  baseSalary: number
  currency: Currency
  primes: number
  overtime: number
  absences: number
  advances: number
  grossSalary: number
  cnssEmployee: number
  cnssEmployer: number
  ipr: number
  netSalary: number
}

export interface CalculateResponse {
  calculations: PayrollCalculation[]
  usd_cdf_rate?: number
  legal_parameters?: {
    cnss_employee_rate: number
    cnss_employer_rate: number
    effective_date?: string
  }
}

export interface SavedPayslip {
  id: string
  employee_id: string
}

export interface SaveMonthResponse {
  message: string
  payroll: { id: string; status: string }
  payslipsCount: number
  payslips: SavedPayslip[]
}

/** Bulletin tel que renvoyé par GET /payrolls (jointure payslips + employees). */
export interface PayrollPayslip {
  id: string
  employee_id: string
  base_salary: number | string
  bonuses: number | string
  overtime: number | string
  absences_deductions: number | string
  advances: number | string
  gross_salary: number | string
  cnss_employee: number | string
  cnss_employer: number | string
  ipr: number | string
  net_payable: number | string
  salary_currency: 'USD' | 'CDF'
  employees?: { first_name: string; last_name: string; position?: string | null; cnss_number?: string | null } | null
}

/** Période de paie telle que renvoyée par GET /payrolls. */
export interface PayrollPeriod {
  id: string
  month: number
  year: number
  status: 'draft' | 'validated' | 'closed' | string
  usd_cdf_rate?: number | string
  created_at?: string
  closed_at?: string | null
  payslips?: PayrollPayslip[] | null
}

export interface CurrencyTotals {
  currency: Currency
  gross: number
  net: number
  cnssEmployee: number
  cnssEmployer: number
  ipr: number
  count: number
}

/** Additionne par devise : on ne mélange jamais USD et CDF dans un même total. */
export function totalsByCurrency(
  rows: Array<{
    currency: Currency
    gross: number
    net: number
    cnssEmployee: number
    cnssEmployer: number
    ipr: number
  }>
): CurrencyTotals[] {
  const map = new Map<Currency, CurrencyTotals>()
  for (const row of rows) {
    const current =
      map.get(row.currency) ??
      { currency: row.currency, gross: 0, net: 0, cnssEmployee: 0, cnssEmployer: 0, ipr: 0, count: 0 }
    current.gross += row.gross
    current.net += row.net
    current.cnssEmployee += row.cnssEmployee
    current.cnssEmployer += row.cnssEmployer
    current.ipr += row.ipr
    current.count += 1
    map.set(row.currency, current)
  }
  return Array.from(map.values()).sort((a, b) => a.currency.localeCompare(b.currency))
}

export function payslipToTotalsRow(p: PayrollPayslip) {
  return {
    currency: normalizeCurrency(p.salary_currency),
    gross: Number(p.gross_salary) || 0,
    net: Number(p.net_payable) || 0,
    cnssEmployee: Number(p.cnss_employee) || 0,
    cnssEmployer: Number(p.cnss_employer) || 0,
    ipr: Number(p.ipr) || 0,
  }
}

export function isPeriodValidated(status: string): boolean {
  return status === 'closed' || status === 'validated'
}

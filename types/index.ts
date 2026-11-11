export interface Employee {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  position: string
  cnssNumber: string
  baseSalary: number
  currency: 'USD' | 'CDF' | 'FC'
  mobileMoneyProvider?: 'Airtel' | 'Vodacom' | 'Orange' | 'M-Pesa' | 'Airtel Money' | 'Orange Money'
  mobileMoneyNumber?: string
  whatsappNumber?: string
  maritalStatus: 'Célibataire' | 'Marié(e)' | 'Divorcé(e)' | 'Veuf/Veuve' | string
  numberOfDependents: number
  hireDate: string
  status: 'Actif' | 'Inactif' | 'active' | 'inactive'
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
  mobile_money_operator?: 'M-Pesa' | 'Orange Money' | 'Airtel Money' | null
  whatsapp_number?: string | null
  marital_status?: string | null
  dependent_children: number
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

/** Convertit un employé backend (Supabase snake_case) en format frontend (camelCase) */
export function mapBackendToEmployee(be: BackendEmployee): Employee {
  const opMap: Record<string, 'Airtel' | 'Vodacom' | 'Orange' | 'M-Pesa'> = {
    'Airtel Money': 'Airtel',
    'Orange Money': 'Orange',
    'M-Pesa': 'M-Pesa',
  };

  return {
    id: be.id,
    firstName: be.first_name,
    lastName: be.last_name,
    email: '',
    phone: be.mobile_money_number || be.whatsapp_number || '',
    position: be.position || '',
    cnssNumber: be.cnss_number || '',
    baseSalary: Number(be.base_salary) || 0,
    currency: be.salary_currency === 'CDF' ? 'FC' : 'USD',
    mobileMoneyProvider: be.mobile_money_operator ? opMap[be.mobile_money_operator] || 'M-Pesa' : undefined,
    mobileMoneyNumber: be.mobile_money_number || '',
    whatsappNumber: be.whatsapp_number || '',
    maritalStatus: be.marital_status || 'Célibataire',
    numberOfDependents: be.dependent_children || 0,
    hireDate: be.hire_date || '',
    status: be.status === 'active' ? 'Actif' : 'Inactif',
  };
}

/** Convertit un employé frontend en payload DTO pour le backend NestJS */
export function mapEmployeeToBackend(emp: Partial<Employee>): Record<string, any> {
  const opMap: Record<string, 'Airtel Money' | 'Orange Money' | 'M-Pesa'> = {
    'Airtel': 'Airtel Money',
    'Orange': 'Orange Money',
    'M-Pesa': 'M-Pesa',
    'Vodacom': 'M-Pesa',
  };

  const payload: Record<string, any> = {
    first_name: emp.firstName,
    last_name: emp.lastName,
    position: emp.position || '',
    cnss_number: emp.cnssNumber || '',
    base_salary: Number(emp.baseSalary) || 0,
    salary_currency: emp.currency === 'FC' ? 'CDF' : 'USD',
    dependent_children: Number(emp.numberOfDependents) || 0,
    status: emp.status === 'Inactif' ? 'inactive' : 'active',
  };

  if (emp.hireDate) payload.hire_date = emp.hireDate;
  if (emp.mobileMoneyNumber) payload.mobile_money_number = emp.mobileMoneyNumber;
  if (emp.mobileMoneyProvider) payload.mobile_money_operator = opMap[emp.mobileMoneyProvider] || 'M-Pesa';
  if (emp.whatsappNumber) payload.whatsapp_number = emp.whatsappNumber;
  if (emp.maritalStatus) payload.marital_status = emp.maritalStatus;

  return payload;
}

export interface MonthlyVariable {
  id: string
  employeeId: string
  employee_id?: string
  type: 'prime' | 'heures_sup' | 'absence' | 'avance'
  amount?: number
  quantity?: number
  description: string
  month: string | number
  year: number
  created_at?: string
}

export interface PayrollCalculation {
  employeeId: string
  employeeName: string
  baseSalary: number
  currency: 'USD' | 'FC' | 'CDF'
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

export interface Company {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  type?: 'École' | 'ONG' | 'PME' | 'Autre'
  registrationNumber?: string
  taxId?: string
}

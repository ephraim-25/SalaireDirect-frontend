import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: 'USD' | 'FC'): string {
  if (currency === 'USD') {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
  }
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FC`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export function calculateCNSS(salary: number): number {
  // CNSS rate: 8.5% employee, 12.5% employer
  return salary * 0.085
}

export function calculateIPR(salary: number): number {
  // Simplified IPR calculation for RD Congo
  // This is a basic implementation - actual rates depend on tax brackets
  if (salary <= 0) return 0
  if (salary <= 100) return 0
  if (salary <= 500) return salary * 0.15
  if (salary <= 1000) return salary * 0.20
  if (salary <= 2000) return salary * 0.25
  return salary * 0.30
}

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* -------------------------------------------------------------------------- */
/*  Formats européens (fr-FR) : 1 234,56 — 15/11/2026 — codes ISO 4217        */
/* -------------------------------------------------------------------------- */

export type Currency = 'USD' | 'CDF'

const LOCALE = 'fr-FR'

/** Normalise les anciennes valeurs ('FC') vers le code ISO 4217 ('CDF'). */
export function normalizeCurrency(value?: string | null): Currency {
  return value === 'CDF' || value === 'FC' ? 'CDF' : 'USD'
}

/** « 1 234,50 USD » / « 2 800 000 CDF » — code ISO, séparateurs français. */
export function formatMoney(amount: number, currency: Currency | string = 'USD'): string {
  const code = normalizeCurrency(currency)
  const digits = code === 'CDF' ? 0 : 2
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: code,
    currencyDisplay: 'code',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(amount) ? amount : 0)
}

/** Nombre au format français (sans devise). */
export function formatNumber(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatPercent(rate: number, fractionDigits = 1): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(rate)
}

/** « 15/11/2026 ». Les dates seules (AAAA-MM-JJ) ne sont pas décalées par le fuseau. */
export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: value.length === 10 ? 'UTC' : undefined,
  }).format(date)
}

export function monthName(month: number): string {
  return new Intl.DateTimeFormat(LOCALE, { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2000, month - 1, 1))
  )
}

export function formatPeriod(month: number, year: number): string {
  return `${monthName(month)} ${year}`
}

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const label = monthName(i + 1)
  return { value: String(i + 1), label: label.charAt(0).toUpperCase() + label.slice(1) }
})

/** Années proposées dans les sélecteurs : N-3 … N+1 (jamais figées dans le code). */
export function yearOptions(): { value: string; label: string }[] {
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => {
    const year = String(current - 3 + i)
    return { value: year, label: year }
  })
}

/* -------------------------------------------------------------------------- */
/*  Export CSV compatible Excel européen (séparateur « ; », BOM UTF-8)         */
/* -------------------------------------------------------------------------- */

type CsvCell = string | number | null | undefined

function escapeCsvCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return ''
  if (typeof cell === 'number') return String(cell).replace('.', ',')
  // Neutralise l'injection de formules (=, +, -, @) à l'ouverture dans Excel.
  const safe = /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell
  return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]): void {
  const content = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Ne laisse passer qu'un chemin interne (anti « open redirect »). */
export function safeRedirectPath(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback
  }
  return value
}

export function errorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

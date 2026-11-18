import { AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <p className="text-sm">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  )
}

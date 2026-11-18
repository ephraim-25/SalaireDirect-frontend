'use client'

import { ReactNode } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Remplace window.confirm() : accessible, stylé et cohérent avec le reste de l'interface. */
export default function ConfirmDialog({
  isOpen,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => !loading && onCancel()} title={title} size="sm">
      <div className="text-sm text-gray-700">{children}</div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

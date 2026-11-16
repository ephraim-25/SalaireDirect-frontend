'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthShell from '@/components/auth/AuthShell'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { MIN_PASSWORD_LENGTH, translateAuthError } from '@/lib/authErrors'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { updatePassword, user, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: typeof errors = {}
    if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
    }
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Les mots de passe ne correspondent pas.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsLoading(true)
    try {
      await updatePassword(password)
      toast.success('Mot de passe mis à jour')
      router.push('/dashboard')
    } catch (error) {
      toast.error(translateAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell title="Nouveau mot de passe" subtitle="Choisissez un mot de passe sécurisé" icon={<Lock className="h-8 w-8" />}>
      {!loading && !user ? (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Ce lien est invalide ou a expiré.{' '}
          <Link href="/auth/forgot-password" className="font-medium underline">
            Demander un nouveau lien
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="password"
            label="Nouveau mot de passe"
            autoComplete="new-password"
            hint={`Au moins ${MIN_PASSWORD_LENGTH} caractères.`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
            minLength={MIN_PASSWORD_LENGTH}
          />
          <Input
            type="password"
            label="Confirmer le mot de passe"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            required
          />
          <Button type="submit" className="w-full" loading={isLoading}>
            Enregistrer le mot de passe
          </Button>
        </form>
      )}
    </AuthShell>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { KeyRound, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthShell from '@/components/auth/AuthShell'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { translateAuthError } from '@/lib/authErrors'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (error) {
      toast.error(translateAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Recevez un lien pour en choisir un nouveau"
      icon={<KeyRound className="h-8 w-8" />}
      footer={
        <Link href="/auth/login" className="font-medium text-blue-800 underline hover:text-blue-900">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Si un compte existe pour <strong>{email}</strong>, un e-mail contenant un lien de réinitialisation vient
          d&apos;être envoyé.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="email"
            label="Adresse e-mail"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<Mail className="h-5 w-5" />}
          />
          <Button type="submit" className="w-full" loading={isLoading}>
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthShell>
  )
}

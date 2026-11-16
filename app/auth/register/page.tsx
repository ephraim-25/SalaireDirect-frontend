'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Building2, CheckCircle, Lock, Mail, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthShell from '@/components/auth/AuthShell'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { MIN_PASSWORD_LENGTH, translateAuthError } from '@/lib/authErrors'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors: typeof errors = {}
    if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Les mots de passe ne correspondent pas.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsLoading(true)
    try {
      const { needsEmailConfirmation } = await signUp(email.trim(), password, companyName.trim())
      if (needsEmailConfirmation) {
        setConfirmationSentTo(email.trim())
      } else {
        toast.success('Compte créé. Votre essai gratuit de 7 jours est activé.')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error(translateAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  if (confirmationSentTo) {
    return (
      <AuthShell
        title="Vérifiez votre e-mail"
        subtitle="Une dernière étape avant de commencer"
        icon={<MailCheck className="h-8 w-8" />}
        footer={
          <Link href="/auth/login" className="font-medium text-blue-800 underline hover:text-blue-900">
            Retour à la connexion
          </Link>
        }
      >
        <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Nous avons envoyé un lien de confirmation à <strong>{confirmationSentTo}</strong>. Cliquez sur ce lien pour
          activer votre compte, puis connectez-vous. Pensez à vérifier vos courriers indésirables.
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Créer votre compte"
      subtitle="Essai gratuit de 7 jours, sans carte bancaire"
      icon={<Building2 className="h-8 w-8" />}
      footer={
        <p>
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="font-medium text-blue-800 underline hover:text-blue-900">
            Se connecter
          </Link>
        </p>
      }
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700" aria-hidden="true" />
        <p className="text-sm text-blue-900">
          Accédez à toutes les fonctionnalités pendant 7 jours, sans engagement.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="text"
          label="Nom de l'entreprise"
          placeholder="Votre entreprise SARL"
          autoComplete="organization"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          icon={<Building2 className="h-5 w-5" />}
        />

        <Input
          type="email"
          label="Adresse e-mail professionnelle"
          placeholder="contact@entreprise.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={<Mail className="h-5 w-5" />}
        />

        <Input
          type="password"
          label="Mot de passe"
          autoComplete="new-password"
          hint={`Au moins ${MIN_PASSWORD_LENGTH} caractères.`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
          minLength={MIN_PASSWORD_LENGTH}
          icon={<Lock className="h-5 w-5" />}
        />

        <Input
          type="password"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          required
          icon={<Lock className="h-5 w-5" />}
        />

        {/* Consentement explicite, non pré-coché (RGPD) */}
        <label className="flex items-start gap-3 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            required
            className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-gray-500 text-blue-700 focus:ring-blue-700"
          />
          <span>
            J&apos;ai lu et j&apos;accepte les{' '}
            <Link href="/legal/cgu" target="_blank" className="font-medium text-blue-800 underline">
              conditions d&apos;utilisation
            </Link>{' '}
            et la{' '}
            <Link href="/legal/confidentialite" target="_blank" className="font-medium text-blue-800 underline">
              politique de confidentialité
            </Link>
            .
          </span>
        </label>

        <Button type="submit" className="w-full" loading={isLoading} disabled={!acceptedTerms}>
          {isLoading ? (
            'Création en cours…'
          ) : (
            <>
              Démarrer l&apos;essai gratuit
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  )
}

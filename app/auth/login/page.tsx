'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthShell from '@/components/auth/AuthShell'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { translateAuthError } from '@/lib/authErrors'
import { safeRedirectPath } from '@/lib/utils'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirect'))
  const { signIn, user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Une personne déjà connectée n'a pas à revoir le formulaire.
  useEffect(() => {
    if (!loading && user) router.replace(redirectTo)
  }, [loading, user, router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signIn(email.trim(), password)
      toast.success('Connexion réussie')
      router.push(redirectTo)
    } catch (error) {
      toast.error(translateAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Connexion"
      subtitle="Accédez à votre espace de paie"
      icon={<Lock className="h-8 w-8" />}
      footer={
        <p>
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="font-medium text-blue-800 underline hover:text-blue-900">
            Créer un compte
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="email"
          label="Adresse e-mail"
          placeholder="vous@entreprise.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={<Mail className="h-5 w-5" />}
        />

        <Input
          type="password"
          label="Mot de passe"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          icon={<Lock className="h-5 w-5" />}
        />

        <div className="text-right text-sm">
          <Link href="/auth/forgot-password" className="font-medium text-blue-800 underline hover:text-blue-900">
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={isLoading}>
          {isLoading ? (
            'Connexion en cours…'
          ) : (
            <>
              Se connecter
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

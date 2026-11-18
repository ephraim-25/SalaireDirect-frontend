/** Traduit les messages d'erreur Supabase Auth (en anglais) en français. */
export function translateAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  const lower = message.toLowerCase()

  if (lower.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.'
  if (lower.includes('email not confirmed')) return "Votre e-mail n'a pas encore été confirmé. Consultez votre boîte de réception."
  if (lower.includes('user already registered')) return 'Un compte existe déjà avec cet e-mail. Connectez-vous ou réinitialisez votre mot de passe.'
  if (lower.includes('password should be at least')) return 'Le mot de passe est trop court.'
  if (lower.includes('rate limit') || lower.includes('too many')) return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
  if (lower.includes('same password') || lower.includes('different from the old password'))
    return "Le nouveau mot de passe doit être différent de l'ancien."
  if (lower.includes('failed to fetch') || lower.includes('network')) return 'Connexion impossible. Vérifiez votre accès internet.'

  return message || 'Une erreur est survenue. Veuillez réessayer.'
}

export const MIN_PASSWORD_LENGTH = 8

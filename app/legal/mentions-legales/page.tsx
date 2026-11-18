import type { Metadata } from 'next'
import LegalPage, { TODO } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'Mentions légales' }

export default function LegalNoticePage() {
  return (
    <LegalPage title="Mentions légales" updatedAt="15/11/2026">
      <p>
        <strong>Document à compléter par l&apos;éditeur avant publication.</strong>
      </p>

      <h2>Éditeur du site</h2>
      <ul>
        <li>Raison sociale : <TODO>nom de la société</TODO></li>
        <li>Forme juridique et capital : <TODO>forme, capital</TODO></li>
        <li>Adresse du siège : <TODO>adresse</TODO></li>
        <li>Numéro d&apos;immatriculation (RCCM / NIF) : <TODO>numéros</TODO></li>
        <li>Directeur de la publication : <TODO>nom</TODO></li>
        <li>Contact : <TODO>e-mail et téléphone</TODO></li>
      </ul>

      <h2>Hébergement</h2>
      <ul>
        <li>Interface web : Vercel Inc.</li>
        <li>Serveur d&apos;application : Render Services, Inc.</li>
        <li>Base de données et authentification : Supabase, Inc.</li>
      </ul>
    </LegalPage>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { TODO } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: "Conditions d'utilisation" }

export default function TermsPage() {
  return (
    <LegalPage title="Conditions générales d'utilisation" updatedAt="15/11/2026">
      <p>
        <strong>Document à faire relire par un juriste avant publication.</strong> Les passages signalés comme{' '}
        <TODO>à compléter</TODO> doivent être renseignés par l&apos;éditeur du service.
      </p>

      <h2>1. Objet</h2>
      <p>
        SalaireDirect est un service en ligne d&apos;aide à la gestion de la paie. Les présentes conditions encadrent son
        utilisation par les entreprises, écoles et organisations qui s&apos;y inscrivent.
      </p>

      <h2>2. Essai gratuit et abonnement</h2>
      <p>
        Un essai gratuit de 7 jours est proposé à la création du compte, sans carte bancaire. Les conditions
        tarifaires après l&apos;essai sont : <TODO>tarifs, périodicité, moyens de paiement</TODO>.
      </p>

      <h2>3. Responsabilité de l&apos;utilisateur</h2>
      <p>
        Les calculs fournis sont une aide. L&apos;utilisateur reste responsable de l&apos;exactitude des données saisies
        et de la vérification des montants avant tout paiement ou déclaration auprès des administrations compétentes.
      </p>

      <h2>4. Disponibilité</h2>
      <p>
        L&apos;éditeur met en œuvre les moyens raisonnables pour assurer l&apos;accès au service, sans garantie
        d&apos;absence d&apos;interruption.
      </p>

      <h2>5. Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{' '}
        <Link href="/legal/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>6. Résiliation</h2>
      <p>
        L&apos;utilisateur peut cesser d&apos;utiliser le service à tout moment : <TODO>procédure de suppression du compte</TODO>.
      </p>

      <h2>7. Droit applicable</h2>
      <p>
        Droit applicable et juridiction compétente : <TODO>à préciser</TODO>.
      </p>
    </LegalPage>
  )
}

import type { Metadata } from 'next'
import LegalPage, { TODO } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'Politique de confidentialité' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de confidentialité" updatedAt="15/11/2026">
      <p>
        Cette page explique quelles données personnelles SalaireDirect traite, pourquoi, et quels sont vos droits. Elle
        est rédigée selon les principes du Règlement général sur la protection des données (RGPD).
      </p>
      <p>
        <strong>Document à faire relire par un juriste avant publication.</strong> Les passages signalés comme{' '}
        <TODO>à compléter</TODO> doivent être renseignés par l&apos;éditeur du service.
      </p>

      <h2>1. Qui est responsable du traitement ?</h2>
      <p>
        Pour les données de votre compte (e-mail, nom de l&apos;entreprise), le responsable du traitement est{' '}
        <TODO>raison sociale, forme juridique, adresse du siège</TODO>. Contact :{' '}
        <TODO>adresse e-mail de contact / délégué à la protection des données</TODO>.
      </p>
      <p>
        Pour les données de vos salariés que vous saisissez dans l&apos;application (identité, salaire, numéro CNSS,
        numéro Mobile Money, nombre d&apos;enfants à charge), <strong>vous restez responsable du traitement</strong> et
        SalaireDirect agit en qualité de sous-traitant, uniquement sur vos instructions.
      </p>

      <h2>2. Données traitées et finalités</h2>
      <ul>
        <li>Données de compte : création et sécurisation de l&apos;accès au service (exécution du contrat).</li>
        <li>Données de paie de vos salariés : calcul des salaires, bulletins et récapitulatifs (exécution du contrat).</li>
        <li>Données techniques de connexion : sécurité et prévention des abus (intérêt légitime).</li>
      </ul>

      <h2>3. Destinataires et sous-traitants</h2>
      <p>Les données sont hébergées et traitées par les prestataires techniques suivants :</p>
      <ul>
        <li>Supabase (authentification et base de données) — région d&apos;hébergement : <TODO>région</TODO></li>
        <li>Render (hébergement du serveur d&apos;application) — région : <TODO>région</TODO></li>
        <li>Vercel (hébergement de l&apos;interface web) — région : <TODO>région</TODO></li>
      </ul>
      <p>
        Transferts hors Union européenne et garanties applicables : <TODO>clauses contractuelles types, etc.</TODO>
      </p>

      <h2>4. Durée de conservation</h2>
      <p>
        Les données sont conservées pendant la durée du contrat, puis <TODO>durée, ex. 12 mois</TODO> après sa fin,
        sauf obligation légale de conservation plus longue (documents de paie).
      </p>

      <h2>5. Cookies et stockage local</h2>
      <p>
        SalaireDirect n&apos;utilise <strong>aucun cookie publicitaire ni de mesure d&apos;audience</strong>. Seuls des
        éléments strictement nécessaires au fonctionnement sont déposés : un témoin de session et le stockage local du
        navigateur contenant votre session de connexion. Ils ne nécessitent pas de consentement. Les polices sont
        hébergées par SalaireDirect : aucune requête n&apos;est envoyée à Google Fonts.
      </p>

      <h2>6. Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition
        et de portabilité de vos données. Pour les exercer, écrivez à <TODO>adresse e-mail</TODO>. Vous pouvez aussi
        introduire une réclamation auprès de l&apos;autorité de protection des données compétente.
      </p>

      <h2>7. Sécurité</h2>
      <p>
        Les échanges sont chiffrés (HTTPS). L&apos;accès aux données est réservé aux utilisateurs authentifiés de votre
        entreprise.
      </p>
    </LegalPage>
  )
}

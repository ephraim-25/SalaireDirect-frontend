# SalaireDirect - Frontend

Solution SaaS de gestion de la paie automatisée pour les structures en RD Congo (écoles, ONG, PME).

## Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript
- **Styles**: Tailwind CSS
- **Notifications**: react-hot-toast
- **Icônes**: lucide-react
- **Design System**: Inspiré d'Emilkowalski (micro-interactions, typographie soignée)

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Structure du Projet

```
frontend/
├── app/                    # Pages Next.js (App Router)
│   ├── login/            # Page de connexion
│   ├── dashboard/        # Tableau de bord principal
│   ├── employees/        # Gestion des employés
│   ├── variables/        # Variables du mois (primes, heures sup, absences, avances)
│   ├── calculation/      # Calcul et récapitulatif de paie
│   ├── layout.tsx        # Layout principal avec Toaster
│   ├── page.tsx          # Page d'accueil
│   └── globals.css       # Styles globaux
├── components/
│   └── ui/               # Composants UI réutilisables
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Card.tsx
│       └── Modal.tsx
├── lib/
│   └── utils.ts          # Fonctions utilitaires (formatage, calculs)
├── types/
│   └── index.ts          # Types TypeScript
└── package.json
```

## Fonctionnalités du MVP

### 1. Page de Connexion (`/login`)
- Interface sécurisée et épurée
- Mobile-first responsive
- Formulaire d'authentification avec validation

### 2. Dashboard (`/dashboard`)
- Vue d'ensemble du mois en cours
- Statistiques clés (employés, masse salariale, statut paie)
- Activités récentes
- Actions rapides
- Navigation latérale responsive

### 3. Gestion des Employés (`/employees`)
- Liste des salariés avec recherche
- Ajout/Modification/Suppression d'employés
- Fiche signalétique complète :
  - Identité (nom, prénom, email, téléphone)
  - Poste et CNSS
  - Salaire de base (USD/FC)
  - Mobile Money (Airtel, Vodacom, Orange, M-Pesa)
  - WhatsApp
  - Situation familiale et personnes à charge

### 4. Variables du Mois (`/variables`)
- Saisie rapide des variables mensuelles
- Types : Primes, Heures supplémentaires, Absences, Avances
- Sélection par mois/année
- Récapitulatif en temps réel

### 5. Calcul & Récapitulatif (`/calculation`)
- Tableau de simulation/validation
- Calculs automatiques :
  - Salaire brut
  - CNSS part salariale (8.5%) et patronale (12.5%)
  - IPR (impôt sur le revenu)
  - Net à payer
- Masse salariale totale
- Export et validation de la paie

## Design & Ergonomie

- **Mobile-first**: Optimisé pour smartphones Android d'entrée de gamme
- **Responsive**: Parfaitement utilisable sur PC
- **Interface claire**: Typographie soignée, contrastes parfaits
- **Micro-interactions**: Animations fluides et professionnelles
- **Performance**: Pages légères, chargement rapide

## Prochaines Étapes

1. Installer les dépendances (`npm install`)
2. Connecter le frontend au backend API
3. Implémenter l'authentification réelle
4. Ajouter la persistance des données
5. Implémenter l'export PDF/Excel
6. Ajouter les tests unitaires
7. Déployer en production

## Notes

- Les TypeScript errors actuels sont normaux : les dépendances n'ont pas été installées (erreur réseau npm)
- Une fois `npm install` exécuté, tous les types seront résolus
- Les données actuelles sont des mock data - à remplacer par des appels API

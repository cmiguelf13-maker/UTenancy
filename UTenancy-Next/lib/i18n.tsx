'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type Language = 'en' | 'es' | 'fr'

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English',  flag: '🇺🇸' },
  { code: 'es', label: 'Español',  flag: '🇲🇽' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
]

const T = {
  en: {
    /* nav */
    messages: 'Messages', households: 'Households', analytics: 'Analytics',
    api: 'API', upgrade: 'Upgrade', addListing: 'Add Listing',
    /* profile dropdown */
    editProfile: 'Edit Profile', managePlan: 'Manage Plan', signOut: 'Sign Out',
    /* dashboard stats */
    properties: 'Properties', activeListings: 'Active Listings',
    applicants: 'Applicants', monthlyRevenue: 'Monthly Revenue',
    inYourPortfolio: 'In your portfolio', visibleToStudents: 'Visible to students',
    acrossAllListings: 'Across all listings', receivedDue: 'Received / due',
    myHouseholds: 'My Households', viewHouseholds: 'View tenants, rent received, and property details',
    /* filter tabs */
    all: 'All', active: 'Active', draft: 'Draft', filled: 'Filled', archived: 'Archived',
    /* profile page */
    saveChanges: 'Save Changes', saving: 'Saving…', saved: 'Saved!',
    basicInfo: 'Basic Information',
    firstName: 'First Name', lastName: 'Last Name', gender: 'Gender',
    bio: 'Bio', phone: 'Phone', company: 'Company',
    /* settings tabs */
    tabProfile: 'Profile', tabLanguage: 'Language', tabReferral: 'Refer a Friend',
    /* language settings */
    languageTitle: 'Language',
    languageDesc: 'Choose your preferred language. The site will update instantly.',
    /* referral */
    referralTitle: 'Refer a Friend',
    referralDesc: 'Share your link — when someone signs up and subscribes, you get 1 free month at the next tier up.',
    referralLink: 'Your referral link',
    copyLink: 'Copy Link', copied: 'Copied!',
    referralPending: 'pending reward',
    referralPendingPlural: 'pending rewards',
    referralRewardNote: 'Rewards are applied automatically when your referral\'s first payment clears.',
    noReferrals: 'No referrals yet. Share your link to get started.',
  },
  es: {
    messages: 'Mensajes', households: 'Hogares', analytics: 'Análisis',
    api: 'API', upgrade: 'Mejorar', addListing: 'Agregar',
    editProfile: 'Editar Perfil', managePlan: 'Gestionar Plan', signOut: 'Cerrar Sesión',
    properties: 'Propiedades', activeListings: 'Anuncios Activos',
    applicants: 'Solicitantes', monthlyRevenue: 'Ingresos Mensuales',
    inYourPortfolio: 'En tu cartera', visibleToStudents: 'Visible para estudiantes',
    acrossAllListings: 'En todos los anuncios', receivedDue: 'Recibido / pendiente',
    myHouseholds: 'Mis Hogares', viewHouseholds: 'Ver inquilinos, renta y detalles',
    all: 'Todos', active: 'Activo', draft: 'Borrador', filled: 'Ocupado', archived: 'Archivado',
    saveChanges: 'Guardar', saving: 'Guardando…', saved: '¡Guardado!',
    basicInfo: 'Información Básica',
    firstName: 'Nombre', lastName: 'Apellido', gender: 'Género',
    bio: 'Biografía', phone: 'Teléfono', company: 'Empresa',
    tabProfile: 'Perfil', tabLanguage: 'Idioma', tabReferral: 'Referir Amigo',
    languageTitle: 'Idioma',
    languageDesc: 'Elige tu idioma preferido. El sitio se actualizará al instante.',
    referralTitle: 'Referir a un Amigo',
    referralDesc: 'Comparte tu enlace — cuando alguien se registre y se suscriba, obtienes 1 mes gratis en el nivel superior.',
    referralLink: 'Tu enlace de referido',
    copyLink: 'Copiar Enlace', copied: '¡Copiado!',
    referralPending: 'recompensa pendiente',
    referralPendingPlural: 'recompensas pendientes',
    referralRewardNote: 'Las recompensas se aplican automáticamente cuando el primer pago de tu referido se confirma.',
    noReferrals: 'Aún no tienes referidos. Comparte tu enlace para empezar.',
  },
  fr: {
    messages: 'Messages', households: 'Foyers', analytics: 'Analytique',
    api: 'API', upgrade: 'Améliorer', addListing: 'Ajouter',
    editProfile: 'Modifier le Profil', managePlan: 'Gérer le Plan', signOut: 'Se Déconnecter',
    properties: 'Propriétés', activeListings: 'Annonces Actives',
    applicants: 'Candidats', monthlyRevenue: 'Revenus Mensuels',
    inYourPortfolio: 'Dans votre portefeuille', visibleToStudents: 'Visible aux étudiants',
    acrossAllListings: 'Sur toutes les annonces', receivedDue: 'Reçu / dû',
    myHouseholds: 'Mes Foyers', viewHouseholds: 'Voir locataires, loyer et détails',
    all: 'Tous', active: 'Actif', draft: 'Brouillon', filled: 'Occupé', archived: 'Archivé',
    saveChanges: 'Enregistrer', saving: 'Enregistrement…', saved: 'Enregistré !',
    basicInfo: 'Informations de Base',
    firstName: 'Prénom', lastName: 'Nom', gender: 'Genre',
    bio: 'Biographie', phone: 'Téléphone', company: 'Entreprise',
    tabProfile: 'Profil', tabLanguage: 'Langue', tabReferral: 'Référer un Ami',
    languageTitle: 'Langue',
    languageDesc: 'Choisissez votre langue préférée. Le site se mettra à jour instantanément.',
    referralTitle: 'Référer un Ami',
    referralDesc: 'Partagez votre lien — quand quelqu\'un s\'inscrit et s\'abonne, vous obtenez 1 mois gratuit au niveau supérieur.',
    referralLink: 'Votre lien de parrainage',
    copyLink: 'Copier le lien', copied: 'Copié !',
    referralPending: 'récompense en attente',
    referralPendingPlural: 'récompenses en attente',
    referralRewardNote: 'Les récompenses sont appliquées automatiquement dès que le premier paiement de votre filleul est confirmé.',
    noReferrals: 'Pas encore de filleuls. Partagez votre lien pour commencer.',
  },
} as const

export type TranslationKey = keyof typeof T.en

interface LangCtx {
  lang:    Language
  setLang: (l: Language) => void
  t:       (k: TranslationKey) => string
}

const Ctx = createContext<LangCtx>({
  lang:    'en',
  setLang: () => {},
  t:       (k) => T.en[k],
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ut_lang') as Language | null
      if (stored === 'en' || stored === 'es' || stored === 'fr') setLangState(stored)
    } catch { /* SSR / private browsing */ }
  }, [])

  function setLang(l: Language) {
    setLangState(l)
    try { localStorage.setItem('ut_lang', l) } catch {}
  }

  function t(k: TranslationKey): string {
    const dict = T[lang] as Record<string, string>
    return dict[k] ?? (T.en as Record<string, string>)[k] ?? k
  }

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useLanguage() {
  return useContext(Ctx)
}

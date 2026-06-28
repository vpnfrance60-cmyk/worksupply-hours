'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'en' | 'fr';

export interface Dict {
  common: { signOut: string; loading: string };
  home: { workerSpace: string; clientSpace: string };
  login: {
    workerTitle: string;
    workerSubtitle: string;
    workerIdLabel: string;
    workerIdPlaceholder: string;
    workerInstructions: string;
    workerError: string;
    clientTitle: string;
    clientSubtitle: string;
    clientIdLabel: string;
    clientIdPlaceholder: string;
    clientInstructions: string;
    clientError: string;
    signInHeading: string;
    passwordLabel: string;
    signingIn: string;
    signIn: string;
  };
  status: { pending: string; confirmed: string; refused: string };
  worker: {
    hi: string;
    eggCollection: string;
    forClient: string;
    yesterday: string;
    today: string;
    hoursWorked: string;
    ofWhichAfter6pm: string;
    commentPlaceholder: string;
    saved: string;
    saving: string;
    updateHours: string;
    submitHours: string;
    submitted: string;
    afterSixPm: string;
    clientLabel: string;
    windowClosed: string;
    submissionWindowError: string;
    thisWeek: string;
    totalThisWeek: string;
    premiumHoursLabel: string;
    weekly25Label: string;
    weekly50Label: string;
    estimatedPay: string;
  };
  client: {
    worker: string;
    workersPlural: string;
    pendingReview: string;
    allReviewed: string;
    updated: string;
    live: string;
    downloadPayroll: string;
    preparing: string;
    tableWorker: string;
    tableWeek: string;
    tablePay: string;
    night: string;
    reasonPlaceholder: string;
    refuse: string;
    yourRemark: string;
    noWorkers: string;
  };
  pay: {
    payroll: string;
    week: string;
    hourlyRate: string;
    worker: string;
    nif: string;
    confirmedHours: string;
    nightHours: string;
    weekendHours: string;
    overtime25: string;
    overtime50: string;
    payEur: string;
    excludedCol: string;
    total: string;
  };
}

const dict: Record<Lang, Dict> = {
  en: {
    common: { signOut: 'Sign out', loading: 'Loading…' },
    home: { workerSpace: 'Worker space', clientSpace: 'Client space' },
    login: {
      workerTitle: 'Welcome back',
      workerSubtitle: 'Sign in to log your hours and track day-by-day confirmations.',
      workerIdLabel: 'Worker ID',
      workerIdPlaceholder: 'e.g. WS-1024',
      workerInstructions: 'Enter your worker ID and password.',
      workerError: 'Wrong ID or password.',
      clientTitle: 'Client space',
      clientSubtitle: 'Live hours for every assigned worker — review, confirm, or refuse.',
      clientIdLabel: 'Email',
      clientIdPlaceholder: 'you@example.com',
      clientInstructions: 'Enter your email and password.',
      clientError: 'Wrong email or password.',
      signInHeading: 'Sign in',
      passwordLabel: 'Password',
      signingIn: 'Signing in…',
      signIn: 'Sign in',
    },
    status: { pending: 'pending', confirmed: 'confirmed', refused: 'refused' },
    worker: {
      hi: 'Hi',
      eggCollection: 'Egg collection',
      forClient: 'for',
      yesterday: 'Yesterday:',
      today: 'Today',
      hoursWorked: 'Hours worked',
      ofWhichAfter6pm: 'Of which after 6 PM (+25%)',
      commentPlaceholder: 'Comment (optional)',
      saved: 'Saved ✓',
      saving: 'Saving…',
      updateHours: 'Update hours',
      submitHours: 'Submit hours',
      submitted: 'submitted',
      afterSixPm: 'after 6 PM',
      clientLabel: 'Client:',
      windowClosed: "Today's entry opens at 18:00 (Paris). Come back this evening to log your hours.",
      submissionWindowError: 'Submission opens at 18:00 (Europe/Paris)',
      thisWeek: 'This week',
      totalThisWeek: 'Total this week',
      premiumHoursLabel: '+25% hours (weekend / after 6 PM)',
      weekly25Label: 'Weekly overtime 35–43h (+25%)',
      weekly50Label: 'Weekly overtime 43–48h (+50%)',
      estimatedPay: 'Estimated pay',
    },
    client: {
      worker: 'worker',
      workersPlural: 'workers',
      pendingReview: 'pending review',
      allReviewed: 'all reviewed',
      updated: 'updated',
      live: 'live',
      downloadPayroll: 'Download payroll (Excel)',
      preparing: 'Preparing…',
      tableWorker: 'Worker',
      tableWeek: 'Week',
      tablePay: 'Pay',
      night: 'night',
      reasonPlaceholder: 'Reason',
      refuse: 'Refuse',
      yourRemark: 'Your remark:',
      noWorkers: 'No workers assigned yet.',
    },
    pay: {
      payroll: 'Payroll',
      week: 'Week',
      hourlyRate: 'Hourly rate',
      worker: 'Worker',
      nif: 'NIF',
      confirmedHours: 'Confirmed hours',
      nightHours: 'Night hours (+25%)',
      weekendHours: 'Weekend hours (+25%)',
      overtime25: 'Overtime 35–43h (+25%)',
      overtime50: 'Overtime 43–48h (+50%)',
      payEur: 'Pay (€)',
      excludedCol: 'Pending / refused (not paid)',
      total: 'TOTAL',
    },
  },
  fr: {
    common: { signOut: 'Déconnexion', loading: 'Chargement…' },
    home: { workerSpace: 'Espace travailleur', clientSpace: 'Espace client' },
    login: {
      workerTitle: 'Bon retour',
      workerSubtitle: 'Connectez-vous pour enregistrer vos heures et suivre les confirmations jour par jour.',
      workerIdLabel: 'ID travailleur',
      workerIdPlaceholder: 'ex. WS-1024',
      workerInstructions: 'Entrez votre ID travailleur et votre mot de passe.',
      workerError: 'ID ou mot de passe incorrect.',
      clientTitle: 'Espace client',
      clientSubtitle: 'Heures en direct pour chaque travailleur assigné — consultez, confirmez ou refusez.',
      clientIdLabel: 'E-mail',
      clientIdPlaceholder: 'vous@exemple.com',
      clientInstructions: 'Entrez votre e-mail et votre mot de passe.',
      clientError: 'E-mail ou mot de passe incorrect.',
      signInHeading: 'Connexion',
      passwordLabel: 'Mot de passe',
      signingIn: 'Connexion…',
      signIn: 'Se connecter',
    },
    status: { pending: 'en attente', confirmed: 'confirmé', refused: 'refusé' },
    worker: {
      hi: 'Bonjour',
      eggCollection: 'Ramassage des œufs',
      forClient: 'pour',
      yesterday: 'Hier :',
      today: "Aujourd'hui",
      hoursWorked: 'Heures travaillées',
      ofWhichAfter6pm: 'Dont après 18h (+25%)',
      commentPlaceholder: 'Commentaire (optionnel)',
      saved: 'Enregistré ✓',
      saving: 'Enregistrement…',
      updateHours: 'Mettre à jour',
      submitHours: 'Soumettre les heures',
      submitted: 'soumis(es)',
      afterSixPm: 'après 18h',
      clientLabel: 'Client :',
      windowClosed: "La saisie du jour ouvre à 18h00 (Paris). Revenez ce soir pour enregistrer vos heures.",
      submissionWindowError: 'La saisie ouvre à 18h00 (Europe/Paris)',
      thisWeek: 'Cette semaine',
      totalThisWeek: 'Total de la semaine',
      premiumHoursLabel: 'Heures +25% (weekend / après 18h)',
      weekly25Label: 'Heures supp. hebdo 35–43h (+25%)',
      weekly50Label: 'Heures supp. hebdo 43–48h (+50%)',
      estimatedPay: 'Salaire estimé',
    },
    client: {
      worker: 'travailleur',
      workersPlural: 'travailleurs',
      pendingReview: 'en attente de validation',
      allReviewed: 'tout est validé',
      updated: 'mis à jour',
      live: 'en direct',
      downloadPayroll: 'Télécharger la paie (Excel)',
      preparing: 'Préparation…',
      tableWorker: 'Travailleur',
      tableWeek: 'Semaine',
      tablePay: 'Paie',
      night: 'nuit',
      reasonPlaceholder: 'Motif',
      refuse: 'Refuser',
      yourRemark: 'Votre remarque :',
      noWorkers: 'Aucun travailleur assigné pour le moment.',
    },
    pay: {
      payroll: 'Paie',
      week: 'Semaine',
      hourlyRate: 'Taux horaire',
      worker: 'Travailleur',
      nif: 'NIF',
      confirmedHours: 'Heures confirmées',
      nightHours: 'Heures de nuit (+25%)',
      weekendHours: 'Heures weekend (+25%)',
      overtime25: 'Heures supp. 35–43h (+25%)',
      overtime50: 'Heures supp. 43–48h (+50%)',
      payEur: 'Paie (€)',
      excludedCol: 'En attente / refusées (non payées)',
      total: 'TOTAL',
    },
  },
};

const LANG_KEY = 'ws_lang';

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}>({
  lang: 'en',
  setLang: () => {},
  t: dict.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === 'en' || stored === 'fr') setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    window.localStorage.setItem(LANG_KEY, l);
  }

  return <LangContext.Provider value={{ lang, setLang, t: dict[lang] }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Date-formatting locale string matching the current app language. */
export function dateLocale(lang: Lang): string {
  return lang === 'fr' ? 'fr-FR' : 'en-US';
}

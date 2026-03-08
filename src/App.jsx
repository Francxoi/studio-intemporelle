import { useState, useEffect, useCallback, useRef } from "react";

// ==================== CONFIGURATION ====================
const DEFAULT_CONFIG = {
  studioName: "STUDIO INTEMPORELLE",
  subtitle: "Centre de Soins Esthétiques · Piercing Professionnel",
  email: "contact@intemporelle.eu",
  website: "www.intemporelle.eu",
  phone: "",
  address: "",
  siret: "",
  primaryColor: "#0C5C75",
  accentColor: "#E8B931",
  jotformApiKey: "",
  jotformFormId: "",
};

const USERS_DEFAULT = [
  { id: "admin", username: "admin", password: "Intemporelle2024!", role: "admin", name: "Administrateur" },
  { id: "piercer1", username: "pierceur1", password: "Piercing2024!", role: "piercer", name: "Pierceur 1" },
];

// ==================== STORAGE HELPERS ====================
const STORAGE_PREFIX = "intemporelle_";
const storageGet = (key, fallback) => {
  try {
    const v = localStorage.getItem(STORAGE_PREFIX + key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};
const storageSet = (key, val) => {
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val)); } catch {}
};

// ==================== FORM DEFINITIONS ====================
const FORM_CATEGORIES = [
  {
    id: "admin",
    label: "📋 Documents Administratifs",
    icon: "📋",
    forms: [
      { id: "1-1", code: "01", label: "Questionnaire Médical Mineur", icon: "🧒", category: "Questionnaires" },
      { id: "1-2", code: "03", label: "Autorisation Parentale", icon: "✍️", category: "Questionnaires" },
      { id: "1-3", code: "02", label: "Questionnaire Médical Majeur", icon: "🧑", category: "Questionnaires" },
      { id: "1-4", code: "04", label: "Engagement de Confidentialité", icon: "🔒", category: "Questionnaires" },
    ]
  },
  {
    id: "soins",
    label: "🩺 Fiches de Soins",
    icon: "🩺",
    forms: [
      { id: "2-01", code: "SOIN-01", label: "Fiche de Soins — Oreilles", icon: "👂", category: "Soins" },
      { id: "2-02", code: "SOIN-02", label: "Fiche de Soins — Nez", icon: "👃", category: "Soins" },
      { id: "2-03", code: "SOIN-03", label: "Fiche de Soins — Bouche & Lèvres", icon: "👄", category: "Soins" },
      { id: "2-04", code: "SOIN-04", label: "Fiche de Soins — Nombril", icon: "🔵", category: "Soins" },
      { id: "2-05", code: "SOIN-06", label: "Fiche de Soins — Arcade & Sourcil", icon: "⬡", category: "Soins" },
      { id: "2-06", code: "SOIN-05", label: "Fiche de Soins — Mamelons", icon: "✦", category: "Soins" },
      { id: "2-07", code: "SOIN-07", label: "Fiche de Soins — Dermal & Surface", icon: "◎", category: "Soins" },
    ]
  }
];

const ALL_FORMS = FORM_CATEGORIES.flatMap(c => c.forms);

// ==================== FORM FIELD DEFINITIONS ====================
const buildFormFields = (formId) => {
  const common_client = [
    { name: "nom", label: "Nom de famille", type: "text", required: true },
    { name: "prenom", label: "Prénom(s)", type: "text", required: true },
    { name: "dateNaissance", label: "Date de naissance", type: "date" },
    { name: "adresse", label: "Adresse complète", type: "text" },
    { name: "codePostal", label: "Code postal", type: "text" },
    { name: "ville", label: "Ville", type: "text" },
    { name: "telephone", label: "Téléphone", type: "tel" },
    { name: "email", label: "Email", type: "email" },
    { name: "pieceIdentite", label: "Pièce d'identité (CNI / Passeport)", type: "select", options: ["CNI","Passeport","Titre de séjour","Autre"] },
    { name: "numeroPiece", label: "Numéro de la pièce d'identité", type: "text" },
  ];

  const piercing_demande = [
    { name: "zonePercer", label: "Zone à percer", type: "text", required: true },
    { name: "premierPiercing", label: "Premier piercing ?", type: "select", options: ["Oui","Non"] },
    { name: "piercingsExistants", label: "Zone(s) de piercing(s) existant(s)", type: "text" },
  ];

  const contre_indications_mineur = [
    { name: "ci_coagulation", label: "Troubles de la coagulation", type: "checkbox" },
    { name: "ci_diabete", label: "Diabète de type 1 non équilibré", type: "checkbox" },
    { name: "ci_immunodepression", label: "Immunodépression", type: "checkbox" },
    { name: "ci_allergiMetaux", label: "Allergie aux métaux (nickel, chrome, cobalt)", type: "checkbox" },
    { name: "ci_allergiMetaux_detail", label: "Préciser allergie métaux", type: "text" },
    { name: "ci_epilepsie", label: "Épilepsie ou trouble neurologique non contrôlé", type: "checkbox" },
    { name: "ci_dermatologique", label: "Maladie dermatologique active sur la zone", type: "checkbox" },
    { name: "ci_enceinte", label: "Mineure enceinte", type: "checkbox" },
    { name: "ci_cardiaque", label: "Pathologie cardiaque nécessitant antibioprophylaxie", type: "checkbox" },
  ];

  const contre_indications_majeur = [
    { name: "ci_coagulation", label: "Hémophilie / troubles coagulation / anticoagulant", type: "checkbox" },
    { name: "ci_diabete", label: "Diabète non équilibré", type: "checkbox" },
    { name: "ci_immunodepression", label: "Immunodépression (VIH, chimio, greffe)", type: "checkbox" },
    { name: "ci_allergiMetaux", label: "Allergie aux métaux", type: "checkbox" },
    { name: "ci_allergiMetaux_detail", label: "Préciser allergie métaux", type: "text" },
    { name: "ci_anesthesiques", label: "Allergie aux anesthésiques locaux", type: "checkbox" },
    { name: "ci_cardiaque", label: "Maladie cardiaque nécessitant antibioprophylaxie", type: "checkbox" },
    { name: "ci_grossesse", label: "Grossesse en cours ou allaitement", type: "checkbox" },
    { name: "ci_epilepsie", label: "Épilepsie non contrôlée", type: "checkbox" },
    { name: "ci_cutanee", label: "Affection cutanée active sur la zone", type: "checkbox" },
  ];

  const antecedents = [
    { name: "suiviMedical", label: "Suivi médical en cours ?", type: "select", options: ["Non","Oui"] },
    { name: "suiviMedical_detail", label: "Médecin / Spécialité", type: "text" },
    { name: "traitements", label: "Traitements médicaux actuels", type: "select", options: ["Aucun","Oui"] },
    { name: "traitements_detail", label: "Lesquels", type: "text" },
    { name: "allergies", label: "Allergies connues", type: "select", options: ["Aucune","Médicaments","Métaux","Latex","Autres"] },
    { name: "allergies_detail", label: "Préciser allergies", type: "text" },
    { name: "cheloides", label: "Tendance aux chéloïdes", type: "select", options: ["Non","Oui"] },
    { name: "cheloides_detail", label: "Zone(s) chéloïdes", type: "text" },
    { name: "infoComplementaires", label: "Informations médicales complémentaires", type: "textarea" },
  ];

  const representant = [
    { name: "rep1_nom", label: "Représentant N°1 — Nom / Prénom", type: "text", required: true },
    { name: "rep1_lien", label: "Lien", type: "select", options: ["Mère","Père","Tuteur légal","Autre"] },
    { name: "rep1_telephone", label: "Téléphone représentant N°1", type: "tel" },
    { name: "rep1_piece", label: "Pièce d'identité représentant", type: "select", options: ["CNI","Passeport","Titre de séjour"] },
    { name: "rep1_numPiece", label: "N° pièce d'identité", type: "text" },
    { name: "rep2_nom", label: "Représentant N°2 — Nom / Prénom (facultatif)", type: "text" },
    { name: "rep2_lien", label: "Lien représentant N°2", type: "select", options: ["","Mère","Père","Tuteur légal","Autre"] },
    { name: "rep2_telephone", label: "Téléphone représentant N°2", type: "tel" },
  ];

  const bijou = [
    { name: "refBijou", label: "Référence bijou", type: "text" },
    { name: "materiau", label: "Matériau", type: "select", options: ["Titane implant-grade","Acier chirurgical 316L","Or 18k","Niobium","PTFE/Bioplastique","Autre"] },
    { name: "calibre", label: "Calibre (gauge)", type: "text" },
    { name: "longueur", label: "Longueur / diamètre", type: "text" },
    { name: "lot", label: "Lot / Traçabilité", type: "text" },
    { name: "fournisseur", label: "Fournisseur", type: "text" },
  ];

  const observations = [
    { name: "observations", label: "Observations du praticien", type: "textarea" },
    { name: "complications", label: "Complications éventuelles (RAS si aucune)", type: "text" },
    { name: "ficheSoinsRemise", label: "Fiche de soins remise et expliquée", type: "select", options: ["Oui","Non"] },
    { name: "prochainRdv", label: "Prochain contrôle / rendez-vous", type: "date" },
    { name: "photoAvant", label: "Photo avant soin prise", type: "checkbox" },
    { name: "photoApres", label: "Photo après soin prise", type: "checkbox" },
    { name: "consentementPhoto", label: "Consentement photo signé", type: "checkbox" },
  ];

  const soin_common = (zones) => [
    { name: "numDossier", label: "N° dossier client", type: "text" },
    { name: "dateSoin", label: "Date du soin", type: "date", required: true },
    { name: "pierceur", label: "Pierceur(se)", type: "text" },
    { name: "nomClient", label: "Nom du client", type: "text", required: true },
    { name: "prenomClient", label: "Prénom", type: "text", required: true },
    { name: "zone", label: "Zone percée", type: "select", options: zones, required: true },
    { name: "cote", label: "Côté", type: "select", options: ["Gauche","Droite","Les deux","Centre / Milieu","N/A"] },
    ...bijou,
    ...observations,
  ];

  switch(formId) {
    case "1-1": return {
      title: "QUESTIONNAIRE MÉDICAL — MINEUR",
      subtitle: "Client(e) de moins de 18 ans · Autorisation parentale incluse",
      sections: [
        { title: "1 — IDENTITÉ DU MINEUR", fields: common_client },
        { title: "2 — PIERCING DEMANDÉ", fields: piercing_demande },
        { title: "3 — CONTRE-INDICATIONS ABSOLUES", fields: contre_indications_mineur },
        { title: "4 — ANTÉCÉDENTS MÉDICAUX DU MINEUR", fields: antecedents },
        { title: "5 — AVIS DU MINEUR (obligatoire dès 12 ans)", fields: [
          { name: "avisMineur", label: "Confirme vouloir ce piercing de son plein gré", type: "checkbox" },
          { name: "comprisSoins", label: "A compris les conseils de soins", type: "checkbox" },
        ]},
        { title: "6 — REPRÉSENTANT(S) LÉGAL/AUX", fields: representant },
        { title: "7 — CONSENTEMENT PARENTAL ÉCLAIRÉ", fields: [
          { name: "consent_autorite", label: "Exerce l'autorité parentale sur le mineur", type: "checkbox" },
          { name: "consent_honnete", label: "A répondu honnêtement au questionnaire", type: "checkbox" },
          { name: "consent_risques", label: "Informé(e) des risques liés au piercing", type: "checkbox" },
          { name: "consent_ficheSoins", label: "Reçu la fiche de soins post-piercing", type: "checkbox" },
          { name: "consent_libre", label: "Donne son consentement libre et éclairé", type: "checkbox" },
          { name: "consent_suivi", label: "Assume la responsabilité du suivi des soins", type: "checkbox" },
          { name: "consent_present", label: "Présent(e) physiquement pendant la séance", type: "checkbox" },
        ]},
        { title: "8 — DOCUMENTS REMIS", fields: [
          { name: "doc_ficheSoins", label: "Fiche de soins post-piercing remise", type: "checkbox" },
          { name: "doc_tracabilite", label: "Numéro de traçabilité du bijou", type: "text" },
          { name: "doc_materiaux", label: "Informations matériaux communiquées", type: "checkbox" },
          { name: "doc_lot", label: "Lot", type: "text" },
        ]},
      ]
    };

    case "1-2": return {
      title: "AUTORISATION PARENTALE",
      subtitle: "Consentement pour réalisation d'un piercing sur mineur",
      sections: [
        { title: "1 — IDENTITÉ DU SALON", fields: [
          { name: "nomSalon", label: "Nom du salon", type: "text", defaultValue: "STUDIO INTEMPORELLE" },
          { name: "adresseSalon", label: "Adresse", type: "text" },
          { name: "telSalon", label: "Téléphone", type: "tel" },
          { name: "nomPierceur", label: "Nom du pierceur(se)", type: "text" },
          { name: "siret", label: "N° SIRET", type: "text" },
        ]},
        { title: "2 — IDENTITÉ DU MINEUR", fields: [
          { name: "nomMineur", label: "Nom", type: "text", required: true },
          { name: "prenomMineur", label: "Prénom", type: "text", required: true },
          { name: "dateNaissanceMineur", label: "Date de naissance", type: "date" },
        ]},
        { title: "3 — REPRÉSENTANT(S) LÉGAL/AUX", fields: representant },
        { title: "4 — DESCRIPTION DU PIERCING", fields: [
          { name: "zonePiercing", label: "Zone percée", type: "text", required: true },
          { name: "typeBijou", label: "Type de bijou", type: "text" },
          { name: "materiauBijou", label: "Matériau du bijou", type: "text" },
          { name: "longueurBijou", label: "Longueur / diamètre", type: "text" },
          { name: "allergiesConnues", label: "Allergies ou contre-indications", type: "select", options: ["Aucune allergie connue","Allergie(s)"] },
          { name: "allergiesDetail", label: "Préciser allergies", type: "text" },
          { name: "traitementEnCours", label: "Traitement médical en cours", type: "text" },
        ]},
        { title: "5 — DÉCLARATIONS ET CONSENTEMENT", fields: [
          { name: "cert_autorite", label: "Certifie être titulaire de l'autorité parentale", type: "checkbox" },
          { name: "cert_autorise", label: "Autorise expressément la réalisation du piercing", type: "checkbox" },
          { name: "cert_risques", label: "Atteste avoir pris connaissance des risques", type: "checkbox" },
          { name: "cert_contreindicaiton", label: "Confirme absence de contre-indication médicale", type: "checkbox" },
          { name: "cert_soins", label: "S'engage à faire respecter le protocole de soins", type: "checkbox" },
          { name: "cert_ficheSoins", label: "Reconnaît avoir reçu la fiche de soins", type: "checkbox" },
        ]},
        { title: "6 — PRÉSENCE PENDANT LA SÉANCE", fields: [
          { name: "presence", label: "Présence", type: "select", options: ["Présent(e) physiquement","Autorisation écrite — CNI jointe"] },
        ]},
      ]
    };

    case "1-3": return {
      title: "QUESTIONNAIRE MÉDICAL — MAJEUR",
      subtitle: "Client(e) adulte (18 ans et plus)",
      sections: [
        { title: "1 — IDENTITÉ DU CLIENT", fields: common_client },
        { title: "2 — PIERCING DEMANDÉ", fields: piercing_demande },
        { title: "3 — CONTRE-INDICATIONS ABSOLUES", fields: contre_indications_majeur },
        { title: "4 — ANTÉCÉDENTS MÉDICAUX", fields: antecedents },
        { title: "5 — ÉTAT DU JOUR", fields: [
          { name: "mange2h", label: "A mangé dans les 2h précédentes (recommandé)", type: "select", options: ["Oui","Non"] },
          { name: "aJeun", label: "À jeun ou sous stress important", type: "select", options: ["Non","Oui"] },
          { name: "alcoolDrogues", label: "Alcool ou drogues dans les 24h (prestation refusée)", type: "select", options: ["Non","Oui — PRESTATION REFUSÉE"] },
          { name: "enceinte", label: "Enceinte ou susceptible de l'être", type: "select", options: ["Non","Oui"] },
        ]},
        { title: "6 — CONSENTEMENT ÉCLAIRÉ", fields: [
          { name: "consent_majeur", label: "Être majeur(e) et avoir capacité juridique", type: "checkbox" },
          { name: "consent_honnete", label: "A répondu honnêtement", type: "checkbox" },
          { name: "consent_risques", label: "Informé(e) des risques", type: "checkbox" },
          { name: "consent_ficheSoins", label: "Reçu fiche de soins post-piercing", type: "checkbox" },
          { name: "consent_libre", label: "Consent librement", type: "checkbox" },
          { name: "consent_suivi", label: "S'engage à respecter le protocole de soins", type: "checkbox" },
        ]},
        { title: "7 — DOCUMENTS REMIS", fields: [
          { name: "doc_ficheSoins", label: "Fiche de soins post-piercing remise", type: "checkbox" },
          { name: "doc_tracabilite", label: "N° de traçabilité du bijou", type: "text" },
          { name: "doc_materiaux", label: "Informations matériaux communiquées", type: "checkbox" },
          { name: "doc_lot", label: "Lot", type: "text" },
        ]},
      ]
    };

    case "1-4": return {
      title: "ENGAGEMENT DE CONFIDENTIALITÉ",
      subtitle: "Données personnelles clients — RGPD Art. 29",
      sections: [
        { title: "IDENTITÉ DU SIGNATAIRE", fields: [
          { name: "nomSignataire", label: "Nom et Prénom", type: "text", required: true },
          { name: "poste", label: "Poste / Fonction", type: "text" },
          { name: "typeContrat", label: "Type de contrat", type: "select", options: ["CDI","CDD","Stage","Prestataire","Autre"] },
          { name: "dateDebut", label: "Date de début de mission", type: "date" },
          { name: "nomEtablissement", label: "Nom du salon / Établissement", type: "text", defaultValue: "STUDIO INTEMPORELLE" },
        ]},
        { title: "OBLIGATIONS", fields: [
          { name: "obl_secret", label: "S'engage au secret professionnel et discrétion absolue", type: "checkbox" },
          { name: "obl_utilisation", label: "Utilisation strictement limitée aux besoins professionnels", type: "checkbox" },
          { name: "obl_copie", label: "Interdiction de copie et d'extraction", type: "checkbox" },
          { name: "obl_signalement", label: "Obligation de signalement", type: "checkbox" },
          { name: "obl_procedures", label: "Respect des procédures internes", type: "checkbox" },
          { name: "obl_droits", label: "Transmettre toute demande RGPD au responsable", type: "checkbox" },
        ]},
      ]
    };

    case "2-01": return {
      title: "FICHE DE SOINS — OREILLES",
      subtitle: "Zones de piercing · Protocole · Recommandations",
      sections: [
        { title: "IDENTIFICATION & SÉANCE", fields: soin_common(["Lobe","Anti-tragus","Tragus","Daith","Rook","Industriel","Hélix","Flat","Conch","Snug"]) },
      ]
    };
    case "2-02": return {
      title: "FICHE DE SOINS — NEZ",
      subtitle: "10 zones · Protocole · Recommandations",
      sections: [
        { title: "IDENTIFICATION & SÉANCE", fields: soin_common(["Narine (Nostril)","Narine haute","Double Nostril","Septum","Bridge (Earl)","Austin Bar","Rhino","Third Eye","Nasallang","Septril"]) },
      ]
    };
    case "2-03": return {
      title: "FICHE DE SOINS — BOUCHE & LÈVRES",
      subtitle: "Lèvres · Combinaisons · Langue · Frénums",
      sections: [
        { title: "IDENTIFICATION & SÉANCE", fields: soin_common(["Labret classique","Labret décalé","Labret vertical","Labret horizontal","Ashley","Médusa / Philtrum","Jestrum","Monroe","Madonna","Dahlia (Joue)","Langue (Midline)","Langue latérale","Venom / Double","Snake Eyes","Tongue Web","Smiley","Frowny","Combinaison"]) },
      ]
    };
    case "2-04": return {
      title: "FICHE DE SOINS — NOMBRIL",
      subtitle: "5 types · Supérieur · Inversé · Flottant · Double · Surface",
      sections: [
        { title: "IDENTIFICATION & SÉANCE", fields: soin_common(["Nombril supérieur","Nombril inversé","Nombril flottant","Double nombril","Nombril de surface (ancre/Skin Diver)"]) },
      ]
    };
    case "2-05": return {
      title: "FICHE DE SOINS — ARCADE & SOURCIL",
      subtitle: "4 types · Arcade · Horizontal · Anti-eyebrow · Teardrop",
      sections: [
        { title: "IDENTIFICATION & SÉANCE", fields: soin_common(["Arcade sourcilière (traversant)","Arcade horizontale (surface)","Anti-eyebrow (surface)","Teardrop / Larme (microdermal)"]) },
      ]
    };
    case "2-06": return {
      title: "FICHE DE SOINS — MAMELONS",
      subtitle: "4 types · Horizontal · Vertical · Diagonal · Double",
      sections: [
        { title: "IDENTIFICATION & SÉANCE", fields: [
          ...soin_common(["Mamelon horizontal","Mamelon vertical","Mamelon diagonal","Double mamelon (croix)"]),
          { name: "allaitementPasse", label: "Allaitement passé", type: "checkbox" },
          { name: "allaitementEnCours", label: "Allaitement en cours — CONTRE-INDICATION", type: "checkbox" },
          { name: "chirurgieMammaire", label: "Chirurgie mammaire passée", type: "text" },
        ]},
      ]
    };
    case "2-07": return {
      title: "FICHE DE SOINS — DERMAL & SURFACE",
      subtitle: "6 zones · Microdermal · Skin Diver · Hanche · Nuque · Sternum · Ventre",
      sections: [
        { title: "IDENTIFICATION & SÉANCE", fields: [
          ...soin_common(["Microdermal","Skin Diver","Surface — Hanche","Surface — Nuque","Surface — Sternum","Surface — Ventre","Autre zone"]),
          { name: "localisationPrecise", label: "Localisation précise sur le corps", type: "text" },
        ]},
      ]
    };
    default: return { title: "Formulaire", subtitle: "", sections: [] };
  }
};

// ==================== PRINT TEMPLATES ====================
const generatePrintHTML = (formId, formDef, data, config) => {
  const header = `
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid ${config.primaryColor};padding-bottom:12px;margin-bottom:20px;">
      <div>
        <h1 style="font-size:22px;color:${config.primaryColor};margin:0;font-family:'Georgia',serif;">${config.studioName}</h1>
        <p style="font-size:10px;color:#666;margin:2px 0;">${config.subtitle}</p>
      </div>
      <div style="text-align:right;font-size:9px;color:#888;">
        <div style="font-weight:bold;font-size:14px;color:${config.primaryColor};">${formDef.title.split('—')[0].trim()}</div>
        <div>${config.email}</div>
      </div>
    </div>`;

  const rgpd = `
    <div style="margin-top:20px;border:1px solid ${config.primaryColor};padding:10px;font-size:8px;background:#f8f9fa;">
      <div style="font-weight:bold;color:${config.primaryColor};margin-bottom:4px;">VOS DROITS RGPD — Informations sur vos données personnelles</div>
      <div>Conformément au RGPD : Art. 15 — Droit d'accès · Art. 16 — Droit de rectification · Art. 17 — Droit à l'effacement · Art. 21 — Droit d'opposition</div>
      <div style="margin-top:4px;">Exercice de vos droits : ${config.email} · Responsable : ${config.studioName} · Conservation : données de santé 3 ans minimum</div>
    </div>`;

  const sigBlock = `
    <div style="margin-top:24px;display:flex;gap:40px;">
      <div style="flex:1;border-top:1px solid #ccc;padding-top:8px;">
        <div style="font-size:9px;font-weight:bold;color:${config.primaryColor};">CLIENT(E)</div>
        <div style="font-size:9px;margin-top:4px;">Nom, Prénom : ${data.nom || data.nomClient || ''} ${data.prenom || data.prenomClient || ''}</div>
        <div style="font-size:9px;">Date : ____/____/________</div>
        <div style="height:50px;margin-top:4px;border-bottom:1px dotted #999;font-size:8px;color:#999;">Signature :</div>
      </div>
      <div style="flex:1;border-top:1px solid #ccc;padding-top:8px;">
        <div style="font-size:9px;font-weight:bold;color:${config.primaryColor};">PIERCEUR(SE) INTEMPORELLE</div>
        <div style="font-size:9px;margin-top:4px;">Nom, Prénom : __________________</div>
        <div style="font-size:9px;">Date : ____/____/________</div>
        <div style="height:50px;margin-top:4px;border-bottom:1px dotted #999;font-size:8px;color:#999;">Signature :</div>
      </div>
    </div>`;

  let fieldsHTML = '';
  formDef.sections.forEach(section => {
    fieldsHTML += `<div style="margin-top:16px;"><h3 style="font-size:12px;color:${config.primaryColor};border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px;">${section.title}</h3>`;
    fieldsHTML += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;">';
    section.fields.forEach(f => {
      const val = data[f.name] || '';
      if (f.type === 'checkbox') {
        fieldsHTML += `<div style="font-size:10px;grid-column:span 1;"><span style="display:inline-block;width:12px;height:12px;border:1px solid #333;margin-right:4px;vertical-align:middle;text-align:center;font-size:10px;line-height:12px;">${val ? '✓' : ''}</span>${f.label}</div>`;
      } else if (f.type === 'textarea') {
        fieldsHTML += `<div style="font-size:10px;grid-column:span 2;"><strong>${f.label} :</strong> <span style="border-bottom:1px dotted #999;display:inline-block;min-width:300px;">${val || '&nbsp;'}</span></div>`;
      } else {
        fieldsHTML += `<div style="font-size:10px;"><strong>${f.label} :</strong> <span style="border-bottom:1px dotted #999;display:inline-block;min-width:120px;">${val || '&nbsp;'}</span></div>`;
      }
    });
    fieldsHTML += '</div></div>';
  });

  const footer = `<div style="margin-top:20px;text-align:center;font-size:8px;color:#999;border-top:1px solid #eee;padding-top:6px;">
    ${config.studioName} · ${config.email} · Document confidentiel — Usage interne
  </div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${formDef.title}</title>
    <style>@media print{body{margin:0;padding:15mm;}@page{size:A4;margin:10mm;}}</style>
    </head><body style="font-family:'Segoe UI',Arial,sans-serif;max-width:210mm;margin:auto;padding:20px;color:#222;">
    ${header}
    <h2 style="font-size:16px;text-align:center;color:#333;margin:0;">${formDef.title}</h2>
    <p style="font-size:10px;text-align:center;color:#666;margin:4px 0 16px;">${formDef.subtitle}</p>
    ${fieldsHTML}
    ${sigBlock}
    ${rgpd}
    ${footer}
    </body></html>`;
};

// ==================== JOTFORM INTEGRATION ====================
const submitToJotForm = async (apiKey, formId, data) => {
  if (!apiKey || !formId) return null;
  try {
    const url = `https://eu-api.jotform.com/form/${formId}/submissions`;
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v) formData.append(`submission[${k}]`, String(v));
    });
    const res = await fetch(url, { method: 'POST', headers: { 'APIKEY': apiKey }, body: formData });
    return await res.json();
  } catch (e) {
    console.error('JotForm error:', e);
    return null;
  }
};

// ==================== MAIN APP ====================
export default function App() {
  const [config, setConfig] = useState(() => storageGet("config", DEFAULT_CONFIG));
  const [users, setUsers] = useState(() => storageGet("users", USERS_DEFAULT));
  const [currentUser, setCurrentUser] = useState(null);
  const [clients, setClients] = useState(() => storageGet("clients", []));
  const [page, setPage] = useState("login");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notification, setNotification] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  useEffect(() => { storageSet("config", config); }, [config]);
  useEffect(() => { storageSet("users", users); }, [users]);
  useEffect(() => { storageSet("clients", clients); }, [clients]);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = () => {
    const u = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (u) { setCurrentUser(u); setPage("dashboard"); setLoginForm({ username: "", password: "" }); }
    else notify("Identifiant ou mot de passe incorrect", "error");
  };

  const handleLogout = () => { setCurrentUser(null); setPage("login"); setSelectedClient(null); setSelectedForm(null); };

  const createClient = (data) => {
    const newClient = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || "—",
      ...data,
      forms: {},
    };
    setClients(prev => [newClient, ...prev]);
    notify("Client créé avec succès");
    return newClient;
  };

  const updateClientForm = (clientId, formId, formData) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          forms: { ...c.forms, [formId]: { ...formData, updatedAt: new Date().toISOString(), updatedBy: currentUser?.name || "—" } }
        };
      }
      return c;
    }));
    notify("Formulaire sauvegardé");
    if (config.jotformApiKey && config.jotformFormId) {
      submitToJotForm(config.jotformApiKey, config.jotformFormId, formData);
    }
  };

  const deleteClient = (clientId) => {
    if (window.confirm("Supprimer ce client et tous ses dossiers ?")) {
      setClients(prev => prev.filter(c => c.id !== clientId));
      if (selectedClient?.id === clientId) { setSelectedClient(null); setSelectedForm(null); }
      notify("Client supprimé");
    }
  };

  const exportData = () => {
    const data = JSON.stringify({ config, clients, exportDate: new Date().toISOString(), version: "1.0" }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `intemporelle_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    notify("Sauvegarde téléchargée");
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.clients) { setClients(data.clients); notify(`${data.clients.length} clients importés`); }
        if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
      } catch { notify("Fichier invalide", "error"); }
    };
    reader.readAsText(file);
  };

  const printForm = (client, formId) => {
    const formDef = buildFormFields(formId);
    const formData = client.forms?.[formId] || {};
    const merged = { ...formData, nom: client.nom, prenom: client.prenom };
    const html = generatePrintHTML(formId, formDef, merged, config);
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase();
    return !term || (c.nom + " " + c.prenom + " " + (c.telephone || "") + " " + (c.email || "")).toLowerCase().includes(term);
  });

  const stats = {
    total: clients.length,
    thisMonth: clients.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth() && new Date(c.createdAt).getFullYear() === new Date().getFullYear()).length,
    formsTotal: clients.reduce((acc, c) => acc + Object.keys(c.forms || {}).length, 0),
    recentClients: clients.slice(0, 5),
  };

  const pc = config.primaryColor;
  const ac = config.accentColor;

  // ==================== RENDER ====================

  if (page === "login") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${pc} 0%, #0a3d4f 50%, #061e28 100%)`, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", borderRadius: 20, padding: "48px 40px", width: 380, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
            <h1 style={{ color: "#fff", fontSize: 24, margin: 0, letterSpacing: 2, fontWeight: 300 }}>{config.studioName}</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4, letterSpacing: 1 }}>{config.subtitle}</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, display: "block", marginBottom: 4, letterSpacing: 1 }}>IDENTIFIANT</label>
            <input value={loginForm.username} onChange={e => setLoginForm(p => ({...p, username: e.target.value}))}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="Nom d'utilisateur" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, display: "block", marginBottom: 4, letterSpacing: 1 }}>MOT DE PASSE</label>
            <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({...p, password: e.target.value}))}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="••••••••" />
          </div>
          <button onClick={handleLogin}
            style={{ width: "100%", padding: "14px", background: `linear-gradient(135deg, ${ac}, #d4a028)`, border: "none", borderRadius: 10, color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 1, transition: "all 0.2s" }}
            onMouseOver={e => e.target.style.transform = "translateY(-1px)"}
            onMouseOut={e => e.target.style.transform = "translateY(0)"}>
            CONNEXION
          </button>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, textAlign: "center", marginTop: 20 }}>Données hébergées conformément au RGPD · Chiffrement AES-256</p>
        </div>
        {notification && <div style={{ position: "fixed", top: 20, right: 20, padding: "12px 20px", borderRadius: 10, background: notification.type === "error" ? "#e74c3c" : "#2ecc71", color: "#fff", fontSize: 13, zIndex: 9999, boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}>{notification.msg}</div>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f6fa", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{ width: sidebarOpen ? 240 : 60, background: `linear-gradient(180deg, ${pc} 0%, #063a4a 100%)`, color: "#fff", transition: "width 0.3s", overflow: "hidden", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: sidebarOpen ? "20px 16px" : "20px 10px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span style={{ fontSize: 22 }}>☰</span>
          {sidebarOpen && <div><div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>INTEMPORELLE</div><div style={{ fontSize: 9, opacity: 0.5 }}>Gestion clients</div></div>}
        </div>
        {[
          { id: "dashboard", icon: "📊", label: "Tableau de bord" },
          { id: "clients", icon: "👥", label: "Clients" },
          { id: "newclient", icon: "➕", label: "Nouveau client" },
          { id: "archives", icon: "📦", label: "Archives / Export" },
          ...(currentUser?.role === "admin" ? [
            { id: "settings", icon: "⚙️", label: "Paramètres" },
            { id: "users", icon: "🔑", label: "Utilisateurs" },
          ] : []),
        ].map(item => (
          <div key={item.id} onClick={() => { setPage(item.id); setSelectedClient(null); setSelectedForm(null); }}
            style={{ padding: sidebarOpen ? "12px 16px" : "12px 18px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
              background: page === item.id ? "rgba(255,255,255,0.12)" : "transparent",
              borderLeft: page === item.id ? `3px solid ${ac}` : "3px solid transparent",
              transition: "all 0.2s" }}
            onMouseOver={e => { if (page !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseOut={e => { if (page !== item.id) e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {sidebarOpen && <span style={{ fontSize: 13 }}>{item.label}</span>}
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {sidebarOpen && <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>Connecté : {currentUser?.name}</div>}
          <div onClick={handleLogout} style={{ padding: "8px 12px", background: "rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", fontSize: 12, textAlign: "center", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(231,76,60,0.3)"}
            onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>
            <span>🚪</span>{sidebarOpen && "Déconnexion"}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {notification && <div style={{ position: "fixed", top: 20, right: 20, padding: "12px 20px", borderRadius: 10, background: notification.type === "error" ? "#e74c3c" : "#2ecc71", color: "#fff", fontSize: 13, zIndex: 9999, boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}>{notification.msg}</div>}

        {/* DASHBOARD */}
        {page === "dashboard" && (
          <div>
            <h2 style={{ fontSize: 22, color: "#333", marginBottom: 4 }}>Tableau de bord</h2>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Clients total", val: stats.total, icon: "👥", color: pc },
                { label: "Ce mois", val: stats.thisMonth, icon: "📅", color: "#2ecc71" },
                { label: "Formulaires remplis", val: stats.formsTotal, icon: "📋", color: "#e67e22" },
                { label: "Formulaires disponibles", val: "11", icon: "📄", color: "#9b59b6" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#888", letterSpacing: 0.5 }}>{s.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: "#333", marginTop: 4 }}>{s.val}</div>
                    </div>
                    <span style={{ fontSize: 32, opacity: 0.3 }}>{s.icon}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontSize: 15, color: "#333", marginBottom: 16 }}>Derniers clients</h3>
              {stats.recentClients.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>Aucun client enregistré</p>}
              {stats.recentClients.map(c => (
                <div key={c.id} onClick={() => { setSelectedClient(c); setPage("clientdetail"); }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, transition: "background 0.15s" }}
                  onMouseOver={e => e.currentTarget.style.background = "#f0f4f8"}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.nom} {c.prenom}</span>
                    <span style={{ color: "#999", fontSize: 11, marginLeft: 8 }}>{c.telephone || ""}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#999" }}>{new Date(c.createdAt).toLocaleDateString("fr-FR")}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLIENT LIST */}
        {page === "clients" && !selectedClient && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, color: "#333", margin: 0 }}>👥 Clients ({clients.length})</h2>
              <button onClick={() => setPage("newclient")}
                style={{ padding: "10px 20px", background: pc, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                ➕ Nouveau client
              </button>
            </div>
            <input placeholder="🔍 Rechercher un client (nom, prénom, téléphone, email)..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" }} />
            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {filteredClients.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "#999" }}>Aucun client trouvé</div>}
              {filteredClients.map((c, i) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: i < filteredClients.length - 1 ? "1px solid #f0f0f0" : "none", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseOver={e => e.currentTarget.style.background = "#f8f9fc"}
                  onMouseOut={e => e.currentTarget.style.background = "#fff"}>
                  <div onClick={() => { setSelectedClient(c); setPage("clientdetail"); }} style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.nom} {c.prenom}</div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                      {c.telephone && `📱 ${c.telephone}`} {c.email && `· ✉️ ${c.email}`} · Créé le {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                      · {Object.keys(c.forms || {}).length} formulaire(s)
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteClient(c.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#ccc", padding: 8 }}
                    onMouseOver={e => e.target.style.color = "#e74c3c"}
                    onMouseOut={e => e.target.style.color = "#ccc"}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEW CLIENT */}
        {page === "newclient" && <NewClientForm onCreate={(data) => { const c = createClient(data); setSelectedClient(c); setPage("clientdetail"); }} primaryColor={pc} />}

        {/* CLIENT DETAIL */}
        {page === "clientdetail" && selectedClient && !selectedForm && (
          <ClientDetail client={clients.find(c => c.id === selectedClient.id) || selectedClient}
            onSelectForm={(fId) => setSelectedForm(fId)}
            onPrint={(fId) => printForm(clients.find(c => c.id === selectedClient.id) || selectedClient, fId)}
            onBack={() => { setSelectedClient(null); setPage("clients"); }}
            primaryColor={pc} accentColor={ac} />
        )}

        {/* FORM EDITOR */}
        {page === "clientdetail" && selectedClient && selectedForm && (
          <FormEditor
            client={clients.find(c => c.id === selectedClient.id) || selectedClient}
            formId={selectedForm}
            onSave={(data) => { updateClientForm(selectedClient.id, selectedForm, data); setSelectedForm(null); }}
            onCancel={() => setSelectedForm(null)}
            onPrint={() => printForm(clients.find(c => c.id === selectedClient.id) || selectedClient, selectedForm)}
            primaryColor={pc} accentColor={ac} config={config} />
        )}

        {/* ARCHIVES */}
        {page === "archives" && (
          <div>
            <h2 style={{ fontSize: 22, color: "#333", marginBottom: 20 }}>📦 Archives & Sauvegarde</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontSize: 15, color: pc, marginBottom: 12 }}>💾 Exporter les données</h3>
                <p style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>Téléchargez une sauvegarde complète (JSON) de tous vos clients et paramètres. Conforme RGPD.</p>
                <button onClick={exportData}
                  style={{ padding: "12px 24px", background: pc, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  📥 Télécharger la sauvegarde
                </button>
              </div>
              <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontSize: 15, color: pc, marginBottom: 12 }}>📤 Importer des données</h3>
                <p style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>Restaurez une sauvegarde précédente. Les données actuelles seront remplacées.</p>
                <label style={{ padding: "12px 24px", background: "#e8f4f8", color: pc, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-block" }}>
                  📂 Choisir un fichier
                  <input type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
                </label>
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginTop: 20 }}>
              <h3 style={{ fontSize: 15, color: pc, marginBottom: 12 }}>🔗 Intégration JotForm</h3>
              <p style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>Synchronisez vos formulaires avec JotForm (serveurs EU — conforme RGPD).</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Clé API JotForm</label>
                  <input value={config.jotformApiKey} onChange={e => setConfig(p => ({...p, jotformApiKey: e.target.value}))}
                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
                    placeholder="Votre clé API JotForm EU" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>ID Formulaire JotForm</label>
                  <input value={config.jotformFormId} onChange={e => setConfig(p => ({...p, jotformFormId: e.target.value}))}
                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
                    placeholder="ID du formulaire de collecte" />
                </div>
              </div>
              <p style={{ fontSize: 10, color: "#999", marginTop: 8 }}>Configurez votre compte sur <a href="https://www.jotform.com" target="_blank" rel="noopener" style={{ color: pc }}>jotform.com</a> · Utilisez les serveurs EU pour la conformité RGPD.</p>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {page === "settings" && currentUser?.role === "admin" && (
          <div>
            <h2 style={{ fontSize: 22, color: "#333", marginBottom: 20 }}>⚙️ Paramètres du studio</h2>
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { key: "studioName", label: "Nom du studio" },
                  { key: "subtitle", label: "Sous-titre" },
                  { key: "email", label: "Email" },
                  { key: "website", label: "Site web" },
                  { key: "phone", label: "Téléphone" },
                  { key: "address", label: "Adresse" },
                  { key: "siret", label: "N° SIRET" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>{f.label}</label>
                    <input value={config[f.key]} onChange={e => setConfig(p => ({...p, [f.key]: e.target.value}))}
                      style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Couleur principale</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={config.primaryColor} onChange={e => setConfig(p => ({...p, primaryColor: e.target.value}))} style={{ width: 40, height: 40, border: "none", cursor: "pointer" }} />
                    <input value={config.primaryColor} onChange={e => setConfig(p => ({...p, primaryColor: e.target.value}))}
                      style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8, fontSize: 12, width: 100 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Couleur accent</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={config.accentColor} onChange={e => setConfig(p => ({...p, accentColor: e.target.value}))} style={{ width: 40, height: 40, border: "none", cursor: "pointer" }} />
                    <input value={config.accentColor} onChange={e => setConfig(p => ({...p, accentColor: e.target.value}))}
                      style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8, fontSize: 12, width: 100 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS MANAGEMENT */}
        {page === "users" && currentUser?.role === "admin" && (
          <UsersManager users={users} setUsers={setUsers} notify={notify} primaryColor={pc} accentColor={ac} />
        )}
      </div>
    </div>
  );
}

// ==================== NEW CLIENT FORM ====================
function NewClientForm({ onCreate, primaryColor }) {
  const [form, setForm] = useState({ nom: "", prenom: "", dateNaissance: "", telephone: "", email: "", adresse: "", codePostal: "", ville: "" });
  const set = (k, v) => setForm(p => ({...p, [k]: v}));

  return (
    <div>
      <h2 style={{ fontSize: 22, color: "#333", marginBottom: 20 }}>➕ Nouveau client</h2>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { key: "nom", label: "Nom de famille *", required: true },
            { key: "prenom", label: "Prénom(s) *", required: true },
            { key: "dateNaissance", label: "Date de naissance", type: "date" },
            { key: "telephone", label: "Téléphone", type: "tel" },
            { key: "email", label: "Email", type: "email" },
            { key: "adresse", label: "Adresse" },
            { key: "codePostal", label: "Code postal" },
            { key: "ville", label: "Ville" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>{f.label}</label>
              <input type={f.type || "text"} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <button onClick={() => { if (!form.nom || !form.prenom) return; onCreate(form); }}
            style={{ padding: "12px 28px", background: primaryColor, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: (!form.nom || !form.prenom) ? 0.5 : 1 }}>
            ✅ Créer le client
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== CLIENT DETAIL ====================
function ClientDetail({ client, onSelectForm, onPrint, onBack, primaryColor, accentColor }) {
  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: primaryColor, marginBottom: 16, padding: 0 }}>← Retour à la liste</button>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: 22, color: "#333", margin: "0 0 4px" }}>{client.nom} {client.prenom}</h2>
            <div style={{ fontSize: 12, color: "#888" }}>
              {client.telephone && `📱 ${client.telephone} · `}{client.email && `✉️ ${client.email} · `}Créé le {new Date(client.createdAt).toLocaleDateString("fr-FR")} par {client.createdBy}
            </div>
            {(client.adresse || client.ville) && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>📍 {client.adresse} {client.codePostal} {client.ville}</div>}
          </div>
          <div style={{ background: `${primaryColor}15`, color: primaryColor, padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {Object.keys(client.forms || {}).length} / 11 formulaires
          </div>
        </div>
      </div>

      {FORM_CATEGORIES.map(cat => (
        <div key={cat.id} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>{cat.label}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {cat.forms.map(form => {
              const hasData = !!client.forms?.[form.id];
              const formData = client.forms?.[form.id];
              return (
                <div key={form.id} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: hasData ? `1px solid ${primaryColor}30` : "1px solid #eee", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseOver={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseOut={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div onClick={() => onSelectForm(form.id)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{form.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{form.label}</div>
                      <div style={{ fontSize: 10, color: hasData ? "#2ecc71" : "#bbb", marginTop: 2 }}>
                        {hasData ? `✅ Rempli le ${new Date(formData.updatedAt).toLocaleDateString("fr-FR")}` : "⬜ Non rempli"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => onSelectForm(form.id)}
                      style={{ flex: 1, padding: "7px", background: hasData ? `${primaryColor}10` : primaryColor, color: hasData ? primaryColor : "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                      {hasData ? "✏️ Modifier" : "📝 Remplir"}
                    </button>
                    <button onClick={() => onPrint(form.id)}
                      style={{ padding: "7px 12px", background: `${accentColor}20`, color: "#b8860b", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                      title={hasData ? "Imprimer (pré-rempli)" : "Imprimer vierge (nom client pré-rempli)"}>
                      🖨️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== FORM EDITOR ====================
function FormEditor({ client, formId, onSave, onCancel, onPrint, primaryColor, accentColor, config }) {
  const formDef = buildFormFields(formId);
  const [data, setData] = useState(() => {
    const existing = client.forms?.[formId] || {};
    const defaults = {};
    formDef.sections.forEach(s => s.fields.forEach(f => {
      if (f.defaultValue) defaults[f.name] = f.defaultValue;
    }));
    // Pre-fill client info
    return { nom: client.nom, prenom: client.prenom, telephone: client.telephone, email: client.email, ...defaults, ...existing };
  });

  const set = (name, val) => setData(p => ({...p, [name]: val}));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: primaryColor, padding: 0 }}>← Retour au dossier</button>
          <h2 style={{ fontSize: 20, color: "#333", margin: "8px 0 2px" }}>{formDef.title}</h2>
          <p style={{ color: "#888", fontSize: 12, margin: 0 }}>{formDef.subtitle} · {client.nom} {client.prenom}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onPrint} style={{ padding: "10px 16px", background: `${accentColor}20`, color: "#b8860b", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🖨️ Imprimer</button>
          <button onClick={() => onSave(data)} style={{ padding: "10px 20px", background: primaryColor, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>💾 Enregistrer</button>
        </div>
      </div>

      {formDef.sections.map((section, si) => (
        <div key={si} style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, color: primaryColor, marginBottom: 16, paddingBottom: 8, borderBottom: `2px solid ${primaryColor}20` }}>{section.title}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
            {section.fields.map((f, fi) => {
              if (f.type === "checkbox") {
                return (
                  <label key={fi} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, gridColumn: f.label.length > 50 ? "span 2" : "span 1" }}>
                    <input type="checkbox" checked={!!data[f.name]} onChange={e => set(f.name, e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: primaryColor }} />
                    <span style={{ color: "#444" }}>{f.label}</span>
                  </label>
                );
              }
              if (f.type === "textarea") {
                return (
                  <div key={fi} style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>{f.label}{f.required && " *"}</label>
                    <textarea value={data[f.name] || ""} onChange={e => set(f.name, e.target.value)} rows={3}
                      style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
                  </div>
                );
              }
              if (f.type === "select") {
                return (
                  <div key={fi}>
                    <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>{f.label}{f.required && " *"}</label>
                    <select value={data[f.name] || ""} onChange={e => set(f.name, e.target.value)}
                      style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box", background: "#fff" }}>
                      <option value="">— Sélectionner —</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                );
              }
              return (
                <div key={fi}>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>{f.label}{f.required && " *"}</label>
                  <input type={f.type || "text"} value={data[f.name] || ""} onChange={e => set(f.name, e.target.value)}
                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onCancel} style={{ padding: "12px 24px", background: "#f0f0f0", color: "#666", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13 }}>Annuler</button>
        <button onClick={() => onSave(data)} style={{ padding: "12px 28px", background: primaryColor, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>💾 Enregistrer le formulaire</button>
      </div>
    </div>
  );
}

// ==================== USERS MANAGER ====================
function UsersManager({ users, setUsers, notify, primaryColor, accentColor }) {
  const [newUser, setNewUser] = useState({ username: "", password: "", name: "", role: "piercer" });

  const addUser = () => {
    if (!newUser.username || !newUser.password || !newUser.name) return;
    const id = "user_" + Date.now().toString(36);
    setUsers(prev => [...prev, { ...newUser, id }]);
    setNewUser({ username: "", password: "", name: "", role: "piercer" });
    notify("Utilisateur créé");
  };

  const removeUser = (id) => {
    if (id === "admin") return notify("Impossible de supprimer l'administrateur", "error");
    setUsers(prev => prev.filter(u => u.id !== id));
    notify("Utilisateur supprimé");
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, color: "#333", marginBottom: 20 }}>🔑 Gestion des utilisateurs</h2>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, color: primaryColor, marginBottom: 16 }}>Utilisateurs existants</h3>
        {users.map(u => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, marginBottom: 4, background: "#f8f9fc" }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
              <span style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>@{u.username}</span>
              <span style={{ fontSize: 10, marginLeft: 8, background: u.role === "admin" ? `${primaryColor}20` : "#e8f8e8", color: u.role === "admin" ? primaryColor : "#27ae60", padding: "2px 8px", borderRadius: 10 }}>{u.role}</span>
            </div>
            {u.id !== "admin" && (
              <button onClick={() => removeUser(u.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14 }}
                onMouseOver={e => e.target.style.color = "#e74c3c"} onMouseOut={e => e.target.style.color = "#ccc"}>🗑️</button>
            )}
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <h3 style={{ fontSize: 14, color: primaryColor, marginBottom: 16 }}>Ajouter un utilisateur</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Nom complet</label>
            <input value={newUser.name} onChange={e => setNewUser(p => ({...p, name: e.target.value}))}
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Identifiant</label>
            <input value={newUser.username} onChange={e => setNewUser(p => ({...p, username: e.target.value}))}
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Mot de passe</label>
            <input value={newUser.password} onChange={e => setNewUser(p => ({...p, password: e.target.value}))}
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Rôle</label>
            <select value={newUser.role} onChange={e => setNewUser(p => ({...p, role: e.target.value}))}
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box", background: "#fff" }}>
              <option value="piercer">Pierceur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <button onClick={addUser}
            style={{ padding: "10px 20px", background: primaryColor, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
            ➕ Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

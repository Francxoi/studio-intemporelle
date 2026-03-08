# Studio INTEMPORELLE — Gestion Clients Piercing

Application de gestion de dossiers clients pour salon de piercing.  
11 formulaires (4 administratifs + 7 fiches de soins), multi-utilisateurs, impression, sauvegarde RGPD.

---

## Identifiants par défaut

| Rôle          | Identifiant  | Mot de passe        |
|---------------|-------------|---------------------|
| Administrateur | `admin`     | `Intemporelle2024!` |
| Pierceur       | `pierceur1` | `Piercing2024!`     |

Modifiables dans **Utilisateurs** (accès admin uniquement).

---

## Déploiement sur GitHub Pages — Guide pas à pas

### Étape 1 — Créer le dépôt GitHub

1. Va sur https://github.com/new
2. Nom du dépôt : `studio-intemporelle`
3. Laisse "Public" coché
4. Ne coche PAS "Add a README"
5. Clique **Create repository**

### Étape 2 — Ouvrir un terminal Windows

Appuie sur `Windows + R`, tape `powershell`, puis Entrée.

### Étape 3 — Extraire et préparer le projet

Déplace le fichier ZIP téléchargé où tu veux (par exemple `C:\Users\TonNom\Documents\`), puis :

```powershell
cd C:\Users\TonNom\Documents\
```

Décompresse le ZIP (clic droit > Extraire tout), puis entre dans le dossier :

```powershell
cd studio-intemporelle
```

### Étape 4 — Installer les dépendances

```powershell
npm install
```

Ça prend 1-2 minutes. Tu verras un dossier `node_modules` apparaître.

### Étape 5 — Tester en local (optionnel mais recommandé)

```powershell
npm run dev
```

Ouvre http://localhost:5173/studio-intemporelle/ dans ton navigateur.  
Tu devrais voir l'écran de connexion INTEMPORELLE.  
`Ctrl+C` pour arrêter le serveur local.

### Étape 6 — Connecter à GitHub et déployer

Remplace `TON-PSEUDO-GITHUB` par ton vrai pseudo GitHub :

```powershell
git init
git add .
git commit -m "Initial commit - Studio INTEMPORELLE"
git branch -M main
git remote add origin https://github.com/TON-PSEUDO-GITHUB/studio-intemporelle.git
git push -u origin main
```

Puis déploie sur GitHub Pages :

```powershell
npm run deploy
```

### Étape 7 — Activer GitHub Pages

1. Va sur https://github.com/TON-PSEUDO-GITHUB/studio-intemporelle/settings/pages
2. Sous **Source**, sélectionne la branche `gh-pages`
3. Dossier : `/ (root)`
4. Clique **Save**

### Étape 8 — Accéder à ton application

Après 1-2 minutes, ton app sera en ligne :

```
https://TON-PSEUDO-GITHUB.github.io/studio-intemporelle/
```

---

## Mettre à jour l'application

Après modification des fichiers :

```powershell
npm run deploy
```

C'est tout. La mise à jour est en ligne en 1-2 minutes.

---

## Configuration JotForm

1. Crée un compte sur https://www.jotform.com (choisir serveurs EU pour RGPD)
2. Crée un formulaire de collecte de données
3. Va dans **Paramètres du compte** > **API** > copie ta clé API
4. Dans l'app, va dans **Archives > Intégration JotForm**
5. Colle ta clé API et l'ID du formulaire

---

## Structure du projet

```
studio-intemporelle/
├── index.html          ← Page HTML principale
├── package.json        ← Dépendances npm
├── vite.config.js      ← Configuration Vite + base path
├── src/
│   ├── main.jsx        ← Point d'entrée React
│   └── App.jsx         ← Application complète
└── README.md           ← Ce fichier
```

---

## Conformité RGPD

- Données stockées en localStorage (navigateur client uniquement)
- Export/Import JSON chiffrable
- Intégration JotForm EU disponible
- Mentions RGPD sur chaque formulaire imprimé
- Droit d'accès, rectification, effacement intégrés

---

*Développé pour Studio INTEMPORELLE · contact@intemporelle.eu*

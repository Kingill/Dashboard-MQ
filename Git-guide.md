# 🔧 Guide Git - Dashboard MQ

## 📦 Mise en place de Git pour votre projet

### 1️⃣ Créer un fichier .gitignore à la racine

**Chemin** : `/dashboard-mq/.gitignore`

```bash
cd /path/to/dashboard-mq
nano .gitignore
```

**Contenu du .gitignore** :

```gitignore
# Dependencies
node_modules/
package-lock.json

# Build outputs
dist/
build/
*.log

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

---

## 🚀 Initialiser Git

### Option A : Repository local uniquement

```bash
cd /path/to/dashboard-mq

# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Dashboard MQ refactorisé"
```

### Option B : Avec GitHub/GitLab (Recommandé)

#### Étape 1 : Créer un repository sur GitHub

1. Aller sur https://github.com
2. Cliquer sur **New repository**
3. Nom : `dashboard-mq`
4. Description : "Dashboard MQ - Application Multi-UA"
5. **NE PAS** cocher "Initialize with README" (vous en avez déjà un)
6. Cliquer sur **Create repository**

#### Étape 2 : Connecter votre projet local

```bash
cd /path/to/dashboard-mq

# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Dashboard MQ refactorisé

- Frontend React modulaire (auth-app/)
- Backend Express API (api-server/)
- SessionStorage + auto-renewal
- Support multi-utilisateurs
- CRUD pages UA"

# Ajouter l'origine GitHub (remplacer YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/dashboard-mq.git

# Pousser vers GitHub
git branch -M main
git push -u origin main
```

---

## 📁 Structure Git résultante

```
dashboard-mq/
├── .git/                      # 📂 Données Git (créé automatiquement)
├── .gitignore                 # ✅ À créer
├── README.md                  # ✅ Déjà présent
│
├── api-server/
│   ├── api-server.js         # ✅ Versionné
│   ├── package.json          # ✅ Versionné
│   └── node_modules/         # ❌ Ignoré (.gitignore)
│
├── auth-app/
│   ├── src/                  # ✅ Versionné
│   ├── index.html            # ✅ Versionné
│   ├── vite.config.js        # ✅ Versionné
│   ├── package.json          # ✅ Versionné
│   └── node_modules/         # ❌ Ignoré (.gitignore)
│
└── public/
    └── ua-pages/             # ✅ Versionné
        ├── index.json
        ├── TestUA.json
        └── 2164.json
```

---

## 🔄 Workflow Git quotidien

### Ajouter des modifications

```bash
# Voir les fichiers modifiés
git status

# Ajouter un fichier spécifique
git add auth-app/src/components/Dashboard.jsx

# Ou ajouter tous les fichiers modifiés
git add .

# Commiter avec un message
git commit -m "Fix: Correction du bug de renouvellement de session"

# Pousser vers GitHub
git push
```

### Vérifier l'historique

```bash
# Voir les derniers commits
git log --oneline

# Voir les modifications d'un fichier
git diff auth-app/src/hooks/useAuth.js
```

### Créer une branche pour une nouvelle fonctionnalité

```bash
# Créer et basculer sur une nouvelle branche
git checkout -b feature/websocket-support

# Faire vos modifications...
git add .
git commit -m "Add: WebSocket support for real-time sync"

# Pousser la branche
git push -u origin feature/websocket-support

# Retourner sur main
git checkout main

# Fusionner la branche
git merge feature/websocket-support
```

---

## 📝 Messages de commit recommandés

### Convention

```
<type>: <description courte>

[corps optionnel]
```

### Types

- **feat** : Nouvelle fonctionnalité
- **fix** : Correction de bug
- **refactor** : Refactorisation du code
- **docs** : Documentation
- **style** : Formatage, points-virgules manquants, etc.
- **test** : Ajout de tests
- **chore** : Tâches de maintenance

### Exemples

```bash
git commit -m "feat: Add WebSocket support for real-time synchronization"
git commit -m "fix: Resolve session expiration bug"
git commit -m "refactor: Split Dashboard component into smaller parts"
git commit -m "docs: Update README with Git instructions"
git commit -m "chore: Update dependencies"
```

---

## 🌿 Stratégie de branches

### Branches principales

```
main (ou master)     → Production
develop              → Développement
```

### Branches de fonctionnalités

```
feature/nom-feature  → Nouvelle fonctionnalité
bugfix/nom-bug       → Correction de bug
hotfix/nom-hotfix    → Correction urgente en production
```

### Exemple de workflow

```bash
# Développement d'une nouvelle fonctionnalité
git checkout -b feature/prometheus-integration
# ... développement ...
git commit -m "feat: Integrate Prometheus metrics"
git push -u origin feature/prometheus-integration

# Sur GitHub : Créer une Pull Request
# Après review : Merger dans develop
# Tester sur develop
# Merger develop dans main quand prêt
```

---

## 🔐 Ignorer des fichiers sensibles

Si vous avez des fichiers avec des secrets (mots de passe, API keys) :

### Créer un fichier .env (jamais versionné)

```bash
# auth-app/.env
VITE_OAUTH_URL=http://localhost:8000
VITE_API_URL=http://localhost:3001

# api-server/.env
PORT=3001
OAUTH_SECRET=your_secret_here
```

### Ajouter .env au .gitignore

```gitignore
# .gitignore (à la racine)
.env
.env.local
.env.*.local
```

### Créer un fichier .env.example (versionné)

```bash
# auth-app/.env.example
VITE_OAUTH_URL=http://localhost:8000
VITE_API_URL=http://localhost:3001
```

```bash
git add auth-app/.env.example
git commit -m "docs: Add .env.example for configuration reference"
```

---

## 📤 Partager le projet

### Pour un collègue qui veut travailler sur le projet

```bash
# Cloner le repository
git clone https://github.com/YOUR_USERNAME/dashboard-mq.git
cd dashboard-mq

# Installer les dépendances backend
cd api-server
npm install
cd ..

# Installer les dépendances frontend
cd auth-app
npm install
cd ..

# Créer les fichiers .env (copier depuis .env.example)
# Démarrer l'application
```

---

## 🛡️ Bonnes pratiques

### ✅ À faire

1. **Commiter souvent** - Petits commits fréquents
2. **Messages clairs** - Décrire ce qui a changé et pourquoi
3. **Tester avant de commiter** - S'assurer que le code fonctionne
4. **Utiliser .gitignore** - Ne jamais versionner node_modules/
5. **Créer des branches** - Une branche par fonctionnalité

### ❌ À éviter

1. **Commiter node_modules/** - Trop volumineux
2. **Commiter .env** - Contient des secrets
3. **Gros commits** - Difficile à review
4. **Messages vagues** - "Fix", "Update", "WIP"
5. **Commiter du code qui ne compile pas**

---

## 🔧 Commandes utiles

```bash
# Annuler le dernier commit (mais garder les modifications)
git reset --soft HEAD~1

# Annuler toutes les modifications locales
git reset --hard

# Récupérer un fichier depuis le dernier commit
git checkout HEAD -- fichier.js

# Voir les différences avant de commiter
git diff

# Voir l'état du repository
git status

# Lister toutes les branches
git branch -a

# Supprimer une branche locale
git branch -d nom-branche

# Renommer la branche actuelle
git branch -m nouveau-nom
```

---

## 📊 Exemple complet

```bash
# 1. Initialisation
cd /home/gilles/dashboard-mq
git init
nano .gitignore  # Copier le contenu du .gitignore ci-dessus
git add .
git commit -m "Initial commit - Dashboard MQ

Architecture:
- Frontend: React + Vite (auth-app/)
- Backend: Express API (api-server/)
- Storage: JSON files (public/ua-pages/)

Features:
- OAuth authentication with JWT
- SessionStorage persistence
- Auto-renewal based on activity
- Multi-user support
- CRUD for UA pages"

# 2. Créer repository sur GitHub
# (via l'interface web)

# 3. Connecter et pousser
git remote add origin https://github.com/votre-username/dashboard-mq.git
git branch -M main
git push -u origin main

# 4. Modifications futures
git add .
git commit -m "feat: Add new feature"
git push
```

---

## 🎯 Checklist avant le premier push

- [ ] Fichier `.gitignore` créé à la racine
- [ ] `node_modules/` dans `.gitignore`
- [ ] Secrets (`.env`) dans `.gitignore`
- [ ] README.md à jour
- [ ] Code testé et fonctionnel
- [ ] `git status` ne montre pas de fichiers indésirables
- [ ] Message de commit descriptif

---

**Votre projet est maintenant prêt pour Git ! 🎉**

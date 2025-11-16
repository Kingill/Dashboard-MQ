# 📊 Dashboard MQ - Monitoring Multi-UA avec Prometheus

Dashboard de monitoring en temps réel pour la gestion de files d'attente MessageQueue avec intégration Prometheus par unité d'affectation (UA) et métriques IBM MQ dynamiques.

## 🚀 Fonctionnalités

- **Authentification JWT** : Système d'authentification sécurisé avec gestion des rôles (Admin/User)
- **Multi-UA** : Gestion de plusieurs unités d'affectation avec pages personnalisées
- **Métriques temps réel** : Monitoring CPU, mémoire, goroutines, services actifs
- **Métriques IBM MQ dynamiques** : Découverte automatique des QMGR et Queues
  - Sélection dynamique du Queue Manager
  - Sélection dynamique des Queues
  - 162+ métriques IBM MQ disponibles
  - Plages de temps configurables (5m, 30m, 1h, 1j)
- **Graphiques interactifs** : Visualisation des tendances avec recharts
  - Graphiques en escalier (step) pour les métriques MQ
  - Gauges pour valeurs instantanées
- **Rafraîchissement manuel** : Contrôle total sur le rechargement des données
- **Configuration dynamique** : Métriques Prometheus configurables par fichiers JSON
- **Panneau d'administration** : Gestion des pages UA (création, modification, suppression)
- **Responsive** : Interface adaptative pour desktop et mobile

---

## 📁 Structure du projet
```
dashboard-mq/
├── api-server/              # Backend Express + API Prometheus
│   ├── api-server.js        # Serveur principal avec routes Prometheus & UA
│   ├── .env                 # Configuration backend (PORT, PROMETHEUS_URL)
│   └── package.json
│
├── auth-app/                # Frontend React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.jsx                 # Point d'entrée application
│   │   │   ├── Dashboard.jsx           # Composant principal dashboard
│   │   │   ├── GlobalMetrics.jsx       # Métriques globales Prometheus
│   │   │   ├── UAMetrics.jsx           # Métriques UA spécifiques
│   │   │   ├── MQMetrics.jsx           # Métriques IBM MQ (QMGR/Queue)
│   │   │   ├── PrometheusWidget.jsx    # Widget générique (gauge/graph)
│   │   │   ├── LoginPage.jsx           # Page de connexion
│   │   │   ├── ProfilePage.jsx         # Page profil utilisateur
│   │   │   ├── AdminPanel.jsx          # Panneau d'administration
│   │   │   └── Sidebar.jsx             # Barre de navigation latérale
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js              # Hook authentification JWT
│   │   │   ├── usePrometheus.js        # Hook pour fetch Prometheus
│   │   │   └── useUAPages.js           # Hook pour gestion pages UA
│   │   │
│   │   └── styles/
│   │       └── styles.js               # Styles partagés
│   │
│   ├── .env                 # Variables d'environnement (VITE_API_URL)
│   ├── vite.config.js       # Configuration Vite + proxy
│   ├── package.json
│   └── index.html
│
└── public/
    ├── prometheus-global.json          # Configuration métriques globales
    └── ua-pages/
        ├── UA2164.json                 # Config UA TestUA (avec Prometheus)
        ├── UA2118.json                 # Config UA 2118
        └── 8888.json                   # Config UA 8888
```

### 🔑 Fichiers clés

#### Backend (`api-server/`)
- **`api-server.js`** : Serveur Express avec routes pour :
  - Authentification JWT
  - Gestion des pages UA (CRUD)
  - Proxy Prometheus (query, query_range, health)
  - Routes pour métriques globales et spécifiques UA

#### Frontend (`auth-app/src/`)

**Composants principaux :**
- **`App.jsx`** : Gestion de l'authentification et navigation
- **`Dashboard.jsx`** : Affichage des métriques globales, UA et MQ
- **`MQMetrics.jsx`** : Sélection dynamique QMGR/Queue + graphiques IBM MQ
- **`PrometheusWidget.jsx`** : Rendu des métriques (gauge/graph en escalier)

**Hooks :**
- **`useAuth.js`** : Authentification JWT avec décodage token
- **`usePrometheus.js`** : Requêtes Prometheus (instantanées et range)
- **`useUAPages.js`** : Gestion CRUD des pages UA

**Configuration :**
- **`prometheus-global.json`** : Définition des métriques globales (CPU, RAM, etc.)
- **`ua-pages/*.json`** : Configurations spécifiques par UA avec requêtes Prometheus

---

## 🛠️ Installation

### Prérequis

- **Node.js** >= 18.x
- **Prometheus** sur http://localhost:9090
- **IBM MQ Exporter** (optionnel, pour métriques MQ)
- **npm** ou **yarn**

### 1. Cloner le repository
```bash
git clone <votre-repo>
cd dashboard-mq
```

### 2. Installer les dépendances

#### Backend
```bash
cd api-server
npm install
```

#### Frontend
```bash
cd ../auth-app
npm install
```

### 3. Configuration

#### Backend - Créer le fichier .env
```bash
cd api-server
cat > .env << 'EOF'
# Backend API Server Configuration
PORT=3001
PROMETHEUS_URL=http://localhost:9090
EOF
```

**Si Prometheus est sur un autre serveur :**
```bash
# Exemple avec Prometheus distant
PORT=3001
PROMETHEUS_URL=http://prometheus.example.com:9090
```

#### Frontend - Créer le fichier .env
```bash
cd auth-app
cat > .env << 'EOF'
VITE_OAUTH_URL=http://localhost:8000
VITE_API_URL=/api
EOF
```

#### Prometheus - Configuration
Assurez-vous que Prometheus tourne sur http://localhost:9090 et qu'il scrape l'IBM MQ Exporter si vous souhaitez utiliser les métriques MQ.

---

## ⚙️ Variables d'environnement

### Backend (`api-server/.env`)
```bash
# Port du serveur backend
PORT=3001

# URL de Prometheus (modifiable si Prometheus est ailleurs)
PROMETHEUS_URL=http://localhost:9090
```

**Exemples de configurations :**

| Scénario | Configuration |
|----------|---------------|
| **Développement local** | `PROMETHEUS_URL=http://localhost:9090` |
| **Prometheus distant** | `PROMETHEUS_URL=http://prometheus.example.com:9090` |
| **Docker Compose** | `PROMETHEUS_URL=http://prometheus:9090` |
| **Avec authentification** | `PROMETHEUS_URL=http://user:pass@prometheus.example.com:9090` |
| **IP réseau** | `PROMETHEUS_URL=http://192.168.1.50:9090` |

### Frontend (`auth-app/.env`)
```bash
# URL du serveur OAuth
VITE_OAUTH_URL=http://localhost:8000

# URL de l'API backend (utilise le proxy Vite)
VITE_API_URL=/api
```

**Note importante** : Le frontend utilise le proxy Vite configuré dans `vite.config.js`. Les requêtes vers `/api` sont automatiquement redirigées vers `http://localhost:3001`.

---

## ▶️ Démarrage

### Terminal 1 : Backend
```bash
cd api-server
npm start
```
✅ Serveur démarré sur http://localhost:3001

### Terminal 2 : Frontend
```bash
cd auth-app
npm run dev
```
✅ Application disponible sur http://localhost:3000

### Terminal 3 : Prometheus (si non démarré)
```bash
prometheus --config.file=prometheus.yml
```
✅ Prometheus disponible sur http://localhost:9090

---

## 📊 Architecture
```
┌──────────────┐     HTTP      ┌──────────────┐    PromQL    ┌─────────────┐
│   Frontend   │ ──────────>   │   Backend    │ ──────────>  │ Prometheus  │
│ React + Vite │   (Proxy)     │   Express    │              │   :9090     │
│   :3000      │ <────────     │   :3001      │ <──────────  │             │
└──────────────┘               └──────────────┘              └─────────────┘
       │                              │                              │
       │                              │                              │
       ↓                              ↓                              ↓
  Composants React          API Routes Express              IBM MQ Exporter
  ┌──────────────┐         ┌──────────────────┐            ┌──────────────┐
  │ - Dashboard  │         │ Auth & JWT       │            │ Métriques MQ │
  │ - MQMetrics  │         │ /api/auth/*      │            │ - QMGR       │
  │ - Global     │         │                  │            │ - Queues     │
  │ - UAMetrics  │         │ UA Pages         │            │ - Channels   │
  │ - Widgets    │         │ /api/ua-pages/*  │            │ - Topics     │
  └──────────────┘         │                  │            └──────────────┘
       │                   │ Prometheus Proxy │
       │                   │ /api/prometheus/*│
       │                   │  - /health       │
       ↓                   │  - /global       │
  Hooks React             │  - /ua/:name     │
  ┌──────────────┐         │  - /query        │
  │ - useAuth    │         │  - /query_range  │
  │ - usePrometheus        │  - /labels/:name │
  │ - useUAPages │         └──────────────────┘
  └──────────────┘
```

### 🔄 Flux de données

#### 1️⃣ **Authentification**
```
User → Login → Backend JWT → Token → Frontend Storage → Requêtes authentifiées
```

#### 2️⃣ **Métriques Globales**
```
Frontend → /api/prometheus/global → Backend → Prometheus → 
prometheus-global.json (config) → Enrichissement → Frontend (widgets)
```

#### 3️⃣ **Métriques IBM MQ**
```
Frontend (MQMetrics) → 
  1. Découverte: /api/prometheus/query?query={__name__=~"ibmmq.*"}
  2. QMGR: Extraction des labels 'qmgr'
  3. Queues: Extraction des labels 'queue'
  4. Métriques: /api/prometheus/query_range (graphiques)
→ Backend → Prometheus → IBM MQ Exporter → Widgets
```

#### 4️⃣ **Pages UA**
```
Frontend → /api/ua-pages/:code → Backend → 
Lecture JSON (public/ua-pages/) → Frontend Dashboard
```

### 🎯 Fonctionnement MQMetrics

Le composant `MQMetrics.jsx` implémente une découverte dynamique :

1. **Découverte des métriques** : `{__name__=~"ibmmq.*"}` → 162 métriques trouvées
2. **Extraction QMGR** : Parse les labels `qmgr`, `qmname`, `queue_manager`
3. **Extraction Queues** : Parse les labels `queue`, `queue_name` par QMGR
4. **Affichage dynamique** : 
   - Gauges : valeurs instantanées (entiers pour messages)
   - Graphiques : historique avec `query_range` (step charts)
5. **Rafraîchissement manuel** : Bouton pour recharger à la demande
6. **Pas d'auto-refresh** : Évite le clignotement des graphiques

---

## 🔧 Configuration des métriques

### Métriques globales

Éditer `public/prometheus-global.json` :
```json
{
  "queries": [
    {
      "id": "global_cpu",
      "name": "CPU Global",
      "query": "rate(process_cpu_seconds_total[5m]) * 100",
      "type": "gauge",
      "unit": "%",
      "description": "Utilisation CPU moyenne"
    },
    {
      "id": "global_memory",
      "name": "Mémoire",
      "query": "process_resident_memory_bytes / 1024 / 1024",
      "type": "gauge",
      "unit": "MB"
    },
    {
      "id": "cpu_trend",
      "name": "Tendance CPU (1h)",
      "query": "rate(process_cpu_seconds_total[5m]) * 100",
      "type": "graph",
      "unit": "%",
      "description": "Évolution du CPU sur 1 heure"
    }
  ]
}
```

### Métriques par UA

Éditer `public/ua-pages/UA2164.json` :
```json
{
  "title": "Dashboard TestUA",
  "content": "Vue d'ensemble du groupe TestUA",
  "metrics": true,
  "prometheusQueries": [
    {
      "id": "testua_cpu",
      "name": "CPU",
      "query": "rate(process_cpu_seconds_total[5m]) * 100",
      "type": "gauge",
      "unit": "%"
    },
    {
      "id": "testua_cpu_graph",
      "name": "Évolution CPU (1h)",
      "query": "rate(process_cpu_seconds_total[5m]) * 100",
      "type": "graph",
      "unit": "%"
    }
  ]
}
```

### Types de widgets disponibles

| Type | Description | Usage | Formatage |
|------|-------------|-------|-----------|
| `gauge` | Valeur unique | Affiche la valeur actuelle | Entiers pour messages, 2 décimales pour autres |
| `graph` | Graphique temporel | Affiche une courbe d'évolution | Step chart (escalier) |
| `table` | Tableau multi-valeurs | Affiche plusieurs séries dans un tableau | - |

### Métriques IBM MQ disponibles

Le dashboard découvre automatiquement toutes les métriques `ibmmq_*` disponibles dans Prometheus. Exemples :

- `ibmmq_queue_depth` - Profondeur de la queue
- `ibmmq_queue_oldest_message_age` - Âge du plus ancien message
- `ibmmq_queue_mqput_mqput1_count` - Nombre de messages mis en queue
- `ibmmq_queue_mqget_count` - Nombre de messages récupérés
- `ibmmq_queue_input_handles` - Handles d'entrée ouverts
- `ibmmq_queue_output_handles` - Handles de sortie ouverts
- `ibmmq_qmgr_status` - Statut du Queue Manager
- `ibmmq_qmgr_connection_count` - Nombre de connexions
- Et 150+ autres métriques...

---

## 🌐 Endpoints API

### Authentification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Connexion utilisateur (retourne JWT) |
| GET | `/api/auth/verify` | Vérification token JWT |

### Pages UA

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Santé de l'API |
| GET | `/api/ua-pages` | Liste des UAs disponibles |
| GET | `/api/ua-pages/:uaCode` | Récupérer une page UA |
| POST | `/api/ua-pages/:uaCode` | Créer/Modifier une page UA |
| DELETE | `/api/ua-pages/:uaCode` | Supprimer une page UA |
| GET | `/api/ua-pages-index` | Index des pages UA |

### Prometheus

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/prometheus/health` | Santé de Prometheus |
| GET | `/api/prometheus/global` | Métriques globales configurées |
| GET | `/api/prometheus/ua/:name` | Métriques d'une UA spécifique |
| GET | `/api/prometheus/query` | Requête PromQL instantanée |
| GET | `/api/prometheus/query_range` | Requête PromQL temporelle (historique) |
| GET | `/api/prometheus/labels/:name` | Valeurs d'un label Prometheus |
| POST | `/api/prometheus/query/multiple` | Requêtes multiples en parallèle |

### Exemples de requêtes

#### Métriques globales
```bash
curl http://localhost:3001/api/prometheus/global | jq .
```

#### Métriques d'une UA
```bash
curl http://localhost:3001/api/prometheus/ua/UA2164 | jq .
```

#### Requête PromQL custom
```bash
curl "http://localhost:3001/api/prometheus/query?query=up" | jq .
```

#### Découverte métriques IBM MQ
```bash
curl "http://localhost:3001/api/prometheus/query?query=%7B__name__%3D~%22ibmmq.*%22%7D" | jq .
```

#### Requête range (historique)
```bash
curl "http://localhost:3001/api/prometheus/query_range?query=ibmmq_queue_depth&start=1700000000&end=1700003600&step=15s" | jq .
```

---

## 🎨 Interface utilisateur

### Dashboard principal
```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard MQ - Code UA: UA2164         [Profil] [Déconnexion]│
├─────────────────────────────────────────────────────────────┤
│ 📊 Métriques Globales                  [🔄 Rafraîchir]     │
│ ┌──────┐ ┌──────┐ ┌───────────────────────────────┐        │
│ │ CPU  │ │ Mem  │ │  Évolution CPU (1h)           │        │
│ │0.04% │ │90 MB │ │  [Graphique en escalier]      │        │
│ └──────┘ └──────┘ └───────────────────────────────┘        │
├─────────────────────────────────────────────────────────────┤
│ 🔷 Métriques IBM MQ - UA2164    [🔄 Rafraîchir] 15:42:13  │
│                                                              │
│ QUEUE MANAGER: [TEST ▼]  QUEUE: [QL.TEST ▼]  PLAGE: [5m ▼]│
│                                                              │
│ ┌──────────┐ ┌────────────────────────────┐ ┌──────────┐   │
│ │Profondeur│ │ Évolution Profondeur Queue │ │Profondeur│   │
│ │  Queue   │ │                            │ │   Max    │   │
│ │          │ │  [Graphique escalier]      │ │          │   │
│ │35 messages│ │                            │ │5000 messages│
│ └──────────┘ └────────────────────────────┘ └──────────┘   │
│                                                              │
│ ┌──────────┐ ┌────────────────────────────┐ ┌──────────┐   │
│ │Message   │ │ Évolution Âge Message      │ │Taux      │   │
│ │le + ancien│ │                            │ │d'entrée  │   │
│ │          │ │  [Graphique escalier]      │ │          │   │
│ │12 secondes│ │                            │ │0.00 msg/s│   │
│ └──────────┘ └────────────────────────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Panneau d'administration

Accessible aux utilisateurs avec le rôle `admin` :

- Création de nouvelles pages UA
- Modification des pages existantes
- Suppression de pages UA
- Visualisation de toutes les UAs configurées

---

## 🐛 Troubleshooting

### Erreur "Cannot connect to Prometheus"

**Solution** :
```bash
# Vérifier que Prometheus tourne
curl http://localhost:9090/api/v1/query?query=up
```

### Erreur 404 `/api/api/prometheus/...`

**Solution** : Vérifier que les hooks utilisent :
```javascript
const API_BASE = import.meta.env.VITE_API_URL || '/api';
fetch(`${API_BASE}/prometheus/global`)  // ✅ Correct
```

### Métriques ne s'affichent pas

**Debug** :
```bash
# Console navigateur (F12) → Onglet Network
# Vérifier les requêtes vers /api/prometheus/*
```

### Aucune métrique IBM MQ détectée

**Vérifications** :
1. IBM MQ Exporter est démarré et accessible
2. Prometheus scrape correctement l'exporter MQ
3. Les métriques sont visibles dans Prometheus : http://localhost:9090
4. Tester la requête : `{__name__=~"ibmmq.*"}`

### Graphiques qui clignotent

**Solution** : Le composant MQMetrics a été modifié pour ne plus avoir d'auto-refresh. Utilisez le bouton "Rafraîchir" pour mettre à jour manuellement.

### Authentification JWT expirée

**Solution** : Le token JWT expire après 8h. Reconnectez-vous via la page de login.

---

## 🔐 Sécurité

- **JWT** : Tokens avec expiration 8h
- **Rôles** : Admin / User avec permissions différenciées
  - **Admin** : Accès au panneau d'administration, gestion des pages UA
  - **User** : Consultation des dashboards uniquement
- **CORS** : Configuration pour environnement développement
- **Proxy Vite** : Évite les problèmes CORS en dev
- **Pas de stockage** : Les tokens sont en mémoire, pas de localStorage

---

## 📦 Technologies

### Frontend
- **React 18** - Bibliothèque UI
- **Vite** - Build tool et dev server
- **recharts** - Graphiques interactifs
- **lucide-react** - Icônes

### Backend
- **Express** - Framework Node.js
- **axios** - Client HTTP pour Prometheus
- **jsonwebtoken** - Gestion JWT
- **cors** - Gestion des CORS

### Monitoring
- **Prometheus** - Système de métriques
- **IBM MQ Exporter** - Exporter pour IBM MQ

---

## 🚀 Fonctionnalités avancées

### Découverte automatique

Le dashboard détecte automatiquement :
- Tous les Queue Managers disponibles
- Toutes les Queues par QMGR
- Les 162+ métriques IBM MQ disponibles

### Plages de temps configurables

Choisissez la période d'analyse pour les graphiques :
- **5 minutes** : Vue détaillée temps réel
- **30 minutes** : Vue court terme
- **1 heure** : Vue moyenne durée
- **1 jour** : Vue long terme

### Formatage intelligent

- **Messages** : Affichés en entiers (35 au lieu de 35.00)
- **Pourcentages** : Affichés avec 2 décimales (2.45%)
- **Temps** : Affichés avec 2 décimales (12.34 secondes)

### Graphiques optimisés

- **Step charts** : Graphiques en escalier pour métriques discrètes
- **Pas de clignotement** : Rafraîchissement manuel uniquement
- **Responsive** : S'adaptent à la taille de l'écran

---

## 📝 Changelog

### Version 2.0.0 (Actuelle)
- ✅ Ajout authentification JWT
- ✅ Métriques IBM MQ dynamiques
- ✅ Découverte automatique QMGR/Queue
- ✅ Graphiques en escalier (step charts)
- ✅ Rafraîchissement manuel
- ✅ Panneau d'administration
- ✅ Support 162+ métriques IBM MQ
- ✅ Formatage intelligent des valeurs
- ✅ Gestion des rôles Admin/User

### Version 1.0.0
- ✅ Dashboard multi-UA
- ✅ Métriques globales Prometheus
- ✅ Métriques UA spécifiques
- ✅ Auto-refresh 30s
- ✅ Configuration JSON

---

## 👥 Auteur

**Marquet Gilles** - Dashboard MQ avec intégration Prometheus et métriques IBM MQ dynamiques

---

## 📄 Licence

Ce projet est sous licence MIT.

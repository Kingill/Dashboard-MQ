# 📊 Dashboard MQ - Monitoring Multi-UA avec Prometheus

Dashboard de monitoring en temps réel pour la gestion de files d'attente MessageQueue avec intégration Prometheus par unité d'affectation (UA).

## 🚀 Fonctionnalités

- **Multi-UA** : Gestion de plusieurs unités d'affectation avec pages personnalisées
- **Métriques temps réel** : Monitoring CPU, mémoire, goroutines, services actifs
- **Graphiques interactifs** : Visualisation des tendances sur 1 heure avec recharts
- **Auto-refresh** : Actualisation automatique toutes les 30 secondes
- **Configuration dynamique** : Métriques Prometheus configurables par fichiers JSON
- **Authentification** : Système d'authentification OAuth intégré
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

---

## 🛠️ Installation

### Prérequis

- **Node.js** >= 18.x
- **Prometheus** sur http://localhost:9090
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
Assurez-vous que Prometheus tourne sur http://localhost:9090

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

### Flux de données

1. **Frontend** fait une requête vers `/api/prometheus/global`
2. **Proxy Vite** redirige vers `http://localhost:3001/api/prometheus/global`
3. **Backend Express** exécute des requêtes PromQL vers Prometheus
4. **Prometheus** retourne les métriques
5. **Backend** formate les données et les renvoie au frontend
6. **Frontend** affiche les métriques dans des widgets (gauges/graphiques)

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
      "query": "avg(rate(process_cpu_seconds_total[5m])) * 100",
      "type": "gauge",
      "unit": "%",
      "description": "Utilisation CPU moyenne"
    },
    {
      "id": "cpu_trend",
      "name": "Tendance CPU (1h)",
      "query": "avg(rate(process_cpu_seconds_total[1m])) * 100",
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

| Type | Description | Usage |
|------|-------------|-------|
| `gauge` | Valeur unique | Affiche la valeur actuelle (ex: CPU: 2.5%) |
| `graph` | Graphique temporel | Affiche une courbe d'évolution sur 1h |
| `table` | Tableau multi-valeurs | Affiche plusieurs séries dans un tableau |

---

## 🌐 Endpoints API

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
| GET | `/api/prometheus/global` | Métriques globales |
| GET | `/api/prometheus/ua/:name` | Métriques d'une UA spécifique |
| GET | `/api/prometheus/query` | Requête PromQL instantanée |
| GET | `/api/prometheus/query_range` | Requête PromQL temporelle |
| POST | `/api/prometheus/query/multiple` | Requêtes multiples |

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

---

## 🎨 Interface utilisateur

### Dashboard principal

```
┌─────────────────────────────────────────────┐
│ Dashboard MQ - Code UA: UA2164              │
├─────────────────────────────────────────────┤
│ 📊 Métriques Globales Prometheus  🔄 30s   │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│ │ CPU  │ │ Mem  │ │Gorou │ │ Serv │       │
│ │0.04% │ │90 MB │ │ 45   │ │  1   │       │
│ └──────┘ └──────┘ └──────┘ └──────┘       │
│                                             │
│ [Graphique Tendance CPU sur 1h]            │
├─────────────────────────────────────────────┤
│ Messages | Succès | Users | Erreurs        │
│  1,247   | 98.5%  |  24   |    3          │
├─────────────────────────────────────────────┤
│ 📈 Métriques UA2164 (TestUA)    🔄 30s     │
│ ┌──────┐ ┌──────┐ ┌──────┐                │
│ │ CPU  │ │ Mem  │ │Gorou │                │
│ │0.04% │ │90 MB │ │ 45   │                │
│ └──────┘ └──────┘ └──────┘                │
│                                             │
│ [Graphique Évolution CPU UA]               │
└─────────────────────────────────────────────┘
```

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

---

## 📦 Technologies

- **React 18** + **Vite** - Frontend
- **Express** - Backend
- **Prometheus** - Métriques
- **recharts** - Graphiques

---

## 👥 Auteur

**Marquet Gilles** - Dashboard MQ avec intégration Prometheus

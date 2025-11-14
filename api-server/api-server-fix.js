import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration Prometheus
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

// ============================================================================
// CONFIGURATION AXIOS POUR ENVIRONNEMENT ENTREPRISE
// ============================================================================

// IMPORTANT: Désactiver le proxy pour localhost
// En entreprise, le proxy peut bloquer les connexions localhost
axios.defaults.proxy = false;

// Ajouter localhost et 127.0.0.1 à NO_PROXY
process.env.NO_PROXY = [
  process.env.NO_PROXY,
  'localhost',
  '127.0.0.1',
  '::1'
].filter(Boolean).join(',');

console.log('🔧 Configuration réseau:');
console.log(`   - Proxy: ${axios.defaults.proxy ? 'activé' : 'désactivé'}`);
console.log(`   - NO_PROXY: ${process.env.NO_PROXY}`);

// Chemin vers le dossier des pages UA
const UA_PAGES_DIR = path.join(__dirname, '../public/ua-pages');

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// PROMETHEUS SERVICE
// ============================================================================

class PrometheusService {
  constructor(prometheusUrl = PROMETHEUS_URL) {
    this.baseUrl = prometheusUrl;
  }

  /**
   * Exécute une requête PromQL
   */
  async query(query, time = null) {
    try {
      const params = { query };
      if (time) params.time = time;

      const response = await axios.get(`${this.baseUrl}/api/v1/query`, {
        params,
        timeout: 10000,
        proxy: false  // Forcer désactivation proxy
      });

      if (response.data.status !== 'success') {
        throw new Error(`Prometheus query failed: ${response.data.error}`);
      }

      return this.formatResult(response.data.data);
    } catch (error) {
      console.error('Prometheus query error:', error.message);
      throw new Error(`Failed to execute Prometheus query: ${error.message}`);
    }
  }

  /**
   * Exécute une requête avec range (historique)
   */
  async queryRange(query, start, end, step = '15s') {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/query_range`, {
        params: { query, start, end, step },
        timeout: 15000,
        proxy: false  // Forcer désactivation proxy
      });

      if (response.data.status !== 'success') {
        throw new Error(`Prometheus range query failed: ${response.data.error}`);
      }

      return this.formatRangeResult(response.data.data);
    } catch (error) {
      console.error('Prometheus range query error:', error.message);
      throw new Error(`Failed to execute Prometheus range query: ${error.message}`);
    }
  }

  /**
   * Exécute plusieurs requêtes en parallèle
   */
  async executeMultiple(queries) {
    const promises = queries.map(async (q) => {
      try {
        let result;
        if (q.type === 'range' && q.start && q.end) {
          result = await this.queryRange(q.query, q.start, q.end, q.step);
        } else {
          result = await this.query(q.query);
        }
        return {
          id: q.id,
          success: true,
          data: result
        };
      } catch (error) {
        return {
          id: q.id,
          success: false,
          error: error.message
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Formate le résultat d'une requête instantanée
   */
  formatResult(data) {
    if (data.resultType === 'vector') {
      return {
        type: 'vector',
        results: data.result.map(r => ({
          metric: r.metric,
          value: parseFloat(r.value[1]),
          timestamp: r.value[0]
        }))
      };
    }
    
    if (data.resultType === 'scalar') {
      return {
        type: 'scalar',
        value: parseFloat(data.result[1]),
        timestamp: data.result[0]
      };
    }

    return data;
  }

  /**
   * Formate le résultat d'une requête range
   */
  formatRangeResult(data) {
    if (data.resultType === 'matrix') {
      return {
        type: 'matrix',
        results: data.result.map(r => ({
          metric: r.metric,
          values: r.values.map(v => ({
            timestamp: v[0],
            value: parseFloat(v[1])
          }))
        }))
      };
    }
    return data;
  }

  /**
   * Teste la connexion à Prometheus
   */
  async healthCheck() {
    try {
      console.log(`🔍 Test connexion Prometheus: ${this.baseUrl}/-/healthy`);
      const response = await axios.get(`${this.baseUrl}/-/healthy`, {
        timeout: 5000,
        proxy: false  // Forcer désactivation proxy
      });
      console.log(`✅ Prometheus accessible (status: ${response.status})`);
      return response.status === 200;
    } catch (error) {
      console.error(`❌ Prometheus inaccessible: ${error.message}`);
      if (error.code) console.error(`   Code erreur: ${error.code}`);
      return false;
    }
  }
}

const prometheusService = new PrometheusService();

// ============================================================================
// ROUTES PROMETHEUS
// ============================================================================

/**
 * GET /api/prometheus/query
 * Exécute une requête PromQL instantanée
 */
app.get('/api/prometheus/query', async (req, res) => {
  try {
    const { query, time } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const result = await prometheusService.query(query, time);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/prometheus/query_range
 * Exécute une requête PromQL avec historique
 */
app.get('/api/prometheus/query_range', async (req, res) => {
  try {
    const { query, start, end, step } = req.query;
    
    if (!query || !start || !end) {
      return res.status(400).json({ 
        error: 'query, start, and end parameters are required' 
      });
    }

    const result = await prometheusService.queryRange(
      query, 
      parseInt(start), 
      parseInt(end), 
      step
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/prometheus/query/multiple
 * Exécute plusieurs requêtes en parallèle
 */
app.post('/api/prometheus/query/multiple', async (req, res) => {
  try {
    const { queries } = req.body;
    
    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ 
        error: 'queries array is required' 
      });
    }

    const results = await prometheusService.executeMultiple(queries);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/prometheus/global
 * Récupère les requêtes globales et leurs résultats
 */
app.get('/api/prometheus/global', async (req, res) => {
  try {
    const globalConfigPath = path.join(__dirname, '../public/prometheus-global.json');
    const configData = await fs.readFile(globalConfigPath, 'utf-8');
    const config = JSON.parse(configData);

    // Exécute toutes les requêtes globales
    const results = await prometheusService.executeMultiple(
      config.queries.map(q => ({
        id: q.id,
        query: q.query,
        type: q.type === 'graph' ? 'range' : 'instant',
        start: q.type === 'graph' ? Math.floor(Date.now() / 1000) - 3600 : undefined,
        end: q.type === 'graph' ? Math.floor(Date.now() / 1000) : undefined,
        step: '30s'
      }))
    );

    // Combine config et résultats
    const enrichedData = config.queries.map(q => {
      const result = results.find(r => r.id === q.id);
      return {
        ...q,
        result: result?.success ? result.data : null,
        error: result?.error || null
      };
    });

    res.json({ success: true, data: enrichedData });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/prometheus/ua/:uaName
 * Récupère les requêtes spécifiques à une UA et leurs résultats
 */
app.get('/api/prometheus/ua/:uaName', async (req, res) => {
  try {
    const { uaName } = req.params;
    const uaPagePath = path.join(UA_PAGES_DIR, `${uaName}.json`);
    
    const pageData = await fs.readFile(uaPagePath, 'utf-8');
    const uaPage = JSON.parse(pageData);

    if (!uaPage.prometheusQueries || uaPage.prometheusQueries.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Exécute les requêtes de l'UA
    const results = await prometheusService.executeMultiple(
      uaPage.prometheusQueries.map(q => ({
        id: q.id,
        query: q.query,
        type: q.type === 'graph' ? 'range' : 'instant',
        start: q.type === 'graph' ? Math.floor(Date.now() / 1000) - 3600 : undefined,
        end: q.type === 'graph' ? Math.floor(Date.now() / 1000) : undefined,
        step: '30s'
      }))
    );

    // Combine config et résultats
    const enrichedData = uaPage.prometheusQueries.map(q => {
      const result = results.find(r => r.id === q.id);
      return {
        ...q,
        result: result?.success ? result.data : null,
        error: result?.error || null
      };
    });

    res.json({ success: true, data: enrichedData });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/prometheus/health
 * Vérifie la connexion à Prometheus
 */
app.get('/api/prometheus/health', async (req, res) => {
  try {
    const isHealthy = await prometheusService.healthCheck();
    res.json({ 
      success: true, 
      healthy: isHealthy,
      timestamp: Date.now(),
      prometheusUrl: PROMETHEUS_URL
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================================================
// ROUTES UA PAGES (existantes)
// ============================================================================

// Créer le dossier ua-pages s'il n'existe pas
async function ensureUAPagesDir() {
  try {
    await fs.access(UA_PAGES_DIR);
  } catch {
    await fs.mkdir(UA_PAGES_DIR, { recursive: true });
    console.log('✅ Dossier ua-pages créé');
  }
}

// GET - Récupérer la liste des UAs disponibles
app.get('/api/ua-pages', async (req, res) => {
  try {
    const files = await fs.readdir(UA_PAGES_DIR);
    const uaFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json');
    const uas = uaFiles.map(f => f.replace('.json', ''));
    
    res.json({ uas, count: uas.length });
  } catch (error) {
    console.error('Erreur lecture dossier:', error);
    res.status(500).json({ error: 'Erreur lecture des pages UA' });
  }
});

// GET - Récupérer une page UA spécifique
app.get('/api/ua-pages/:uaCode', async (req, res) => {
  try {
    const { uaCode } = req.params;
    const filePath = path.join(UA_PAGES_DIR, `${uaCode}.json`);
    
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    res.json(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Page UA non trouvée' });
    } else {
      console.error('Erreur lecture page UA:', error);
      res.status(500).json({ error: 'Erreur lecture de la page' });
    }
  }
});

// POST - Créer ou mettre à jour une page UA
app.post('/api/ua-pages/:uaCode', async (req, res) => {
  try {
    const { uaCode } = req.params;
    const { title, content, metrics, prometheusQueries } = req.body;
    
    // Validation
    if (!title || !content) {
      return res.status(400).json({ error: 'Titre et contenu requis' });
    }
    
    const pageData = {
      title,
      content,
      metrics: metrics !== undefined ? metrics : true,
      prometheusQueries: prometheusQueries || []
    };
    
    const filePath = path.join(UA_PAGES_DIR, `${uaCode}.json`);
    await fs.writeFile(filePath, JSON.stringify(pageData, null, 2), 'utf-8');
    
    // Mettre à jour l'index
    await updateIndex();
    
    console.log(`✅ Page ${uaCode} sauvegardée`);
    res.json({ success: true, message: `Page ${uaCode} sauvegardée`, data: pageData });
  } catch (error) {
    console.error('Erreur sauvegarde page UA:', error);
    res.status(500).json({ error: 'Erreur sauvegarde de la page' });
  }
});

// DELETE - Supprimer une page UA
app.delete('/api/ua-pages/:uaCode', async (req, res) => {
  try {
    const { uaCode } = req.params;
    const filePath = path.join(UA_PAGES_DIR, `${uaCode}.json`);
    
    await fs.unlink(filePath);
    await updateIndex();
    
    console.log(`✅ Page ${uaCode} supprimée`);
    res.json({ success: true, message: `Page ${uaCode} supprimée` });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Page UA non trouvée' });
    } else {
      console.error('Erreur suppression page UA:', error);
      res.status(500).json({ error: 'Erreur suppression de la page' });
    }
  }
});

// GET - Récupérer l'index des UAs
app.get('/api/ua-pages-index', async (req, res) => {
  try {
    const indexPath = path.join(UA_PAGES_DIR, 'index.json');
    const content = await fs.readFile(indexPath, 'utf-8');
    const data = JSON.parse(content);
    
    res.json(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Créer l'index s'il n'existe pas
      await updateIndex();
      res.json({ uas: [], lastUpdate: new Date().toISOString() });
    } else {
      console.error('Erreur lecture index:', error);
      res.status(500).json({ error: 'Erreur lecture de l\'index' });
    }
  }
});

// Fonction pour mettre à jour l'index
async function updateIndex() {
  try {
    const files = await fs.readdir(UA_PAGES_DIR);
    const uaFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json');
    const uas = uaFiles.map(f => f.replace('.json', ''));
    
    const indexData = {
      uas,
      lastUpdate: new Date().toISOString()
    };
    
    const indexPath = path.join(UA_PAGES_DIR, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
    
    console.log('✅ Index mis à jour');
  } catch (error) {
    console.error('Erreur mise à jour index:', error);
  }
}

// Health check général
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API UA Pages en ligne' });
});

// ============================================================================
// DÉMARRAGE DU SERVEUR
// ============================================================================

async function start() {
  await ensureUAPagesDir();
  
  // Test connexion Prometheus au démarrage
  const prometheusHealthy = await prometheusService.healthCheck();
  
  app.listen(PORT, () => {
    console.log(`🚀 API Server démarré sur http://localhost:${PORT}`);
    console.log(`📁 Dossier pages UA: ${UA_PAGES_DIR}`);
    console.log(`📊 Prometheus: ${PROMETHEUS_URL} ${prometheusHealthy ? '✅' : '❌'}`);
    console.log(`\n📌 Endpoints UA Pages:`);
    console.log(`  GET    /api/health`);
    console.log(`  GET    /api/ua-pages`);
    console.log(`  GET    /api/ua-pages/:uaCode`);
    console.log(`  POST   /api/ua-pages/:uaCode`);
    console.log(`  DELETE /api/ua-pages/:uaCode`);
    console.log(`  GET    /api/ua-pages-index`);
    console.log(`\n📊 Endpoints Prometheus:`);
    console.log(`  GET    /api/prometheus/health`);
    console.log(`  GET    /api/prometheus/global`);
    console.log(`  GET    /api/prometheus/ua/:uaName`);
    console.log(`  GET    /api/prometheus/query`);
    console.log(`  GET    /api/prometheus/query_range`);
    console.log(`  POST   /api/prometheus/query/multiple`);
  });
}

start();

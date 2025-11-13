// prometheus.js (routes)
const express = require('express');
const router = express.Router();
const prometheusService = require('../services/prometheusService');
const fs = require('fs').promises;
const path = require('path');

/**
 * GET /api/prometheus/query
 * Exécute une requête PromQL instantanée
 */
router.get('/query', async (req, res) => {
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
router.get('/query_range', async (req, res) => {
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
router.post('/query/multiple', async (req, res) => {
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
router.get('/global', async (req, res) => {
  try {
    const globalConfigPath = path.join(__dirname, '../../public/prometheus-global.json');
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
router.get('/ua/:uaName', async (req, res) => {
  try {
    const { uaName } = req.params;
    const uaPagePath = path.join(__dirname, `../../public/ua-pages/${uaName}.json`);
    
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
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await prometheusService.healthCheck();
    res.json({ 
      success: true, 
      healthy: isHealthy,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;

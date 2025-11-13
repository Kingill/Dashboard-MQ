// prometheusService.js
const axios = require('axios');

class PrometheusService {
  constructor(prometheusUrl = process.env.PROMETHEUS_URL || 'http://localhost:9090') {
    this.baseUrl = prometheusUrl;
  }

  /**
   * Exécute une requête PromQL
   * @param {string} query - Requête PromQL
   * @param {number} time - Timestamp (optionnel)
   * @returns {Promise<Object>} Résultat de la requête
   */
  async query(query, time = null) {
    try {
      const params = { query };
      if (time) params.time = time;

      const response = await axios.get(`${this.baseUrl}/api/v1/query`, {
        params,
        timeout: 10000
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
   * @param {string} query - Requête PromQL
   * @param {number} start - Timestamp de début
   * @param {number} end - Timestamp de fin
   * @param {string} step - Intervalle (ex: '15s')
   * @returns {Promise<Object>} Résultat de la requête
   */
  async queryRange(query, start, end, step = '15s') {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/query_range`, {
        params: { query, start, end, step },
        timeout: 15000
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
   * @param {Array<Object>} queries - Tableau de {id, query, type}
   * @returns {Promise<Array>} Résultats de toutes les requêtes
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
      const response = await axios.get(`${this.baseUrl}/-/healthy`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new PrometheusService();

// usePrometheus.js
import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const usePrometheus = () => {
  const [globalMetrics, setGlobalMetrics] = useState([]);
  const [uaMetrics, setUaMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isHealthy, setIsHealthy] = useState(true);
  
  const refreshIntervals = useRef({});

  /**
   * Vérifie la santé de Prometheus
   */
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/prometheus/health`);
      const data = await response.json();
      setIsHealthy(data.healthy);
      return data.healthy;
    } catch (err) {
      setIsHealthy(false);
      return false;
    }
  }, []);

  /**
   * Charge les métriques globales
   */
  const fetchGlobalMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/prometheus/global`);
      const data = await response.json();
      
      if (data.success) {
        setGlobalMetrics(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching global metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charge les métriques d'une UA spécifique
   */
  const fetchUAMetrics = useCallback(async (uaName) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/prometheus/ua/${uaName}`);
      const data = await response.json();
      
      if (data.success) {
        setUaMetrics(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching UA metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Exécute une requête PromQL personnalisée
   */
  const executeQuery = useCallback(async (query, options = {}) => {
    try {
      const { type = 'instant', start, end, step = '30s' } = options;
      
      let url = `${API_BASE}/prometheus/query`;
      const params = new URLSearchParams({ query });
      
      if (type === 'range' && start && end) {
        url = `${API_BASE}/prometheus/query_range`;
        params.append('start', start);
        params.append('end', end);
        params.append('step', step);
      }
      
      const response = await fetch(`${url}?${params}`);
      const data = await response.json();
      
      return data.success ? data.data : null;
    } catch (err) {
      console.error('Error executing query:', err);
      return null;
    }
  }, []);

  /**
   * Configure le rafraîchissement automatique des métriques
   */
  const setupAutoRefresh = useCallback((type, identifier, interval) => {
    // Nettoie l'ancien intervalle
    const key = `${type}-${identifier}`;
    if (refreshIntervals.current[key]) {
      clearInterval(refreshIntervals.current[key]);
    }

    // Configure le nouveau rafraîchissement
    if (interval > 0) {
      refreshIntervals.current[key] = setInterval(() => {
        if (type === 'global') {
          fetchGlobalMetrics();
        } else if (type === 'ua') {
          fetchUAMetrics(identifier);
        }
      }, interval);
    }

    return () => {
      if (refreshIntervals.current[key]) {
        clearInterval(refreshIntervals.current[key]);
        delete refreshIntervals.current[key];
      }
    };
  }, [fetchGlobalMetrics, fetchUAMetrics]);

  /**
   * Nettoie tous les intervalles au démontage
   */
  useEffect(() => {
    return () => {
      Object.values(refreshIntervals.current).forEach(clearInterval);
      refreshIntervals.current = {};
    };
  }, []);

  return {
    // État
    globalMetrics,
    uaMetrics,
    loading,
    error,
    isHealthy,
    
    // Actions
    fetchGlobalMetrics,
    fetchUAMetrics,
    executeQuery,
    checkHealth,
    setupAutoRefresh,
  };
};

export default usePrometheus;

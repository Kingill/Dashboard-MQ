// auth-app/src/hooks/usePrometheus.js
import { useState, useCallback, useRef } from 'react';

const usePrometheus = () => {
  const [globalMetrics, setGlobalMetrics] = useState([]);
  const [uaMetrics, setUaMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isHealthy, setIsHealthy] = useState(true); // ✅ Ajouter cet état
  const intervalRefs = useRef({});

  // Fonction pour exécuter une requête Prometheus personnalisée
  const fetchCustomQuery = useCallback(async (query) => {
    try {
      console.log(`🔍 fetchCustomQuery appelé avec: ${query}`);
      
      const response = await fetch(`/api/prometheus/query?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Réponse reçue:', data);
      
      return data;
    } catch (err) {
      console.error('❌ Erreur fetchCustomQuery:', err);
      throw err;
    }
  }, []);

  // Fonction pour vérifier la santé de Prometheus
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/prometheus/health');
      
      if (!response.ok) {
        setIsHealthy(false);
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setIsHealthy(data.healthy === true);
      return data;
    } catch (err) {
      console.error('❌ Erreur checkHealth:', err);
      setIsHealthy(false);
      throw err;
    }
  }, []);

  // Fonction pour charger les métriques globales
  const fetchGlobalMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/prometheus/global');
      
      if (!response.ok) {
        throw new Error('Erreur chargement métriques globales');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setGlobalMetrics(result.data);
      } else {
        throw new Error(result.error || 'Données invalides');
      }
    } catch (err) {
      setError(err.message);
      console.error('Erreur fetchGlobalMetrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour charger les métriques UA
  const fetchUAMetrics = useCallback(async (uaName) => {
    if (!uaName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/prometheus/ua/${uaName}`);
      
      if (!response.ok) {
        throw new Error(`Erreur chargement métriques UA ${uaName}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setUaMetrics(result.data);
      } else {
        throw new Error(result.error || 'Données invalides');
      }
    } catch (err) {
      setError(err.message);
      console.error('Erreur fetchUAMetrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour configurer le rafraîchissement automatique
  const setupAutoRefresh = useCallback((type, uaName = null, interval = 30000) => {
    const key = `${type}-${uaName || 'global'}`;
    
    // Nettoyer l'intervalle existant
    if (intervalRefs.current[key]) {
      clearInterval(intervalRefs.current[key]);
    }
    
    // Configurer le nouvel intervalle
    if (interval > 0) {
      intervalRefs.current[key] = setInterval(() => {
        if (type === 'global') {
          fetchGlobalMetrics();
        } else if (type === 'ua' && uaName) {
          fetchUAMetrics(uaName);
        }
      }, interval);
    }
    
    // Retourner la fonction de nettoyage
    return () => {
      if (intervalRefs.current[key]) {
        clearInterval(intervalRefs.current[key]);
        delete intervalRefs.current[key];
      }
    };
  }, [fetchGlobalMetrics, fetchUAMetrics]);

  return {
    globalMetrics,
    uaMetrics,
    loading,
    error,
    isHealthy,        // ✅ Exporter cet état
    fetchGlobalMetrics,
    fetchUAMetrics,
    fetchCustomQuery,
    checkHealth,
    setupAutoRefresh,
  };
};

export default usePrometheus;

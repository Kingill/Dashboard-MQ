// UAMetrics.jsx
import React, { useEffect } from 'react';
import usePrometheus from '../hooks/usePrometheus';
import PrometheusWidget from './PrometheusWidget';

const UAMetrics = ({ uaName, autoRefresh = 30000 }) => {
  const { 
    uaMetrics, 
    loading, 
    error,
    fetchUAMetrics, 
    setupAutoRefresh 
  } = usePrometheus();

  useEffect(() => {
    if (!uaName) return;

    // Charge les métriques de l'UA
    fetchUAMetrics(uaName);

    // Configure le rafraîchissement automatique
    const cleanup = setupAutoRefresh('ua', uaName, autoRefresh);

    return cleanup;
  }, [uaName, fetchUAMetrics, setupAutoRefresh, autoRefresh]);

  if (!uaName) {
    return null;
  }

  if (loading && uaMetrics.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}>Chargement des métriques {uaName}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          Erreur lors du chargement des métriques: {error}
        </div>
      </div>
    );
  }

  if (uaMetrics.length === 0) {
    return null; // Pas de métriques spécifiques pour cette UA
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📈 Métriques {uaName}</h2>
        {autoRefresh > 0 && (
          <span style={styles.refreshBadge}>
            🔄 {autoRefresh / 1000}s
          </span>
        )}
      </div>
      
      <div style={styles.grid}>
        {uaMetrics.map((metric) => (
          <div key={metric.id} style={styles.gridItem}>
            <PrometheusWidget metric={metric} />
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    marginTop: '32px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  },
  refreshBadge: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  gridItem: {
    minHeight: '120px',
  },
  loader: {
    textAlign: 'center',
    padding: '30px',
    color: '#666',
    fontSize: '14px',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
  },
};

export default UAMetrics;

// auth-app/src/components/MQMetrics.jsx
import React, { useState, useEffect, useRef } from 'react';
import usePrometheus from '../hooks/usePrometheus';
import PrometheusWidget from './PrometheusWidget';

const MQMetrics = ({ uaName }) => {
  const { fetchCustomQuery, loading, error } = usePrometheus();

  const [qmgrList, setQmgrList] = useState([]);
  const [queueList, setQueueList] = useState([]);
  const [selectedQmgr, setSelectedQmgr] = useState('');
  const [selectedQueue, setSelectedQueue] = useState('');
  const [timeRange, setTimeRange] = useState('5m');
  const [metrics, setMetrics] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');
  const [availableMetrics, setAvailableMetrics] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Ref pour suivre si c'est le premier chargement
  const isFirstLoad = useRef(true);

  const timeRanges = [
    { value: '5m', label: '5 minutes' },
    { value: '30m', label: '30 minutes' },
    { value: '1h', label: '1 heure' },
    { value: '1d', label: '1 jour' }
  ];

  // Découvrir les métriques IBM MQ disponibles
  useEffect(() => {
    const discoverMQMetrics = async () => {
      console.log('🔍 Découverte des métriques IBM MQ disponibles...');
      setDebugInfo('🔍 Recherche des métriques IBM MQ...');
      
      try {
        const query = '{__name__=~"ibmmq.*"}';
        const result = await fetchCustomQuery(query);
        
        console.log('Résultat découverte métriques:', result);
        
        if (result?.data?.result && result.data.result.length > 0) {
          const metricNames = [...new Set(
            result.data.result.map(item => item.metric.__name__)
          )];
          
          console.log('✅ Métriques IBM MQ trouvées:', metricNames);
          setAvailableMetrics(metricNames);
          setDebugInfo(`✅ ${metricNames.length} métriques IBM MQ trouvées`);
        } else {
          setDebugInfo('❌ Aucune métrique IBM MQ trouvée. Vérifiez que l\'exporter MQ est actif.');
          console.warn('Aucune métrique ibmmq* trouvée dans Prometheus');
        }
      } catch (err) {
        const errorMsg = `❌ Erreur découverte métriques: ${err.message}`;
        console.error(errorMsg, err);
        setDebugInfo(errorMsg);
      }
    };

    discoverMQMetrics();
  }, [fetchCustomQuery]);

  // Charger la liste des QMGRs
  useEffect(() => {
    if (availableMetrics.length === 0) return;

    const fetchQmgrs = async () => {
      console.log('🔍 Recherche des QMGRs...');
      
      try {
        let foundQmgrs = [];

        for (const metricName of availableMetrics) {
          try {
            const result = await fetchCustomQuery(metricName);
            
            if (result?.data?.result && result.data.result.length > 0) {
              const possibleLabels = ['qmgr', 'qmname', 'queue_manager', 'qm', 'manager'];
              
              const qmgrs = result.data.result
                .map(item => {
                  for (const label of possibleLabels) {
                    if (item.metric[label]) {
                      return { 
                        name: item.metric[label], 
                        label: item.metric[label],
                        source: metricName
                      };
                    }
                  }
                  return null;
                })
                .filter(q => q !== null);
              
              if (qmgrs.length > 0) {
                foundQmgrs = [...foundQmgrs, ...qmgrs];
              }
            }
          } catch (err) {
            console.warn(`Échec avec ${metricName}:`, err.message);
          }
        }

        if (foundQmgrs.length === 0) {
          setDebugInfo('❌ Aucun QMGR trouvé dans les métriques disponibles.');
          return;
        }

        const uniqueQmgrs = Array.from(
          new Map(foundQmgrs.map(q => [q.name, q])).values()
        );
        
        console.log('QMGRs uniques trouvés:', uniqueQmgrs);
        setQmgrList(uniqueQmgrs);
        setDebugInfo(`✅ ${uniqueQmgrs.length} QMGR(s) trouvé(s): ${uniqueQmgrs.map(q => q.name).join(', ')}`);
        
        if (uniqueQmgrs.length > 0) {
          setSelectedQmgr(uniqueQmgrs[0].name);
        }
      } catch (err) {
        const errorMsg = `❌ Erreur chargement QMGRs: ${err.message}`;
        console.error(errorMsg, err);
        setDebugInfo(errorMsg);
      }
    };

    fetchQmgrs();
  }, [availableMetrics, fetchCustomQuery]);

  // Charger la liste des QUEUEs
  useEffect(() => {
    if (!selectedQmgr || availableMetrics.length === 0) return;

    const fetchQueues = async () => {
      console.log(`🔍 Recherche des queues pour QMGR: ${selectedQmgr}`);
      
      try {
        const queueMetrics = availableMetrics.filter(m => 
          m.toLowerCase().includes('queue')
        );

        let foundQueues = [];

        for (const metricName of queueMetrics) {
          try {
            const possibleQmgrLabels = ['qmgr', 'qmname', 'queue_manager', 'qm'];
            
            for (const qmgrLabel of possibleQmgrLabels) {
              const query = `${metricName}{${qmgrLabel}="${selectedQmgr}"}`;
              const result = await fetchCustomQuery(query);
              
              if (result?.data?.result && result.data.result.length > 0) {
                const possibleQueueLabels = ['queue', 'queue_name', 'qname', 'q'];
                
                const queues = result.data.result
                  .map(item => {
                    for (const label of possibleQueueLabels) {
                      if (item.metric[label]) {
                        return {
                          name: item.metric[label],
                          label: item.metric[label]
                        };
                      }
                    }
                    return null;
                  })
                  .filter(q => q !== null);
                
                if (queues.length > 0) {
                  foundQueues = [...foundQueues, ...queues];
                  console.log(`✅ Trouvé ${queues.length} queues avec ${metricName}`);
                  break;
                }
              }
            }
            
            if (foundQueues.length > 0) break;
          } catch (err) {
            console.warn(`Échec avec ${metricName}:`, err.message);
          }
        }

        if (foundQueues.length === 0) {
          console.warn(`Aucune queue trouvée pour ${selectedQmgr}`);
          setDebugInfo(`⚠️ Aucune queue trouvée pour ${selectedQmgr}`);
          return;
        }

        const uniqueQueues = Array.from(
          new Map(foundQueues.map(q => [q.name, q])).values()
        );
        
        console.log(`✅ ${uniqueQueues.length} queues uniques trouvées`);
        setQueueList(uniqueQueues);
        
        if (uniqueQueues.length > 0) {
          setSelectedQueue(uniqueQueues[0].name);
        }
      } catch (err) {
        console.error('Erreur chargement QUEUEs:', err);
        setDebugInfo(`❌ Erreur: ${err.message}`);
      }
    };

    fetchQueues();
  }, [selectedQmgr, availableMetrics, fetchCustomQuery]);

  // Fonction pour charger les métriques MQ
  const fetchMQMetrics = async () => {
    if (!selectedQmgr || !selectedQueue) return;

    console.log(`📊 Chargement métriques pour ${selectedQmgr} / ${selectedQueue}`);
    setLoadingMetrics(true);

    try {
      const now = Math.floor(Date.now() / 1000);
      const timeRangeSeconds = {
        '5m': 300,
        '30m': 1800,
        '1h': 3600,
        '1d': 86400
      };
      const rangeSeconds = timeRangeSeconds[timeRange] || 3600;
      const startTime = now - rangeSeconds;

      // Définir les métriques à afficher
      const mqQueries = [
        {
          id: 'queue_depth',
          name: 'Profondeur Queue',
          query: `ibmmq_queue_depth{qmgr="${selectedQmgr}",queue="${selectedQueue}"}`,
          type: 'gauge',
          unit: 'messages',
          description: 'Nombre de messages dans la queue'
        },
        {
          id: 'queue_depth_graph',
          name: 'Évolution Profondeur Queue',
          query: `ibmmq_queue_depth{qmgr="${selectedQmgr}",queue="${selectedQueue}"}`,
          type: 'graph',
          unit: 'messages',
          description: `Tendance sur ${timeRange}`,
          isRange: true,
          start: startTime,
          end: now,
          step: '60'
        },
        {
          id: 'queue_max_depth',
          name: 'Profondeur Max',
          query: `ibmmq_queue_attribute_max_depth{qmgr="${selectedQmgr}",queue="${selectedQueue}"}`,
          type: 'gauge',
          unit: 'messages',
          description: 'Capacité maximale de la queue'
        }
      ];

      // Charger toutes les métriques
      const results = await Promise.all(
        mqQueries.map(async (metric) => {
          try {
            let data;
            
            if (metric.isRange) {
              // Requête range pour les graphiques
              const response = await fetch(
                `/api/prometheus/query_range?query=${encodeURIComponent(metric.query)}&start=${metric.start}&end=${metric.end}&step=${metric.step}`
              );
              
              if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
              }
              
              data = await response.json();
            } else {
              // Requête instantanée pour les gauges
              data = await fetchCustomQuery(metric.query);
            }
            
            // Extraire la valeur pour les gauges
            let value = null;
            if (metric.type === 'gauge' && data?.data?.result && data.data.result.length > 0) {
              const result = data.data.result[0];
              if (result.value && result.value.length >= 2) {
                value = parseFloat(result.value[1]);
              }
            }
            
            return { 
              ...metric, 
              value,
              result: data 
            };
          } catch (err) {
            console.error(`Erreur métrique ${metric.id}:`, err);
            return { ...metric, value: null, error: err.message };
          }
        })
      );

      setMetrics(results);
      setLastRefresh(new Date());
      console.log('✅ Métriques chargées:', results);
    } catch (err) {
      console.error('Erreur chargement métriques:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Charger les métriques UNIQUEMENT au premier chargement (quand queue est définie)
  useEffect(() => {
    if (selectedQmgr && selectedQueue && isFirstLoad.current) {
      fetchMQMetrics();
      isFirstLoad.current = false; // Marquer comme chargé
    }
  }, [selectedQmgr, selectedQueue]);

  // Handler pour le bouton de rafraîchissement
  const handleRefresh = () => {
    fetchMQMetrics();
  };

  // Handler pour le changement de sélecteurs - recharge les métriques
  const handleQmgrChange = (e) => {
    setSelectedQmgr(e.target.value);
    isFirstLoad.current = true; // Réinitialiser pour recharger avec le nouveau QMGR
  };

  const handleQueueChange = (e) => {
    setSelectedQueue(e.target.value);
    isFirstLoad.current = true; // Réinitialiser pour recharger avec la nouvelle queue
  };

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
    // Ne pas recharger automatiquement, l'utilisateur doit cliquer sur Rafraîchir
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🔷 Métriques IBM MQ - {uaName}</h2>
        <div style={styles.headerActions}>
          {lastRefresh && (
            <span style={styles.lastRefreshBadge}>
              Dernière mise à jour: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={handleRefresh} 
            disabled={loadingMetrics || !selectedQueue}
            style={{
              ...styles.refreshButton,
              ...((loadingMetrics || !selectedQueue) ? styles.refreshButtonDisabled : {})
            }}
          >
            🔄 {loadingMetrics ? 'Chargement...' : 'Rafraîchir'}
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div style={styles.debugInfo}>
        <div style={styles.debugTitle}>📊 État de la connexion:</div>
        <div style={styles.debugContent}>{debugInfo}</div>
        {availableMetrics.length > 0 && (
          <details style={styles.debugDetails}>
            <summary style={styles.debugSummary}>
              Métriques disponibles ({availableMetrics.length})
            </summary>
            <div style={styles.metricsScroll}>
              <ul style={styles.debugList}>
                {availableMetrics.map((m, index) => (
                  <li key={`metric-${index}`} style={styles.debugListItem}>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}
      </div>

      {/* Sélecteurs */}
      <div style={styles.selectors}>
        <div style={styles.selectorGroup}>
          <label style={styles.label}>Queue Manager:</label>
          <select 
            value={selectedQmgr} 
            onChange={handleQmgrChange}
            style={styles.select}
            disabled={qmgrList.length === 0}
          >
            {qmgrList.length === 0 ? (
              <option value="">
                {availableMetrics.length === 0 ? 'Recherche...' : 'Aucun QMGR trouvé'}
              </option>
            ) : (
              qmgrList.map(qmgr => (
                <option key={qmgr.name} value={qmgr.name}>
                  {qmgr.label}
                </option>
              ))
            )}
          </select>
        </div>

        <div style={styles.selectorGroup}>
          <label style={styles.label}>Queue:</label>
          <select 
            value={selectedQueue} 
            onChange={handleQueueChange}
            style={styles.select}
            disabled={!selectedQmgr || queueList.length === 0}
          >
            {queueList.length === 0 ? (
              <option value="">
                {selectedQmgr ? 'Aucune queue trouvée' : 'Sélectionnez un QMGR'}
              </option>
            ) : (
              queueList.map(queue => (
                <option key={queue.name} value={queue.name}>
                  {queue.label}
                </option>
              ))
            )}
          </select>
        </div>

        <div style={styles.selectorGroup}>
          <label style={styles.label}>Plage de temps:</label>
          <select 
            value={timeRange} 
            onChange={handleTimeRangeChange}
            style={styles.select}
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <small style={styles.hint}>Cliquez sur "Rafraîchir" après modification</small>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          Erreur: {error}
        </div>
      )}

      {loadingMetrics && metrics.length === 0 && (
        <div style={styles.loader}>
          Chargement des métriques pour {selectedQueue}...
        </div>
      )}

      {/* Grille de métriques */}
      {metrics.length > 0 && (
        <div style={styles.grid}>
          {metrics.map((metric) => (
            <div 
              key={metric.id} 
              style={metric.type === 'graph' ? styles.gridItemWide : styles.gridItem}
            >
              <PrometheusWidget metric={metric} />
            </div>
          ))}
        </div>
      )}

      {availableMetrics.length === 0 && (
        <div style={styles.warning}>
          <strong>⚠️ Aucune métrique IBM MQ détectée</strong>
          <p>Vérifiez que :</p>
          <ul>
            <li>L'exporter IBM MQ est démarré et accessible</li>
            <li>Prometheus scrape correctement l'exporter MQ</li>
            <li>Les métriques sont visibles dans Prometheus (http://localhost:9090)</li>
          </ul>
        </div>
      )}
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
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  lastRefreshBadge: {
    backgroundColor: '#f5f5f5',
    color: '#666',
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.2s',
  },
  refreshButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  debugInfo: {
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '16px',
    fontSize: '13px',
  },
  debugTitle: {
    fontWeight: '600',
    marginBottom: '8px',
    color: '#555',
  },
  debugContent: {
    fontFamily: 'monospace',
    color: '#666',
    marginBottom: '8px',
  },
  debugDetails: {
    marginTop: '8px',
    cursor: 'pointer',
  },
  debugSummary: {
    fontWeight: '600',
    color: '#1976d2',
    cursor: 'pointer',
    padding: '4px',
  },
  metricsScroll: {
    maxHeight: '200px',
    overflowY: 'auto',
    marginTop: '8px',
  },
  debugList: {
    listStyle: 'none',
    padding: '8px 0 0 16px',
    margin: 0,
  },
  debugListItem: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#666',
    padding: '2px 0',
  },
  selectors: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
  },
  selectorGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  hint: {
    fontSize: '10px',
    color: '#999',
    fontStyle: 'italic',
    marginTop: '2px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  gridItem: {
    minHeight: '100px',
  },
  gridItemWide: {
    minHeight: '250px',
    gridColumn: 'span 2',
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
    marginTop: '16px',
  },
  warning: {
    backgroundColor: '#fff3e0',
    border: '1px solid #ffe0b2',
    borderRadius: '6px',
    padding: '16px',
    marginTop: '16px',
  },
};

export default MQMetrics;

// PrometheusWidget.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PrometheusWidget = ({ metric }) => {
  if (!metric) return null;

  const { name, result, error, type, unit = '', id } = metric;

  // Gestion des erreurs
  if (error) {
    return (
      <div style={styles.widget}>
        <h3 style={styles.title}>{name}</h3>
        <div style={styles.error}>
          ⚠️ Erreur: {error}
        </div>
      </div>
    );
  }

  // Aucun résultat
  if (!result) {
    return (
      <div style={styles.widget}>
        <h3 style={styles.title}>{name}</h3>
        <div style={styles.loading}>Chargement...</div>
      </div>
    );
  }

  // Affichage pour type Gauge (valeur unique)
  if (type === 'gauge') {
    const value = result.type === 'vector' && result.results.length > 0
      ? result.results[0].value
      : result.type === 'scalar'
      ? result.value
      : 'N/A';

    return (
      <div style={styles.widget}>
        <h3 style={styles.title}>{name}</h3>
        <div style={styles.gaugeValue}>
          {typeof value === 'number' ? value.toFixed(2) : value} {unit}
        </div>
      </div>
    );
  }

  // Affichage pour type Graph (historique)
  if (type === 'graph' && result.type === 'matrix') {
    const chartData = result.results.length > 0
      ? result.results[0].values.map(v => ({
          time: new Date(v.timestamp * 1000).toLocaleTimeString(),
          value: v.value
        }))
      : [];

    return (
      <div style={styles.widget}>
        <h3 style={styles.title}>{name}</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={styles.noData}>Aucune donnée disponible</div>
        )}
        <div style={styles.unit}>{unit}</div>
      </div>
    );
  }

  // Affichage pour type Table (plusieurs valeurs)
  if (type === 'table' && result.type === 'vector') {
    return (
      <div style={styles.widget}>
        <h3 style={styles.title}>{name}</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Métrique</th>
              <th style={styles.th}>Valeur</th>
            </tr>
          </thead>
          <tbody>
            {result.results.map((r, idx) => (
              <tr key={idx}>
                <td style={styles.td}>
                  {Object.entries(r.metric)
                    .map(([k, v]) => `${k}="${v}"`)
                    .join(', ')}
                </td>
                <td style={styles.td}>
                  {r.value.toFixed(2)} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Fallback
  return (
    <div style={styles.widget}>
      <h3 style={styles.title}>{name}</h3>
      <pre style={styles.raw}>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
};

const styles = {
  widget: {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  gaugeValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
    padding: '20px 0',
  },
  error: {
    color: '#d32f2f',
    padding: '12px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
    fontSize: '14px',
  },
  loading: {
    color: '#666',
    textAlign: 'center',
    padding: '20px',
    fontSize: '14px',
  },
  noData: {
    color: '#999',
    textAlign: 'center',
    padding: '40px',
    fontSize: '14px',
  },
  unit: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'right',
    marginTop: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '8px',
    borderBottom: '2px solid #e0e0e0',
    fontWeight: '600',
    color: '#555',
  },
  td: {
    padding: '8px',
    borderBottom: '1px solid #f0f0f0',
  },
  raw: {
    fontSize: '12px',
    backgroundColor: '#f5f5f5',
    padding: '12px',
    borderRadius: '4px',
    overflow: 'auto',
    maxHeight: '200px',
  },
};

export default PrometheusWidget;

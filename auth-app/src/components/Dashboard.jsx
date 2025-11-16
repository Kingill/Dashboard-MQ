import React, { useState, useEffect } from 'react';
import { Edit, Download, Activity, BarChart3, Users, AlertCircle } from 'lucide-react';
import { styles } from '../styles/styles';
import GlobalMetrics from './GlobalMetrics';
import UAMetrics from './UAMetrics';
import MQMetrics from './MQMetrics';


export default function Dashboard({ 
  selectedUA, 
  uaPage, 
  isAdmin, 
  userCodeUA,
  loadingUA,
  onSavePage,
  onLoadPage
}) {
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMetrics, setEditMetrics] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger la page UA au montage et quand selectedUA change
  useEffect(() => {
    if (selectedUA) {
      onLoadPage(selectedUA);
    }
  }, [selectedUA, onLoadPage]);

  const startEdit = () => {
    if (uaPage) {
      setEditTitle(uaPage.title);
      setEditContent(uaPage.content);
      setEditMetrics(uaPage.metrics !== false);
      setEditMode(true);
    }
  };

  const savePage = async () => {
    setSaving(true);
    const result = await onSavePage(selectedUA, {
      title: editTitle,
      content: editContent,
      metrics: editMetrics
    });
    setSaving(false);
    
    if (result.success) {
      setEditMode(false);
      alert(`✅ Page ${selectedUA} sauvegardée avec succès !`);
    } else {
      alert(`❌ Erreur: ${result.error}`);
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  if (loadingUA) {
    return (
      <div style={styles.mainContent}>
        <div style={styles.dashboardHeader}>
          <p style={{ textAlign: 'center', color: '#718096' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  const displayPage = uaPage || {
    title: `Dashboard Groupe ${selectedUA}`,
    content: 'Chargement...',
    metrics: true
  };

  return (
    <div style={styles.mainContent}>
      {/* Barre d'édition */}
      {editMode && (
        <div style={styles.editModeBar}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Edit size={20} style={{ marginRight: '10px' }} />
            <span style={{ fontWeight: '600' }}>Mode édition activé - {selectedUA}</span>
          </div>
          <div>
            <button
              style={{ ...styles.button, background: 'white', color: '#667eea', marginRight: '10px' }}
              onClick={savePage}
              disabled={saving}
            >
              <Download size={18} style={{ marginRight: '6px' }} />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              style={{ ...styles.button, background: '#718096' }}
              onClick={cancelEdit}
              disabled={saving}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* En-tête du dashboard */}
      <div style={editMode ? { ...styles.dashboardHeader, ...styles.editOverlay } : styles.dashboardHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={styles.uaBadge}>Code UA: {selectedUA}</span>
            {isAdmin && selectedUA !== userCodeUA && (
              <span style={{ ...styles.adminBadge, background: '#ed8936' }}>Vue Admin</span>
            )}
          </div>
          
          {isAdmin && !editMode && (
            <button style={styles.button} onClick={startEdit}>
              <Edit size={16} style={{ marginRight: '6px' }} />
              Modifier
            </button>
          )}
        </div>

        {editMode ? (
          <>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ ...styles.input, padding: '12px', fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}
              placeholder="Titre du dashboard"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{ ...styles.textarea, marginTop: '10px' }}
              placeholder="Contenu personnalisé..."
            />
            <div style={{ marginTop: '10px' }}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={editMetrics}
                  onChange={(e) => setEditMetrics(e.target.checked)}
                  style={styles.checkbox}
                />
                Afficher les métriques
              </label>
            </div>
          </>
        ) : (
          <>
            <h1 style={styles.title}>{displayPage.title}</h1>
            <p style={styles.subtitle}>{displayPage.content}</p>
          </>
        )}
      </div>

      {/* Métriques Globales Prometheus - Affichées partout */}
      {!editMode && (
        <GlobalMetrics autoRefresh={30000} />
      )}

      {/* Métriques anciennes (à conserver ou supprimer selon vos besoins) */}

      {/* Métriques Prometheus spécifiques à l'UA */}
      {displayPage.metrics && !editMode && selectedUA && (
        <>
          <UAMetrics uaName={selectedUA} autoRefresh={30000} />
          <MQMetrics uaName={selectedUA} autoRefresh={30000} />
        </>
      )}
    </div>
  );
}

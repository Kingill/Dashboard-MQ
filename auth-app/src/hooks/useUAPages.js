import { useState, useEffect, useCallback } from 'react';

// Utilise la variable d'environnement ou fallback vers proxy
// CORRECTION: Ne pas ajouter /api ici car VITE_API_URL contient déjà /api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function useUAPages() {
  const [uaPages, setUaPages] = useState({});
  const [availableUAs, setAvailableUAs] = useState([]);
  const [loadingUA, setLoadingUA] = useState(false);
  const [error, setError] = useState('');

  // Charger la liste des UAs disponibles depuis l'API
  const loadAvailableUAs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ua-pages`);
      if (response.ok) {
        const data = await response.json();
        setAvailableUAs(data.uas || []);
      } else {
        console.error('Erreur chargement UAs');
        setAvailableUAs([]);
      }
    } catch (err) {
      console.error('Erreur chargement index UAs:', err);
      setError('Impossible de charger la liste des UAs');
      setAvailableUAs([]);
    }
  }, []);

  // Charger une page UA spécifique depuis l'API
  const loadUAPage = useCallback(async (uaCode) => {
    if (!uaCode || uaPages[uaCode]) return; // Déjà chargée
    
    setLoadingUA(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/ua-pages/${uaCode}`);
      if (response.ok) {
        const data = await response.json();
        setUaPages(prev => ({
          ...prev,
          [uaCode]: data
        }));
      } else if (response.status === 404) {
        // Page non trouvée, créer une page par défaut
        setUaPages(prev => ({
          ...prev,
          [uaCode]: {
            title: `Dashboard Groupe ${uaCode}`,
            content: `Page personnalisée pour le groupe ${uaCode}.\n\nCette page n'existe pas encore. Un administrateur peut la créer.`,
            metrics: true
          }
        }));
      } else {
        throw new Error('Erreur de chargement');
      }
    } catch (err) {
      console.error('Erreur chargement page UA:', err);
      setError(`Impossible de charger la page ${uaCode}`);
      setUaPages(prev => ({
        ...prev,
        [uaCode]: {
          title: `Dashboard Groupe ${uaCode}`,
          content: 'Erreur de chargement de la page.',
          metrics: false
        }
      }));
    } finally {
      setLoadingUA(false);
    }
  }, [uaPages]);

  // Sauvegarder une page UA sur le serveur
  const saveUAPage = useCallback(async (uaCode, pageData) => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/ua-pages/${uaCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData)
      });

      if (response.ok) {
        const result = await response.json();
        // Mettre à jour le cache local
        setUaPages(prev => ({
          ...prev,
          [uaCode]: result.data
        }));
        // Recharger la liste des UAs
        await loadAvailableUAs();
        return { success: true, message: result.message };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur de sauvegarde');
      }
    } catch (err) {
      console.error('Erreur sauvegarde page UA:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [loadAvailableUAs]);

  // Mettre à jour une page UA en mémoire uniquement
  const updateUAPageLocal = useCallback((uaCode, updatedData) => {
    setUaPages(prev => ({
      ...prev,
      [uaCode]: updatedData
    }));
  }, []);

  // Créer une nouvelle page UA
  const createNewUAPage = useCallback(async (uaCode) => {
    if (!uaCode) {
      return { success: false, error: 'Code UA requis' };
    }
    
    if (availableUAs.includes(uaCode)) {
      return { success: false, error: 'UA déjà existante' };
    }

    const newPage = {
      title: `Dashboard Groupe ${uaCode}`,
      content: `Page personnalisée pour le groupe ${uaCode}.\n\nAjoutez ici le contenu spécifique à cette unité.`,
      metrics: true
    };
    
    // Sauvegarder sur le serveur
    const result = await saveUAPage(uaCode, newPage);
    
    if (result.success) {
      return { success: true, uaCode };
    } else {
      return { success: false, error: result.error };
    }
  }, [availableUAs, saveUAPage]);

  // Supprimer une page UA
  const deleteUAPage = useCallback(async (uaCode) => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/ua-pages/${uaCode}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Retirer de la liste locale
        setAvailableUAs(prev => prev.filter(ua => ua !== uaCode));
        setUaPages(prev => {
          const newPages = { ...prev };
          delete newPages[uaCode];
          return newPages;
        });
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur de suppression');
      }
    } catch (err) {
      console.error('Erreur suppression page UA:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Charger les UAs au démarrage
  useEffect(() => {
    loadAvailableUAs();
  }, [loadAvailableUAs]);

  return {
    // État
    uaPages,
    availableUAs,
    loadingUA,
    error,
    
    // Actions
    loadUAPage,
    saveUAPage,
    updateUAPageLocal,
    createNewUAPage,
    deleteUAPage,
    loadAvailableUAs,
    setError
  };
}

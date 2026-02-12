
import { FamilyRecord } from './types';

const STORAGE_KEY = 'health_assess_records';
const DRAFT_KEY = 'health_assess_draft';
const API_CONFIG_KEY = 'health_assess_api_url';

export const db = {
  // Configuración de la URL del servidor central
  setApiUrl: (url: string) => localStorage.setItem(API_CONFIG_KEY, url),
  
  // Si no hay URL configurada manualmente, usamos el servidor propio (/api)
  getApiUrl: () => localStorage.getItem(API_CONFIG_KEY) || `${window.location.origin}/api`,

  getRecords: async (): Promise<FamilyRecord[]> => {
    const apiUrl = db.getApiUrl();
    
    try {
      const response = await fetch(`${apiUrl}/records`);
      if (response.ok) {
        const records = await response.json();
        // Guardar copia local por si se pierde conexión
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        return records;
      }
    } catch (e) {
      console.warn("Servidor central no disponible, cargando locales...");
    }

    // Fallback al almacenamiento local
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveRecord: async (record: FamilyRecord): Promise<boolean> => {
    // 1. Guardar localmente siempre
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = records.findIndex((r: any) => r.id === record.id);
    if (index >= 0) records[index] = record;
    else records.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

    // 2. Sincronizar con el servidor central
    const apiUrl = db.getApiUrl();
    try {
      const response = await fetch(`${apiUrl}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      return response.ok;
    } catch (e) {
      console.error("Error al sincronizar con el servidor central", e);
      return false;
    }
  },

  deleteRecord: async (id: string): Promise<void> => {
    // Eliminar local
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.filter((r: any) => r.id !== id)));

    // Eliminar en servidor
    const apiUrl = db.getApiUrl();
    try {
      await fetch(`${apiUrl}/records/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Error eliminando en servidor", e);
    }
  },

  saveDraft: (record: FamilyRecord) => localStorage.setItem(DRAFT_KEY, JSON.stringify(record)),
  getDraft: (): FamilyRecord | null => {
    const data = localStorage.getItem(DRAFT_KEY);
    return data ? JSON.parse(data) : null;
  },
  clearDraft: () => localStorage.removeItem(DRAFT_KEY),

  exportDatabase: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    const blob = new Blob([data || '[]'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health_assess_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  },

  importDatabase: (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        return true;
      }
    } catch (e) { return false; }
    return false;
  }
};

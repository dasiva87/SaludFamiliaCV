
import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FamilyRecord } from '../types';

const COLORS = ['#dd2836', '#b8212d', '#9b1c26', '#f15a64', '#f8a5ab', '#fde8ea'];

interface DashboardProps {
  onEditRecord: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onEditRecord }) => {
  const [records, setRecords] = useState<FamilyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiUrl, setApiUrl] = useState(db.getApiUrl());
  const [showConfig, setShowConfig] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await db.getRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading records:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const totalFamilies = records.length;
    const totalMembers = records.reduce((acc, r) => acc + (r?.familyInfo?.members?.length || 0), 0);
    
    const sisbenMap: any = {};
    records.forEach(r => {
      const s = r?.generalData?.sisben || 'Sin definir';
      sisbenMap[s] = (sisbenMap[s] || 0) + 1;
    });
    const sisbenData = Object.keys(sisbenMap).map(k => ({ name: k, value: sisbenMap[k] }));

    const healthMap: any = {};
    records.forEach(r => {
      if (r?.medicalHistory) {
        Object.keys(r.medicalHistory).forEach(condition => {
          const conditionValue = r.medicalHistory[condition];
          if (conditionValue && typeof conditionValue === 'object') {
            const isPresent = Object.values(conditionValue).some(v => v === true);
            if (isPresent) healthMap[condition] = (healthMap[condition] || 0) + 1;
          }
        });
      }
    });
    const healthData = Object.keys(healthMap).map(k => ({ name: k, count: healthMap[k] }));
    
    let dbSize = "0.00";
    try {
      dbSize = (new Blob([JSON.stringify(records)]).size / 1024).toFixed(2);
    } catch (e) {}

    return { totalFamilies, totalMembers, sisbenData, healthData, dbSize };
  }, [records]);

  const handleDelete = async (id: string) => {
    if (confirm("¿Está seguro de eliminar este registro permanentemente?")) {
      await db.deleteRecord(id);
      loadData();
    }
  };

  const handleSaveConfig = () => {
    db.setApiUrl(apiUrl);
    setShowConfig(false);
    loadData();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Sincronizando base de datos...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Modal de Configuración Cloud */}
      {showConfig && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Configuración de Nube</h3>
            <p className="text-sm text-slate-500 mb-6">Ingresa la URL del servidor central para que todos los usuarios compartan la misma base de datos.</p>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">URL del Servidor API</label>
                <input 
                  type="text" 
                  placeholder="https://tu-api.railway.app" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none text-sm"
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button onClick={() => setShowConfig(false)} className="flex-1 py-3 text-slate-600 font-bold text-sm">Cancelar</button>
                <button onClick={handleSaveConfig} className="flex-1 py-3 bg-brand text-white rounded-xl font-bold text-sm shadow-lg shadow-brand/20">Conectar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header con Estado de Persistencia */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${apiUrl ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-light text-brand'}`}>
              <i className={`fas ${apiUrl ? 'fa-cloud' : 'fa-hdd'} text-xl`}></i>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">{apiUrl ? 'Modo Colaborativo Cloud' : 'Modo Autónomo Local'}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[200px]">
                {apiUrl ? `Conectado: ${apiUrl}` : 'Los datos solo viven en este navegador'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowConfig(true)} className="text-[10px] font-bold text-brand uppercase border-2 border-brand/10 px-4 py-2 rounded-lg hover:bg-brand-light transition-all">
            {apiUrl ? 'Cambiar Servidor' : 'Conectar Nube'}
          </button>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Portabilidad</span>
            <span className="text-white text-xs font-bold">Base de Datos JSON</span>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => db.exportDatabase()} title="Exportar Backup" className="w-10 h-10 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center justify-center">
              <i className="fas fa-download text-xs"></i>
            </button>
            <button onClick={() => fileInputRef.current?.click()} title="Importar Backup" className="w-10 h-10 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center justify-center">
              <i className="fas fa-upload text-xs"></i>
            </button>
            <input type="file" ref={fileInputRef} onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                  if (db.importDatabase(ev.target?.result as string)) {
                    alert("Importación exitosa");
                    loadData();
                  }
                };
                reader.readAsText(file);
              }
            }} className="hidden" accept=".json" />
          </div>
        </div>
      </div>

      {/* Indicadores Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Familias', val: stats.totalFamilies, icon: 'fa-house-user', color: 'text-brand' },
          { label: 'Individuos', val: stats.totalMembers, icon: 'fa-users', color: 'text-emerald-600' },
          { label: 'Media Miembros', val: (stats.totalMembers / (stats.totalFamilies || 1)).toFixed(1), icon: 'fa-calculator', color: 'text-slate-600' },
          { label: 'Riesgos Salud', val: stats.healthData.length, icon: 'fa-briefcase-medical', color: 'text-amber-600' }
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
            <div className="flex justify-between items-end">
              <h3 className={`text-3xl font-bold ${item.color}`}>{item.val}</h3>
              <i className={`fas ${item.icon} text-slate-100 text-2xl`}></i>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center uppercase text-xs tracking-widest"><i className="fas fa-heart-pulse mr-2 text-brand"></i> Perfil Epidemiológico</h4>
          <div className="h-72 w-full">
            {stats.healthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.healthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#dd2836" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No hay datos de salud registrados.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center uppercase text-xs tracking-widest"><i className="fas fa-chart-pie mr-2 text-brand-dark"></i> Clasificación Sisbén</h4>
          <div className="h-72 w-full">
            {stats.sisbenData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.sisbenData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                    {stats.sisbenData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No hay datos de Sisbén registrados.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Registros Sincronizados</h4>
          <button onClick={loadData} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand transition-colors">
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-4">ID / Fecha</th>
                <th className="px-8 py-4">Familia / Ubicación</th>
                <th className="px-8 py-4">Estado</th>
                <th className="px-8 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm">No hay registros para mostrar.</td></tr>
              ) : (
                records.slice().reverse().map(r => (
                  <tr key={r?.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="text-[10px] text-slate-400 font-mono">{r?.id?.slice(0, 8) || '---'}</div>
                      <div className="text-[9px] text-slate-300 font-bold uppercase">{r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : '---'}</div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="font-bold text-slate-800 uppercase text-xs">FAMILIA {r?.familyInfo?.headLastName1 || '---'}</div>
                      <div className="text-[10px] text-slate-500">{r?.familyInfo?.neighborhood || '---'}</div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${apiUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {apiUrl ? 'Sincronizado' : 'Local'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => onEditRecord(r.id)} className="w-9 h-9 rounded-xl text-slate-400 hover:text-brand hover:bg-brand-light flex items-center justify-center transition-all">
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="w-9 h-9 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all">
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

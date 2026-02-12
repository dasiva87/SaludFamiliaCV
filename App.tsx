
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import FormWizard from './components/FormWizard';
import Dashboard from './components/Dashboard';

export enum View {
  Form = 'form',
  Dashboard = 'dashboard'
}

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.Form);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingRecordId(id);
    setView(View.Form);
  };

  const handleNew = () => {
    setEditingRecordId(null);
    setView(View.Form);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentView={view} onViewChange={(v) => {
        if (v === View.Form) handleNew();
        else setView(v);
      }} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {view === View.Form ? (
          <FormWizard editingId={editingRecordId} onComplete={() => setView(View.Dashboard)} />
        ) : (
          <Dashboard onEditRecord={handleEdit} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Universidad del Sinú - Escuela de Enfermería</p>
        <p>Sistema de Valoración Familiar Digital - Persistencia Local Activada</p>
      </footer>
    </div>
  );
};

export default App;


import React from 'react';

interface NavbarProps {
  currentView: 'form' | 'dashboard';
  onViewChange: (view: any) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-brand text-white p-2 rounded-lg">
              <i className="fas fa-hospital-user text-xl"></i>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">Valoración familiar</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">Escuela de Enfermería</p>
            </div>
          </div>

          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => onViewChange('form')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'form' 
                ? 'bg-white text-brand shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-file-medical mr-2"></i> Nuevo Registro
            </button>
            <button
              onClick={() => onViewChange('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'dashboard' 
                ? 'bg-white text-brand shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-chart-line mr-2"></i> Dashboard
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

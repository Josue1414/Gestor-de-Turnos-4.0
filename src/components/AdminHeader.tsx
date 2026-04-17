import React from 'react';
import { Edit2, Settings, Save, Map as MapIcon, ArrowLeft, LogOut } from 'lucide-react';

interface AdminHeaderProps {
  seccionName: string;
  setSeccionName: (val: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (val: boolean) => void;
  onOpenProfile: () => void;
  onSave: () => void;
  onShowCroquis: () => void;
  onBack?: () => void;
  onLogout?: () => void;
  isSuperAdminViewing?: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  seccionName, setSeccionName, isEditingTitle, setIsEditingTitle,
  onOpenProfile, onSave, onShowCroquis, onBack, onLogout, isSuperAdminViewing
}) => {
  return (
    <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4 shrink-0 gap-4">
      <div>
        <div className="flex items-center gap-2 group">
          {isEditingTitle ? (
            <input 
              type="text" 
              value={seccionName} 
              onChange={(e) => setSeccionName(e.target.value)}
              className="font-black text-2xl sm:text-3xl text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all w-full max-w-[300px]"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && onSave()}
            />
          ) : (
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              {seccionName}
              {!isSuperAdminViewing && (
                <button onClick={() => setIsEditingTitle(true)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-blue-600">
                  <Edit2 size={18} />
                </button>
              )}
            </h1>
          )}
        </div>
        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">
          {isSuperAdminViewing ? 'Vista de Supervisión' : 'Panel de Administración'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto">
        {isEditingTitle && (
          <button onClick={onSave} className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm">
            <Save size={16} /> Guardar
          </button>
        )}

        {onBack ? (
          <button onClick={onBack} className="bg-slate-800 text-white hover:bg-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition">
            <ArrowLeft size={16} /> Regresar
          </button>
        ) : null}

        {onLogout ? (
          <button onClick={onLogout} className="bg-white text-red-600 border border-slate-200 hover:border-red-200 px-3 py-2.5 rounded-xl text-sm font-bold shadow-sm transition">
            <LogOut size={16} /> Salir
          </button>
        ) : null}

        <button onClick={onShowCroquis} className="bg-white border border-slate-300 text-slate-700 px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm hover:bg-slate-50">
          <MapIcon size={16} className="text-indigo-500" /> Croquis
        </button>

        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        <button 
          onClick={onOpenProfile}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition shadow-sm"
          title="Mi Información"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
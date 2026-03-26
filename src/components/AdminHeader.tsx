import React from 'react';
import { Edit2, Settings, Save, Map as MapIcon, Users, ArrowLeft, LogOut } from 'lucide-react';

interface AdminHeaderProps {
  seccionName: string;
  setSeccionName: (val: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (val: boolean) => void;
  onOpenProfile: () => void;
  onSave: () => void;
  onShowCroquis: () => void;
  onShowDirectorio: () => void;
  onBack?: () => void;
  onLogout?: () => void;
  isSuperAdminViewing?: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  seccionName,
  setSeccionName,
  isEditingTitle,
  setIsEditingTitle,
  onOpenProfile,
  onSave,
  onShowCroquis,
  onShowDirectorio,
  onBack,
  onLogout,
  isSuperAdminViewing
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
              onBlur={() => setIsEditingTitle(false)} 
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)} 
              autoFocus 
              className="text-xl font-black text-slate-800 tracking-tight border-b-2 border-blue-500 outline-none bg-slate-50 px-2 py-1 rounded" 
            />
          ) : (
            <h1 
              onClick={() => setIsEditingTitle(true)} 
              className="text-xl font-black text-slate-800 tracking-tight cursor-pointer hover:text-blue-600 transition flex items-center gap-2"
            >
              MI SECCIÓN: {seccionName} <Edit2 size={16} className="text-slate-300" />
            </h1>
          )}
        </div>
        <p className="text-slate-500 text-sm mt-1">Evento Activo</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto">
        
        {/* --- NUEVOS BOTONES (ROJOS EN TU DIBUJO) --- */}
        {isSuperAdminViewing && onBack ? (
          <button onClick={onBack} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2.5 rounded-xl text-sm font-bold shadow-sm transition">
            <ArrowLeft size={16} /> Regresar
          </button>
        ) : onLogout ? (
          <button onClick={onLogout} className="flex items-center gap-1.5 bg-white hover:bg-red-50 text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-3 py-2.5 rounded-xl text-sm font-bold shadow-sm transition">
            <LogOut size={16} /> Salir
          </button>
        ) : null}

        <button onClick={onShowCroquis} className="bg-white border border-slate-300 text-slate-700 px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm hover:bg-slate-50">
          <MapIcon size={16} className="text-indigo-500" /> Croquis
        </button>
        
        <button onClick={onShowDirectorio} className="bg-slate-800 text-white px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-700 transition shadow-sm">
          <Users size={16} /> Participantes
        </button>

        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* --- BOTÓN DE AJUSTES --- */}
        <button 
          onClick={onOpenProfile}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition shadow-sm"
          title="Mi Información"
        >
          <Settings size={20} />
        </button>
        
        <button 
          onClick={onSave}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition hidden md:flex"
        >
          <Save size={18} /> Guardar
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
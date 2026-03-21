import React from 'react';
import { Edit2, Settings, Save } from 'lucide-react';

interface AdminHeaderProps {
  seccionName: string;
  setSeccionName: (val: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (val: boolean) => void;
  onOpenProfile: () => void;
  onSave: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  seccionName,
  setSeccionName,
  isEditingTitle,
  setIsEditingTitle,
  onOpenProfile,
  onSave
}) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4 shrink-0 gap-4">
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
        <p className="text-slate-500 text-sm mt-1">Evento: Convención Anime</p>
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button 
          onClick={onOpenProfile}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition shadow-sm"
          title="Mi Información"
        >
          <Settings size={20} />
        </button>
        
        <button 
          onClick={onSave}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition"
        >
          <Save size={18} /> Guardar Cambios
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
import React from 'react';
import { Plus, Map as MapIcon, Users, Bird } from 'lucide-react';

interface AdminStatsBarProps {
  totalCajas: number;
  turnosActivos: number;
  turnosLibres: number;
  totalParticipantes: number;
  onCrearCaja: () => void;
  onShowCroquis: () => void;
  onShowDirectorio: () => void;
}

const AdminStatsBar: React.FC<AdminStatsBarProps> = ({
  totalCajas,
  turnosActivos,
  turnosLibres,
  totalParticipantes,
  onCrearCaja,
  onShowCroquis,
  onShowDirectorio
}) => {
  return (
    <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold text-slate-600">
        <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">🏢 {totalCajas} Cajas</span>
        <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">⏳ {turnosActivos} Turnos</span>
        <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 font-bold text-blue-600">
          <Bird size={16} /> {turnosLibres} Libres
        </span>
        <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">👥 {totalParticipantes} Participantes</span>
        <button onClick={onCrearCaja} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-slate-700 transition shadow-sm">
          <Plus size={14} /> Kiosco Normal
        </button>
      </div>
      <div className="flex gap-2 w-full lg:w-auto">
        <button onClick={onShowCroquis} className="flex-1 lg:flex-none bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm">
          <MapIcon size={16} className="text-indigo-500" /> Croquis
        </button>
        <button onClick={onShowDirectorio} className="flex-1 lg:flex-none bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-md">
          <Users size={16} /> Participantes
        </button>
      </div>
    </div>
  );
};

export default AdminStatsBar;
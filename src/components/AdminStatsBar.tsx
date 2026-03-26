import React from 'react';
import { Plus, Bird } from 'lucide-react';

interface AdminStatsBarProps {
  totalCajas: number;
  turnosActivos: number;
  turnosLibres: number;
  totalParticipantes: number;
  onCrearCaja: () => void;
}

const AdminStatsBar: React.FC<AdminStatsBarProps> = ({
  totalCajas,
  turnosActivos,
  turnosLibres,
  totalParticipantes,
  onCrearCaja
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold text-slate-600">
      <button onClick={onCrearCaja} className="bg-slate-800 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 hover:bg-slate-700 transition shadow-sm">
        <Plus size={14} /> Kiosco Normal
      </button>
      <span className="bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm whitespace-nowrap">🏢 {totalCajas} Cajas</span>
      <span className="bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm whitespace-nowrap">⏳ {turnosActivos} Turnos</span>
      <span className="bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm flex items-center gap-1.5 font-bold text-blue-600 whitespace-nowrap">
        <Bird size={16} /> {turnosLibres} Libres
      </span>
      <span className="bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm whitespace-nowrap">👥 {totalParticipantes} Participantes</span>
    </div>
  );
};

export default AdminStatsBar;
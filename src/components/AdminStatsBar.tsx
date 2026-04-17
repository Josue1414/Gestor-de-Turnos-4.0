import React from 'react';
import { Plus, Users } from 'lucide-react';

interface AdminStatsBarProps {
  totalCajas: number;
  turnosActivos: number;
  turnosLibres: number;
  totalParticipantes: number;
  onCrearCaja: () => void;
  onShowDirectorio: () => void; // <-- Agregamos esta función
}

const AdminStatsBar: React.FC<AdminStatsBarProps> = ({
  totalCajas, turnosActivos, totalParticipantes, onCrearCaja, onShowDirectorio
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold text-slate-600">
      <button onClick={onCrearCaja} className="bg-slate-800 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 hover:bg-slate-700 transition shadow-sm">
        <Plus size={14} /> Kiosco Normal
      </button>
      
      <span className="bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm whitespace-nowrap hidden sm:inline-block">🏢 {totalCajas} Cajas</span>
      <span className="bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm whitespace-nowrap hidden sm:inline-block">⏳ {turnosActivos} Turnos</span>
      
      {/* Botón de Participantes rediseñado */}
      <button 
        onClick={onShowDirectorio} 
        className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-2 rounded-xl shadow-sm whitespace-nowrap transition flex items-center gap-1.5"
      >
        <Users size={16} /> {totalParticipantes} Participantes
      </button>
    </div>
  );
};

export default AdminStatsBar;
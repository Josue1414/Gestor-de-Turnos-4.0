import React from 'react';
import { Plus, Users, Bird } from 'lucide-react'; // <-- Importamos el Ave (Bird)

interface AdminStatsBarProps {
  totalCajas: number;
  turnosActivos: number;
  turnosLibres: number;
  totalParticipantes: number;
  onCrearCaja: () => void;
  onCrearHorario: () => void; // <-- Agregamos esta función
  onShowDirectorio: () => void; 
}

const AdminStatsBar: React.FC<AdminStatsBarProps> = ({
  totalCajas, turnosActivos, turnosLibres, totalParticipantes, onCrearCaja, onCrearHorario, onShowDirectorio
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold text-slate-600">
      
      {/* Botón de Cajas */}
      <button onClick={onCrearCaja} className="bg-slate-800 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 hover:bg-slate-700 transition shadow-sm">
        <Plus size={14} /> Caja Normal
      </button>

      {/* Botón de Turnos (Horarios) - Movido aquí */}
      <button onClick={onCrearHorario} className="bg-blue-100 text-blue-600 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 hover:bg-blue-200 transition shadow-sm">
        <Plus size={14} /> Turno
      </button>
      
      <span className="bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm whitespace-nowrap hidden sm:inline-block">🏢 {totalCajas} Cajas</span>
      <span className="bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm whitespace-nowrap hidden sm:inline-block">⏳ {turnosActivos} Turnos</span>
      
      {/* Nueva Etiqueta de Horarios Libres con el Ave */}
      <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-2 rounded-xl shadow-sm whitespace-nowrap hidden sm:inline-flex items-center gap-1">
        <Bird size={14} /> {turnosLibres} Libres
      </span>

      {/* Botón de Participantes */}
      <button onClick={onShowDirectorio} className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl flex items-center gap-1 hover:bg-slate-50 transition shadow-sm ml-auto sm:ml-0">
        <Users size={14} className="text-indigo-500" />
        <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md ml-1">{totalParticipantes}</span>
      </button>
    </div>
  );
};

export default AdminStatsBar;
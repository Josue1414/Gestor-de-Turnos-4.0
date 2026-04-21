import React from 'react';
import { X, Box, Clock, LayoutGrid, CheckCircle, Users, UserMinus } from 'lucide-react';

interface AdminStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    cajas: number;
    horarios: number;
    totales: number;
    disponibles: number;
    participantes: number;
    inactivos: number;
  };
}

const AdminStatsModal: React.FC<AdminStatsModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-800 p-5 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-white font-black flex items-center gap-2"><LayoutGrid size={20} className="text-blue-400"/> Estadísticas Generales</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard icon={<Box size={24}/>} label="Cajas Activas" value={stats.cajas} color="bg-blue-50 text-blue-600 border-blue-200" />
          <StatCard icon={<Clock size={24}/>} label="Horarios Únicos" value={stats.horarios} color="bg-indigo-50 text-indigo-600 border-indigo-200" />
          <StatCard icon={<LayoutGrid size={24}/>} label="Turnos Totales" value={stats.totales} color="bg-purple-50 text-purple-600 border-purple-200" />
          <StatCard icon={<CheckCircle size={24}/>} label="Turnos Libres" value={stats.disponibles} color="bg-emerald-50 text-emerald-600 border-emerald-200" />
          <StatCard icon={<Users size={24}/>} label="Participantes" value={stats.participantes} color="bg-amber-50 text-amber-600 border-amber-200" />
          <StatCard icon={<UserMinus size={24}/>} label="Inactivos" value={stats.inactivos} color="bg-red-50 text-red-600 border-red-200" />
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
           <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition shadow-sm">Cerrar Panel</button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: {icon: React.ReactNode, label: string, value: number, color: string}) => (
  <div className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center shadow-sm ${color}`}>
    <div className="mb-2 opacity-80">{icon}</div>
    <div className="text-3xl font-black mb-1">{value}</div>
    <div className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</div>
  </div>
);

export default AdminStatsModal;
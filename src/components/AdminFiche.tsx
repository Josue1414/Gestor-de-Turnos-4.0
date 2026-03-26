import React from 'react';
import { Settings, Trash2, Key, Eye, Download } from 'lucide-react';
import type { AdminData } from '../hooks/useSuperAdminLogic';

const StatBadge = ({ label, value, colorClass }: { label: string, value: string | number, colorClass: string }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 text-center flex flex-col justify-center shadow-sm">
    <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 tracking-wider leading-tight">{label}</span>
    <span className={`text-sm font-black ${colorClass} leading-none mt-0.5`}>{value}</span>
  </div>
);

interface AdminFicheProps {
  data: AdminData;
  stats: { cajas: number, horarios: number, totales: number, disponibles: number, participantes: number };
  onOpenSettings: (data: AdminData) => void;
  onDownload: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

const AdminFiche: React.FC<AdminFicheProps> = ({ data, stats, onOpenSettings, onDownload, onView, onDelete }) => (
  <div className="w-full sm:w-[280px] bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all rounded-xl flex flex-col overflow-hidden">
    
    <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div className="pr-2 w-full overflow-hidden">
          <h4 className="font-black text-slate-800 leading-tight text-base truncate">{data.name}</h4>
          <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{data.org || 'Sin Organización'}</p>
        </div>
        
        <div className="flex gap-1.5 shrink-0">
          <button onClick={() => onOpenSettings(data)} className="p-1.5 bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-slate-100 transition shadow-sm" title="Ajustes">
            <Settings size={14} />
          </button>
          <button onClick={() => onDelete(data.id, data.name)} className="p-1.5 bg-red-50 border border-red-100 text-red-500 rounded-md hover:bg-red-100 transition shadow-sm" title="Eliminar Admin">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 mt-2 shadow-sm">
        <p className="text-[10px] font-black text-blue-600 uppercase mb-2 flex items-center gap-1">
          <Key size={12} /> Datos de Acceso
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Usuario (ID):</span>
            <span className="text-xs font-mono font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 select-all">{data.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Contraseña:</span>
            <span className="text-xs font-mono font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 select-all">{data.password}</span>
          </div>
        </div>
      </div>
    </div>

    <div className="p-3 grid grid-cols-2 gap-2 bg-white">
      <StatBadge label="Cajas" value={stats.cajas} colorClass="text-slate-700" />
      <StatBadge label="Total Horarios" value={stats.horarios} colorClass="text-slate-700" />
      <StatBadge label="Turnos Totales" value={stats.totales} colorClass="text-indigo-600" />
      <StatBadge label="Turnos Disp." value={stats.disponibles} colorClass="text-emerald-500" />
      <StatBadge label="Participantes" value={stats.participantes} colorClass="text-slate-700" />
      <StatBadge label="Part. Inactivos" value={0} colorClass="text-slate-300" />
    </div>

    <div className="p-3 flex gap-2 bg-slate-50 border-t border-slate-100">
      <button onClick={() => onView(data.id)} className="flex-[2] p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition shadow-sm flex items-center justify-center gap-1 text-[11px] font-bold uppercase">
        <Eye size={14} /> Ver Panel
      </button>
      <button onClick={() => onDownload(data.id)} className="flex-1 bg-white border border-slate-200 text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition flex items-center justify-center shadow-sm" title="Descargar Tabla">
        <Download size={14} />
      </button>
    </div>
  </div>
);

export default AdminFiche;
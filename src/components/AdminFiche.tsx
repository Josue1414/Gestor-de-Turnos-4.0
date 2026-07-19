import React, { useState } from 'react';
import { Settings, Trash2, Key, Eye, Download, ChevronDown, ChevronUp, MapIcon } from 'lucide-react';
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
  onOpenCroquisAdmin?: (id: string) => void;
}

const AdminFiche: React.FC<AdminFicheProps> = ({ data, stats, onOpenSettings, onDownload, onView, onDelete, onOpenCroquisAdmin }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full sm:w-[280px] bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all rounded-xl overflow-hidden">
      <div className="p-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-start gap-3">
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 transition shadow-sm"
            title={isExpanded ? 'Colapsar' : 'Expandir'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <div className="min-w-0 flex-1">
            <h4 className="font-black text-slate-800 leading-tight text-base truncate">{data.name}</h4>
            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{data.org || 'Sin Organización'}</p>
            <div className="flex flex-wrap gap-1 mt-2 text-[10px] text-slate-500">
              <span className="bg-white/90 border border-slate-200 rounded-full px-2 py-1">Cajas {stats.cajas}</span>
              <span className="bg-white/90 border border-slate-200 rounded-full px-2 py-1">Horarios {stats.horarios}</span>
              <span className="bg-white/90 border border-slate-200 rounded-full px-2 py-1">Turnos {stats.totales}</span>
            </div>
          </div>

          {/* AQUÍ MOVIMOS EL BOTÓN PARA QUE ESTÉ SIEMPRE VISIBLE */}
          <div className="flex gap-1.5 shrink-0">
            {onOpenCroquisAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenCroquisAdmin(data.id); }}
                className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-md hover:bg-indigo-100 transition shadow-sm"
                title="Croquis de esta área"
              >
                <MapIcon size={14} />
              </button>
            )}
            <button
              onClick={() => onOpenSettings(data)}
              className="p-1.5 bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-slate-100 transition shadow-sm"
              title="Ajustes"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={() => onDelete(data.id, data.name)}
              className="p-1.5 bg-red-50 border border-red-100 text-red-500 rounded-md hover:bg-red-100 transition shadow-sm"
              title="Eliminar Admin"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {isExpanded ? (
        <div className="p-3 bg-white space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
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

          <div className="grid grid-cols-2 gap-2">
            <StatBadge label="Cajas" value={stats.cajas} colorClass="text-slate-700" />
            <StatBadge label="Horarios" value={stats.horarios} colorClass="text-slate-700" />
            <StatBadge label="Turnos" value={stats.totales} colorClass="text-indigo-600" />
            <StatBadge label="Disp." value={stats.disponibles} colorClass="text-emerald-500" />
            <StatBadge label="Participantes" value={stats.participantes} colorClass="text-slate-700" />
            <StatBadge label="Inactivos" value={0} colorClass="text-slate-300" />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => onView(data.id)}
              className="flex-1 py-1.5 px-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition shadow-sm flex items-center justify-center gap-1 text-[11px] font-bold uppercase"
            >
              <Eye size={14} /> Ver
            </button>
            <button
              onClick={() => onDownload(data.id)}
              className="flex-1 py-1.5 px-3 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1 shadow-sm"
              title="Descargar tabla del admin"
            >
              <Download size={14} /> Descargar
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 flex flex-col gap-2 bg-slate-50 border-t border-slate-100">
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
            <span className="bg-slate-100 px-2 py-1 rounded-full">Disp. {stats.disponibles}</span>
            <span className="bg-slate-100 px-2 py-1 rounded-full">Part. {stats.participantes}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onView(data.id)}
              className="flex-1 py-1.5 px-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition shadow-sm text-[11px] font-bold uppercase flex items-center justify-center gap-1"
            >
              <Eye size={14} /> Ver
            </button>
            <button
              onClick={() => onDownload(data.id)}
              className="flex-1 py-1.5 px-3 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition shadow-sm flex items-center justify-center gap-1"
              title="Descargar tabla del admin"
            >
              <Download size={14} /> Descargar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFiche;
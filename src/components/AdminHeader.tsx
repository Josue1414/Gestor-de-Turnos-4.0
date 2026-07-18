import React, { useState } from 'react';
import { MapIcon, ArrowLeft, LogOut, Settings, Users, Plus, Inbox, Clock, Download } from 'lucide-react';

interface AdminInfo {
  name: string;
  org: string;
}

interface StatsData {
  cajas: number;
  horarios: number;
  totales: number;
  disponibles: number;
  participantes: number;
  inactivos: number;
}

interface AdminHeaderProps {
  seccionName: string;
  setSeccionName: (name: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (val: boolean) => void;
  onOpenProfile: () => void;
  onSave: () => void;
  onShowCroquis: () => void;
  onShowDirectorio?: () => void;
  participantesCount?: number;
  onToggleActions?: () => void;
  showActions?: boolean;
  onCrearCajaEspecial?: () => void;
  onCrearCaja?: () => void;
  onCrearHorario?: () => void;
  onDownloadTabla?: () => void;
  onBack?: () => void;
  onLogout?: () => void;
  isSuperAdminViewing?: boolean;
  adminInfo?: AdminInfo | null;
  stats?: StatsData;
}

const MiniStatCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border shadow-sm ${color} min-w-[3.5rem] sm:min-w-[4.5rem] flex-1 sm:flex-none`}>
    <span className="text-xs sm:text-sm font-black leading-none">{value}</span>
    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-80 mt-0.5">{label}</span>
  </div>
);

const AdminHeader: React.FC<AdminHeaderProps> = ({
  seccionName, setSeccionName, isEditingTitle, setIsEditingTitle,
  onOpenProfile, onSave, onShowCroquis, onShowDirectorio, participantesCount, onToggleActions, showActions,
  onCrearCajaEspecial, onCrearCaja, onCrearHorario, onDownloadTabla,
  onBack, onLogout, isSuperAdminViewing, adminInfo, stats
}) => {
  const [showStats, setShowStats] = useState(false);

  return (
    <header className="flex flex-col gap-4 bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-slate-200 mb-4 w-full">
      <div className="flex items-start justify-between gap-4 w-full">
        <div className="min-w-0 flex-1">
          {isEditingTitle && !isSuperAdminViewing ? (
            <input 
              type="text" value={seccionName} onChange={(e) => setSeccionName(e.target.value)} 
              onBlur={onSave} autoFocus
              className="text-xl sm:text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 outline-none w-full"
            />
          ) : (
            <h1 
              className={`text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 ${!isSuperAdminViewing ? 'cursor-pointer hover:text-blue-600 transition' : ''}`}
              onClick={() => !isSuperAdminViewing && setIsEditingTitle(true)}
              title={!isSuperAdminViewing ? "Clic para editar el nombre del evento" : ""}
            >
              {seccionName || 'Sin Título'}
            </h1>
          )}
          {adminInfo && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                Admin: {adminInfo.name}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                {adminInfo.org}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {onOpenProfile && (
            <button onClick={onOpenProfile} className="inline-flex items-center gap-1 px-2 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-[10px] hover:bg-slate-200 transition shadow-sm border border-slate-200">
              <Settings size={14} /> Ajustes
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="inline-flex items-center gap-1 px-2 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-[10px] hover:bg-red-100 transition shadow-sm border border-red-100">
              <LogOut size={14} /> Salir
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full">
        <button onClick={() => setShowStats(prev => !prev)} className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition">
          {showStats ? 'Ocultar métricas' : 'Mostrar métricas'}
        </button>
        {onShowCroquis && (
          <button onClick={onShowCroquis} className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition">
            <MapIcon size={14} /> Croquis
          </button>
        )}
        {onBack && (
          <button onClick={onBack} className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition">
            <ArrowLeft size={14} /> Regresar
          </button>
        )}
        {onShowDirectorio && (
          <button onClick={onShowDirectorio} className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition">
            <Users size={14} /> Participantes {participantesCount !== undefined ? `(${participantesCount})` : ''}
          </button>
        )}
        {onToggleActions && (
          <button onClick={onToggleActions} className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition">
            {showActions ? 'Ocultar acciones' : 'Ver acciones'}
          </button>
        )}
      </div>

      {/* CENTRO: Mini Estadísticas (Con el inactivo que funciona) */}
      {stats && (
        <div className={`${showStats ? 'block' : 'hidden'} sm:block w-full xl:w-auto flex justify-center py-2 border-y xl:border-y-0 xl:border-x border-slate-100 xl:px-4`}>
           <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center w-full">
             <MiniStatCard label="Cajas" value={stats.cajas} color="bg-blue-50 text-blue-700 border-blue-100" />
             <MiniStatCard label="Horarios" value={stats.horarios} color="bg-indigo-50 text-indigo-700 border-indigo-100" />
             <MiniStatCard label="Turnos" value={stats.totales} color="bg-purple-50 text-purple-700 border-purple-100" />
             <MiniStatCard label="Libres" value={stats.disponibles} color="bg-emerald-50 text-emerald-700 border-emerald-100" />
             <MiniStatCard label="Usuarios" value={stats.participantes} color="bg-amber-50 text-amber-700 border-amber-100" />
             <MiniStatCard label="Inactivos" value={stats.inactivos} color="bg-red-50 text-red-700 border-red-100" />
           </div>
        </div>
      )}

      {onToggleActions && (
        <div className={`${showActions ? 'block' : 'hidden'} bg-slate-50 p-2.5 rounded-2xl border border-slate-200 mt-3 w-full`}>
          <div className="flex flex-wrap items-center gap-2">
            {onCrearCajaEspecial && (
              <button onClick={onCrearCajaEspecial} className="flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 px-2 py-2 rounded-2xl font-bold text-[10px] transition shadow-sm border border-violet-200 min-w-[94px] justify-center">
                <Plus size={14} />
                <span>Caja Especial</span>
              </button>
            )}
            {onCrearCaja && (
              <button onClick={onCrearCaja} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-2 rounded-2xl font-bold text-[10px] transition shadow-sm border border-slate-300 min-w-[94px] justify-center">
                <Inbox size={14} />
                <span>Caja Normal</span>
              </button>
            )}
            {onCrearHorario && (
              <button onClick={onCrearHorario} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-2 rounded-2xl font-bold text-[10px] transition shadow-sm border border-emerald-200 min-w-[94px] justify-center">
                <Clock size={14} />
                <span>Horario</span>
              </button>
            )}
            {onDownloadTabla && (
              <button onClick={onDownloadTabla} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded-2xl font-bold text-[10px] transition shadow-md shadow-blue-500/20">
                <Download size={14} />
                <span>Descargar</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminHeader;
// src/components/AdminHeader.tsx
import React, { useState, useEffect } from 'react';
import { MapIcon, ArrowLeft, LogOut, Settings, Users, Plus, Inbox, Clock, Download, BarChart2, Shield, Bell } from 'lucide-react';
import SeccionCapitanes, { type CapitanData } from './SeccionCapitanes';
import type { DiaDisponible, CajaDisponible } from './ModalAsignarCapitan';

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

interface AdminPermissions {
  cajas: boolean;
  horarios: boolean;
  especiales: boolean;
}

interface AdminHeaderProps {
  seccionName: string;
  setSeccionName: (name: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (val: boolean) => void;
  onOpenProfile?: () => void;
  onSave?: () => void;
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
  onExportExcel?: () => void;
  adminPerms?: AdminPermissions;
  
  isCapitan?: boolean;
  showCapitanes?: boolean;
  onToggleCapitanes?: () => void;
  capitanes?: CapitanData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participantes?: any[];
  onOpenCapitanModal?: () => void;
  onDeleteCapitan?: (id: string) => void;
  onSimularCapitan?: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dias?: any[];
  
  diasDisponibles?: DiaDisponible[];
  cajasDisponibles?: CajaDisponible[];
  onEditCapitan?: (id: string, nombre: string, diasAsignados: string[], cajasAsignadas: string[]) => void;

  // NUEVAS PROPS DE ALERTAS
  alertasAsistencia?: { dia: string; cajaId: string; cajaNombre: string; turnoId: string; horario: string; participante: string }[];
  onResolveAlert?: (cajaId: string, turnoId: string) => void;
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
  onBack, onLogout, isSuperAdminViewing, adminInfo, stats, onExportExcel,
  adminPerms, isCapitan, 
  showCapitanes, onToggleCapitanes, capitanes, participantes, onOpenCapitanModal, onDeleteCapitan, onSimularCapitan, dias,
  diasDisponibles, cajasDisponibles, onEditCapitan,
  alertasAsistencia = [], onResolveAlert
}) => {
  const [showStats, setShowStats] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  const isSupervisorOrSuperAdmin = !!sessionStorage.getItem('visor_externo_tipo') || isSuperAdminViewing;
  const canEditTitle = isSupervisorOrSuperAdmin; 

  const handleTitleClick = () => {
    if (canEditTitle) {
      setIsEditingTitle(true);
    }
  };

  const hasAlerts = alertasAsistencia.length > 0;

  useEffect(() => {
    if (alertasAsistencia && alertasAsistencia.length > 0) {
      if ("vibrate" in navigator) {
        // Vibra 200ms, pausa 100ms, vibra 200ms
        navigator.vibrate([200, 100, 200]); 
      }
    }
  }, [alertasAsistencia.length]);

  return (
    <header className="flex flex-col gap-4 bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-slate-200 mb-4 w-full">
      <div className="flex items-start justify-between gap-4 w-full">
        <div className="min-w-0 flex-1">
          {isEditingTitle && canEditTitle ? (
            <input 
              type="text" value={seccionName} onChange={(e) => setSeccionName(e.target.value)} 
              onBlur={onSave} autoFocus
              className="text-xl sm:text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 outline-none w-full shadow-inner"
            />
          ) : (
            <h1 
              className={`text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 ${canEditTitle ? 'cursor-pointer hover:text-blue-600 transition' : ''}`}
              onClick={handleTitleClick}
              title={canEditTitle ? "Clic para editar el nombre del evento" : ""}
            >
              {seccionName || 'Sin Título'}
            </h1>
          )}
          {adminInfo && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${isCapitan ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {isCapitan ? 'Capitán:' : 'Admin:'} <span className={isCapitan ? 'text-amber-900' : 'text-slate-700'}>{adminInfo.name}</span>
              </span>
              {adminInfo.org && (
                <span className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 truncate max-w-[200px]">
                  {adminInfo.org}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2 shrink-0">
          <div className="flex gap-2 relative">
            
            {/* CAMPANA DE NOTIFICACIONES */}
            <button 
              onClick={() => setShowAlertMenu(!showAlertMenu)} 
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition shadow-sm border ${hasAlerts ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600 animate-pulse' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
            >
              <Bell size={14} className={hasAlerts ? "animate-bounce" : ""} /> 
              {hasAlerts ? `Alertas (${alertasAsistencia.length})` : 'Sin alertas'}
            </button>

            {/* MENÚ DESPLEGABLE DE ALERTAS */}
            {showAlertMenu && (
              <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-orange-100 z-[999] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="bg-orange-500 p-3 text-white flex justify-between items-center">
                  <h3 className="font-black text-sm flex items-center gap-2"><Bell size={16} /> Asistencia Solicitada</h3>
                </div>
                <div className="max-h-60 overflow-y-auto p-2 space-y-2 bg-slate-50">
                  {hasAlerts ? (
                    alertasAsistencia.map((alerta, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-orange-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                        <p className="text-xs font-black text-orange-900 ml-1">{alerta.participante}</p>
                        <p className="text-[10px] font-bold text-orange-700 ml-1 mb-2">
                          {alerta.dia} • {alerta.horario} • {alerta.cajaNombre}
                        </p>
                        <button 
                          onClick={() => { onResolveAlert?.(alerta.cajaId, alerta.turnoId); if (alertasAsistencia.length === 1) setShowAlertMenu(false); }} 
                          className="w-full py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-[10px] font-black hover:bg-orange-500 hover:text-white transition"
                        >
                          Marcar como resuelto
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-xs font-bold text-slate-400 p-4">Nadie ha solicitado ayuda.</p>
                  )}
                </div>
              </div>
            )}

            {onBack && (
              <button onClick={onBack} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white font-bold rounded-xl text-[11px] hover:bg-slate-700 transition shadow-sm border border-slate-700">
                <ArrowLeft size={14} /> Regresar
              </button>
            )}
            {onOpenProfile && (
              <button onClick={onOpenProfile} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-[11px] hover:bg-slate-200 transition shadow-sm border border-slate-200">
                <Settings size={14} /> Ajustes
              </button>
            )}
          </div>
          {onLogout && (
            <button onClick={onLogout} className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-[11px] hover:bg-red-100 transition shadow-sm border border-red-100">
              <LogOut size={14} /> Salir
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 w-full border-t border-slate-100 pt-3">
        <div className="flex flex-wrap gap-2">
          {onShowCroquis && (
            <button onClick={onShowCroquis} className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition shadow-sm">
              <MapIcon size={14} /> Croquis
            </button>
          )}
          {onShowDirectorio && (
            <button onClick={onShowDirectorio} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition shadow-sm">
              <Users size={14} /> Participantes {participantesCount !== undefined ? `(${participantesCount})` : ''}
            </button>
          )}
          
          {!isCapitan && onToggleCapitanes && (
             <button onClick={onToggleCapitanes} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition shadow-sm ${showCapitanes ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700' : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300'}`}>
               <Shield size={14} /> {showCapitanes ? 'Cerrar Capitanes' : 'Capitanes'} {capitanes && capitanes.length > 0 ? `(${capitanes.length})` : ''}
             </button>
          )}

          <button onClick={() => setShowStats(prev => !prev)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition shadow-sm">
            <BarChart2 size={14} /> {showStats ? 'Ocultar' : 'Métricas'}
          </button>
          {onToggleActions && (
            <button onClick={onToggleActions} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition shadow-sm ${showActions ? 'bg-slate-800 border-slate-800 text-white hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
              {showActions ? 'Cerrar acciones' : 'Ver acciones'}
            </button>
          )}
        </div>

        {stats && (
          <div className={`${showStats ? 'flex' : 'hidden'} sm:flex w-full xl:w-auto justify-center xl:border-l border-slate-100 xl:pl-4`}>
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
      </div>

      {showCapitanes && capitanes && onOpenCapitanModal && onDeleteCapitan && onSimularCapitan && (
        <div className="mt-2 w-full">
          <SeccionCapitanes 
             capitanes={capitanes}
             participantes={participantes} 
             onOpenModal={onOpenCapitanModal}
             onDeleteCapitan={onDeleteCapitan}
             onSimularCapitan={onSimularCapitan}
             isOpen={true} 
             dias={dias || []}
             diasDisponibles={diasDisponibles || []}
             cajasDisponibles={cajasDisponibles || []}
             onEditCapitan={onEditCapitan!}
          />
        </div>
      )}

      {onToggleActions && (
        <div className={`${showActions ? 'block' : 'hidden'} bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-2 w-full animate-in slide-in-from-top-2 duration-200`}>
          <div className="flex flex-wrap items-center gap-2">
            {adminPerms?.especiales !== false && onCrearCajaEspecial && (
              <button onClick={onCrearCajaEspecial} className="flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-2 rounded-xl font-bold text-[11px] transition shadow-sm border border-violet-200 min-w-[100px] justify-center">
                <Plus size={14} />Crear Caja Especial
              </button>
            )}
            {adminPerms?.cajas !== false && onCrearCaja && (
              <button onClick={onCrearCaja} className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl font-bold text-[11px] transition shadow-sm border border-slate-300 min-w-[100px] justify-center">
                <Inbox size={14} />Crear Caja Normal
              </button>
            )}
            {adminPerms?.horarios !== false && onCrearHorario && (
              <button onClick={onCrearHorario} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl font-bold text-[11px] transition shadow-sm border border-emerald-200 min-w-[100px] justify-center">
                <Clock size={14} />Crear Horario
              </button>
            )}
            <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
            {onDownloadTabla && (
              <button onClick={onDownloadTabla} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl font-bold text-[11px] transition shadow-md shadow-blue-500/20">
                <Download size={14} /> PNG
              </button>
            )}
            {onExportExcel && (
              <button onClick={onExportExcel} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-bold text-[11px] transition shadow-md shadow-emerald-500/20">
                <Download size={14} /> Excel
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminHeader;
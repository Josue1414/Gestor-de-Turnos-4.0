// src/components/AdminHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MapIcon, ArrowLeft, Settings, Users, Plus, Inbox, Clock, Download, BarChart2, Shield, Bell, Smartphone, CheckCircle2, AlertTriangle, LifeBuoy } from 'lucide-react';
import SeccionCapitanes, { type CapitanData } from './SeccionCapitanes';
import type { DiaDisponible, CajaDisponible } from './ModalAsignarCapitan';
import InstallGuideModal from './InstallGuideModal'; 

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
  isSuperAdminViewing?: boolean;
  adminInfo?: AdminInfo | null;
  stats?: StatsData;
  cajasDiaActivo?: number;
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

  alertasAsistencia?: { dia: string; cajaId: string; cajaNombre: string; turnoId: string; horario: string; participante: string; tipo?: 'asistencia' | 'peligro' }[];
  onResolveAlert?: (cajaId: string, turnoId: string) => void;
  pushEnabled?: boolean;
  onTogglePush?: () => void;
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
  onBack, isSuperAdminViewing, adminInfo, stats, cajasDiaActivo, onExportExcel,
  adminPerms, isCapitan, 
  showCapitanes, onToggleCapitanes, capitanes, participantes, onOpenCapitanModal, onDeleteCapitan, onSimularCapitan, dias,
  diasDisponibles, cajasDisponibles, onEditCapitan,
  alertasAsistencia = [], onResolveAlert,
  pushEnabled, onTogglePush
}) => {
  const [showStats, setShowStats] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  const isSupervisorOrSuperAdmin = !!sessionStorage.getItem('visor_externo_tipo') || isSuperAdminViewing;
  const canEditTitle = isSupervisorOrSuperAdmin; 

  const handleTitleClick = () => {
    if (canEditTitle) {
      setIsEditingTitle(true);
    }
  };

  const hasAlerts = alertasAsistencia.length > 0;
  // VERIFICAMOS SI HAY ALGUNA ALERTA DE PELIGRO
  const hasPeligro = alertasAsistencia.some(a => a.tipo === 'peligro');
  
  const bellButtonClass = hasPeligro ? 'bg-red-600 hover:bg-red-700 text-white border-red-700 animate-pulse' : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600 animate-pulse';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAlertMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (alertasAsistencia && alertasAsistencia.length > 0) {
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]); 
      }
    }
  }, [alertasAsistencia.length]);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window.navigator as any).standalone === true) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (deferredPrompt as any).prompt();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { outcome } = await (deferredPrompt as any).userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  return (
    <>
      <header className="flex flex-col gap-4 bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-slate-200 mb-4 w-full relative z-[100]">
        
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 w-full">
          
          <div className="w-full sm:w-auto flex-1 min-w-0 flex flex-col">
            
            <div className="flex justify-between items-start w-full">
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
              </div>

              <div className="flex sm:hidden gap-2 shrink-0 ml-2 mt-1">
                 {onBack && (
                   <button onClick={onBack} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white font-bold rounded-xl text-[11px] hover:bg-slate-700 transition shadow-sm border border-slate-700">
                     <ArrowLeft size={14} />
                   </button>
                 )}
                 {onOpenProfile && (
                   <button onClick={onOpenProfile} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-[11px] hover:bg-slate-200 transition shadow-sm border border-slate-200">
                     <Settings size={14} /> Ajustes
                   </button>
                 )}
              </div>
            </div>

            {adminInfo && (
              <div className="mt-2 sm:mt-1 flex flex-wrap items-center gap-2">
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-end gap-3 sm:gap-2 shrink-0 w-full sm:w-auto">
            
            <div className="flex flex-wrap gap-2 relative w-full sm:w-auto justify-start sm:justify-end" ref={menuRef}>
              
              {isAppInstalled ? (
                <div 
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 cursor-default"
                  title="App ya instalada en este dispositivo"
                >
                  <CheckCircle2 size={14} /> Instalada
                </div>
              ) : (
                <button 
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition shadow-sm border bg-slate-800 text-white border-slate-800 hover:bg-slate-700"
                  title="Instalar aplicación en tu dispositivo"
                >
                  <Smartphone size={14} /> Instalar App
                </button>
              )}

              {onTogglePush && (
                <button 
                  onClick={onTogglePush} 
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition shadow-sm border ${pushEnabled ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
                  title="Recibir notificaciones cuando la app esté minimizada"
                >
                  <Bell size={14} /> {pushEnabled ? 'Notificaciones Activas' : 'Activar Notificaciones'}
                </button>
              )}

              <button 
                onClick={() => setShowAlertMenu(!showAlertMenu)} 
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition shadow-sm border ${hasAlerts ? bellButtonClass : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
              >
                <Bell size={14} className={hasAlerts ? "animate-bounce" : ""} /> 
                {hasAlerts ? ` (${alertasAsistencia.length})` : ''}
              </button>

              {/* MENÚ DESPLEGABLE DE ALERTAS */}
              {showAlertMenu && (
                <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[999] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className={`${hasPeligro ? 'bg-red-600' : 'bg-blue-500'} p-3 text-white flex justify-between items-center`}>
                    <h3 className="font-black text-sm flex items-center gap-2"><Bell size={16} /> Alertas Activas</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-2 bg-slate-50">
                    {hasAlerts ? (
                      alertasAsistencia.map((alerta, i) => (
                        <div key={i} className={`bg-white p-3 rounded-xl border shadow-sm relative overflow-hidden ${alerta.tipo === 'peligro' ? 'border-red-200' : 'border-blue-200'}`}>
                          <div className={`absolute top-0 left-0 w-1 h-full ${alerta.tipo === 'peligro' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                          <p className={`text-xs font-black ml-1 flex items-center gap-1 ${alerta.tipo === 'peligro' ? 'text-red-700' : 'text-blue-700'}`}>
                            {alerta.tipo === 'peligro' ? <AlertTriangle size={14} /> : <LifeBuoy size={14} />}
                            {alerta.participante}
                          </p>
                          <p className={`text-[10px] font-bold ml-1 mb-2 ${alerta.tipo === 'peligro' ? 'text-red-600' : 'text-blue-600'}`}>
                            {alerta.dia} • {alerta.horario} • {alerta.cajaNombre}
                          </p>
                          <button 
                            onClick={() => { onResolveAlert?.(alerta.cajaId, alerta.turnoId); if (alertasAsistencia.length === 1) setShowAlertMenu(false); }} 
                            className={`w-full py-2 text-[10px] font-black border rounded-lg transition ${alerta.tipo === 'peligro' ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-500 hover:text-white' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-500 hover:text-white'}`}
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
            </div>

            <div className="hidden sm:flex gap-2 shrink-0">
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
                 <MiniStatCard label="Cajas (Gral)" value={stats.cajas} color="bg-blue-50 text-blue-700 border-blue-100" />
                 <MiniStatCard label="Cajas (Hoy)" value={cajasDiaActivo || 0} color="bg-cyan-50 text-cyan-700 border-cyan-100" />
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

      <InstallGuideModal 
        isOpen={showInstallGuide} 
        onClose={() => setShowInstallGuide(false)} 
      />
    </>
  );
};

export default AdminHeader;
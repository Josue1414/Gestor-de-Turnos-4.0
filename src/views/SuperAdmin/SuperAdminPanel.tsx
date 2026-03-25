import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Plus, Settings, Edit2,
  Map as MapIcon, Key, Calendar, Eye, 
  DatabaseZap, Trash2, Download, UploadCloud,
  ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp, LogOut
} from 'lucide-react';

// IMPORTAMOS LAS INTERFACES DIRECTAMENTE DESDE EL HOOK PARA QUE SEAN 100% IDÉNTICAS
import { useSuperAdminLogic, type EventoData, type AdminData } from '../../hooks/useSuperAdminLogic';

import CroquisModal from '../../components/CroquisModal';
import ModalInfoUsuario from '../../components/ModalInfoUsuario';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import BaseStructureModal from '../../components/BaseStructureModal';
import CountdownDeleteModal from '../../components/CountdownDeleteModal';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EventoData) => void;
  initialData: EventoData | null;
  onOpenStructure: () => void;
  onOpenCroquis: () => void;
}

const EditEventModal = ({ isOpen, onClose, onSave, initialData, onOpenStructure, onOpenCroquis }: EditEventModalProps) => {
  const [formData, setFormData] = useState({
    nombre: '',
    passwordGeneral: '',
    metodoGuardado: 'Firebase'
  });

  useEffect(() => {
    if (initialData && isOpen) {
      const timer = setTimeout(() => {
        setFormData({
          nombre: initialData.nombre || '',
          passwordGeneral: initialData.passwordGeneral || '',
          metodoGuardado: initialData.metodoGuardado || 'Firebase'
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return alert("El nombre es obligatorio.");
    if (initialData) {
      onSave({ ...initialData, ...formData });
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      
      <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border-2 border-slate-100 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg uppercase tracking-tight">
              <Edit2 className="text-slate-500" size={20} /> Editar Detalles del Evento
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Actualiza configuraciones, contraseñas, estructura y croquis.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Nombre del Evento</label>
              <input type="text" placeholder="Ej. Convención Anime" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-400 outline-none font-bold text-sm text-slate-700 shadow-inner" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Contraseña General (Master)</label>
                  <div className="relative">
                    <input type="text" placeholder="Clave para todos" value={formData.passwordGeneral} onChange={(e) => setFormData({...formData, passwordGeneral: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-400 outline-none font-bold text-sm text-slate-700 shadow-inner" />
                    <Key size={18} className="absolute right-3 top-3.5 text-amber-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Método de Guardado</label>
                  <select value={formData.metodoGuardado} onChange={(e) => setFormData({...formData, metodoGuardado: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-400 outline-none font-bold text-sm text-slate-700 shadow-inner cursor-pointer">
                    <option>Firebase</option>
                    <option>Google Sheets</option>
                    <option>Ambos</option>
                  </select>
                </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <DatabaseZap size={14} className="text-indigo-500"/> Estructura y Mapa del Evento
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button type="button" onClick={onOpenStructure} className="w-full p-3 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm">
                  <Calendar size={18} className="text-blue-500" /> Editar Días/Horarios/Cajas
                </button>
                <button type="button" onClick={onOpenCroquis} className="w-full p-3 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm">
                  <MapIcon size={18} className="text-indigo-500" /> Ver/Subir Croquis
                </button>
              </div>
            </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition text-sm">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2.5 rounded-xl font-black text-white bg-slate-800 hover:bg-slate-900 shadow-md transition flex items-center gap-2 text-sm">
              <Edit2 size={16} /> Guardar Cambios
            </button>
        </div>
      </form>
    </div>
  );
};

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

const AdminFiche = ({ data, stats, onOpenSettings, onDownload, onView, onDelete }: AdminFicheProps) => (
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

interface EventoSectionProps {
  evento: EventoData;
  isDefaultExpanded: boolean;
  onDeleteEvent: (id: string, name: string) => void;
  onOpenSettings: (data: AdminData) => void;
  onDownload: (id: string) => void;
  onView: (id: string) => void;
  onDeleteAdmin: (eventoId: string, adminId: string, adminName: string) => void;
  onAddAdmin: (eventoId: string) => void;
  onEditEvent: (evento: EventoData) => void;
}

const EventoSection = ({ 
  evento, isDefaultExpanded, onDeleteEvent, onOpenSettings, 
  onDownload, onView, onDeleteAdmin, onAddAdmin, onEditEvent
}: EventoSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(isDefaultExpanded);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8; 

  const totalPages = Math.max(1, Math.ceil(evento.admins.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const currentItems = evento.admins.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <section className="bg-white border-2 border-slate-300 shadow-sm rounded-2xl flex flex-col overflow-hidden transition-all duration-300">
      
      <div className="bg-slate-800 p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-700">
        
        <div className="flex items-center gap-3 flex-1 cursor-pointer group w-full lg:w-auto" onClick={() => setIsExpanded(!isExpanded)}>
          <button className="text-slate-400 group-hover:text-white transition bg-slate-700/50 p-1.5 rounded-lg">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-700 rounded-xl flex items-center justify-center text-blue-400 border border-slate-600 shrink-0">
            <ShieldCheck size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight truncate group-hover:text-blue-300 transition">
                  {evento.nombre}
                </h2>
                <button onClick={(e) => { e.stopPropagation(); onAddAdmin(evento.id); }} className="bg-blue-600 hover:bg-blue-500 text-white p-2 px-3 rounded-lg transition shadow-md border border-blue-500 flex items-center gap-1.5 text-xs font-bold shrink-0">
                    <Plus size={14} /> Añadir Admin
                </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-1 sm:mt-2">
              <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-600">Admins: {evento.admins.length}</span>
              <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-600 hidden sm:inline-block">Guardado: {evento.metodoGuardado}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 w-full lg:w-auto justify-end mt-3 lg:mt-0 pt-3 lg:pt-0 border-t border-slate-700 lg:border-none">
            <button onClick={() => onEditEvent(evento)} className="bg-slate-700 hover:bg-slate-600 text-white p-2 sm:px-3 rounded-lg transition shadow-sm border border-slate-600 flex items-center gap-1 text-xs font-bold" title="Editar Detalles del Evento">
              <Edit2 size={14} /> <span className="hidden sm:block">Editar</span>
            </button>
            <button onClick={() => onDeleteEvent(evento.id, evento.nombre)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 sm:px-3 rounded-lg transition border border-red-500/30 flex items-center gap-1 text-xs font-bold">
              <Trash2 size={14} /> <span className="hidden sm:block">Borrar</span>
            </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-slate-50/50 flex flex-col min-h-[220px] animate-in slide-in-from-top-2 duration-200">
          {evento.admins.length > 0 ? (
              <div className="flex flex-wrap gap-4 flex-1 items-start">
              {currentItems.map((item: AdminData) => {
                  
                  const adminDias = evento.diasPorAdmin?.[item.id] || [];
                  const adminParticipantes = evento.participantesPorAdmin?.[item.id] || [];

                  let calcTotales = 0;
                  let calcDisponibles = 0;
                  const calcCajas = adminDias[0]?.cajas?.length || 0;
                  const calcHorarios = adminDias[0]?.horariosMaestros?.length || 0;
                  const calcParticipantesLength = adminParticipantes.length;

                  adminDias.forEach((dia) => {
                    dia.cajas?.forEach((caja) => {
                      calcTotales += caja.turnos?.length || 0;
                      calcDisponibles += caja.turnos?.filter(t => t.participanteId === null || t.participanteId === '').length || 0;
                    });
                  });

                  const dynamicStats = {
                    cajas: calcCajas,
                    horarios: calcHorarios,
                    totales: calcTotales,
                    disponibles: calcDisponibles,
                    participantes: calcParticipantesLength
                  };

                  return (
                    <AdminFiche 
                        key={item.id} 
                        data={item} 
                        stats={dynamicStats}
                        onOpenSettings={onOpenSettings}
                        onDownload={onDownload}
                        onView={onView} 
                        onDelete={(adminId: string, adminName: string) => onDeleteAdmin(evento.id, adminId, adminName)} 
                    />
                  );
              })}
              </div>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[150px] w-full border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                  <ShieldCheck size={48} className="mb-2 text-slate-300"/>
                  <p className="font-bold text-sm">Este evento no tiene administradores todavía.</p>
                  <p className="text-xs text-slate-500 mt-1">Usa el botón "Añadir Admin" en el encabezado.</p>
              </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center gap-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm flex items-center gap-1">
                <ChevronLeft size={16} /> <span className="text-sm font-bold hidden sm:block">Anterior</span>
              </button>
              <div className="flex gap-1.5 items-center">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-black transition ${safePage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm flex items-center gap-1">
                 <span className="text-sm font-bold hidden sm:block">Siguiente</span> <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const SuperAdminPanel = () => {
  const navigate = useNavigate();

  const {
    eventos, showNewEvent, setShowNewEvent,
    nuevoEventoForm, setNuevoEventoForm, handleCrearEvento,
    croquisModalState, setCroquisModalState,
    infoUsuarioState, setInfoUsuarioState,
    downloadModalState, setDownloadModalState,
    handleOpenAjustesAdmin, handleGuardarAjustesAdmin,
    baseStructureModalState, setBaseStructureModalState,
    estructuraGuardada, setEstructuraGuardada,
    deleteModalState, setDeleteModalState, handleConfirmDelete,
    handleAddAdmin,
    editEventModalState, setEditEventModalState, handleSaveEditEvent
  } = useSuperAdminLogic();

  const handleVerAdmin = (eventoId: string, adminId: string) => {
    localStorage.setItem('current_admin_id', adminId);
    navigate(`/admin/${eventoId}`, { state: { openedBySuperAdmin: true } }); 
  };

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    navigate('/');
  };

  const modalUsuarioMapeado = infoUsuarioState.data ? {
    id: infoUsuarioState.data.id,
    name: infoUsuarioState.data.name,
    role: 'Administrador' as const,
    phone: '',
    supportArea: infoUsuarioState.data.area,
    notes: '',
    organization: infoUsuarioState.data.org
  } : null;

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-6 font-sans flex flex-col gap-6">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-lg border-b-4 border-blue-500 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-blue-400 border border-slate-700">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase">SuperUsuario</h1>
            <p className="text-slate-400 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Panel de Control Global</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-none border-slate-700">
            <button 
              onClick={() => setShowNewEvent(!showNewEvent)}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black flex items-center justify-center gap-2 transition shadow-md border-2 ${showNewEvent ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700' : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'}`}
            >
              <Plus size={18} className={showNewEvent ? 'rotate-45 transition-transform' : 'transition-transform'} /> 
              {showNewEvent ? "CERRAR PANEL" : "CREAR EVENTO"}
            </button>
            
            <button 
              onClick={handleLogout}
              className="px-3.5 py-2.5 bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white rounded-xl transition shadow-md border border-slate-600"
              title="Cerrar Sesión Master"
            >
              <LogOut size={18} />
            </button>
        </div>
      </header>

      {showNewEvent && (
        <div className="bg-white rounded-2xl border-2 border-blue-400 shadow-xl p-5 sm:p-6 animate-in slide-in-from-top duration-300 shrink-0">
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            Configuración de Nuevo Evento
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Nombre del Evento</label>
              <input type="text" placeholder="Ej. Convención Anime" value={nuevoEventoForm.nombre} onChange={(e) => setNuevoEventoForm({...nuevoEventoForm, nombre: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-400 outline-none font-bold text-sm text-slate-700" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Contraseña General (Opc.)</label>
              <input type="text" placeholder="Clave para todos" value={nuevoEventoForm.passwordGeneral} onChange={(e) => setNuevoEventoForm({...nuevoEventoForm, passwordGeneral: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-400 outline-none font-bold text-sm text-slate-700" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Método de Guardado</label>
              <select value={nuevoEventoForm.metodoGuardado} onChange={(e) => setNuevoEventoForm({...nuevoEventoForm, metodoGuardado: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-400 outline-none font-bold text-sm text-slate-700">
                <option>Firebase (Recomendado)</option>
                <option>Google Sheets</option>
                <option>Ambos</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Admins Iniciales (Opc.)</label>
              <input type="number" min="0" placeholder="0" value={nuevoEventoForm.numAdmins} onChange={(e) => setNuevoEventoForm({...nuevoEventoForm, numAdmins: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-400 outline-none font-bold text-sm text-slate-700" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Estructura Base (Opc.)</label>
              <button onClick={() => setBaseStructureModalState(true)} className={`w-full p-2.5 border rounded-lg outline-none font-bold text-xs flex items-center justify-center gap-2 transition ${estructuraGuardada ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700'}`}>
                <Calendar size={16} /> {estructuraGuardada ? 'Estructura Lista ✓' : 'Crear Días/Cajas'}
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Croquis Base (Opc.)</label>
              <button onClick={() => setCroquisModalState(true)} className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 rounded-lg outline-none font-bold text-xs flex items-center justify-center gap-2 transition">
                <UploadCloud size={16} /> Agregar Croquis
              </button>
            </div>
            
            <div className="space-y-1.5 md:col-span-2 flex items-end">
              <button onClick={handleCrearEvento} className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-black hover:bg-blue-700 transition shadow-sm text-sm h-[42px]">
                CREAR EVENTO
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 flex-1 overflow-y-auto pb-10">
        {eventos.map((evento: EventoData, index: number) => (
          <EventoSection 
            key={evento.id} 
            evento={evento}
            isDefaultExpanded={index === 0} 
            onDeleteEvent={(id: string, name: string) => setDeleteModalState({ isOpen: true, type: 'evento', eventoId: id, targetId: id, targetName: name })}
            onOpenSettings={handleOpenAjustesAdmin}
            onDownload={(id: string) => setDownloadModalState({ isOpen: true, adminId: id })}
            onView={(adminId: string) => handleVerAdmin(evento.id, adminId)}
            onDeleteAdmin={(eventoId: string, adminId: string, adminName: string) => setDeleteModalState({ isOpen: true, type: 'admin', eventoId, targetId: adminId, targetName: adminName })}
            onAddAdmin={handleAddAdmin}
            onEditEvent={(eventData: EventoData) => setEditEventModalState({ isOpen: true, eventData })}
          />
        ))}
      </div>

      <CroquisModal isOpen={croquisModalState} onClose={() => setCroquisModalState(false)} isAdmin={true} />
      
      {modalUsuarioMapeado && (
        <ModalInfoUsuario 
          isOpen={infoUsuarioState.isOpen} 
          onClose={() => setInfoUsuarioState({ isOpen: false, data: null })} 
          data={modalUsuarioMapeado} 
          isViewingSelf={false} 
          currentUserRole="Administrador" 
          onSave={handleGuardarAjustesAdmin} 
          checkNameExists={() => false} 
        />
      )}
      
      <DownloadScheduleModal isOpen={downloadModalState.isOpen} onClose={() => setDownloadModalState({ isOpen: false })} type="general" seccionName="Tabla de Turnos" dias={[]} diaActivo={0} participantes={[]} />
      
      <BaseStructureModal 
        isOpen={baseStructureModalState} 
        onClose={() => setBaseStructureModalState(false)} 
        onSave={(estructura) => setEstructuraGuardada(estructura)} 
      />
      
      <CountdownDeleteModal 
        isOpen={deleteModalState.isOpen} 
        onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })} 
        onConfirm={handleConfirmDelete} 
        title={deleteModalState.targetName} 
        message={deleteModalState.type === 'evento' 
          ? 'Todos los administradores y sus turnos se perderán.' 
          : 'El administrador perderá su acceso y sus turnos quedarán huérfanos.'}
      />

      <EditEventModal 
        isOpen={editEventModalState.isOpen} 
        initialData={editEventModalState.eventData} 
        onClose={() => setEditEventModalState({ isOpen: false, eventData: null })} 
        onSave={handleSaveEditEvent} 
        onOpenStructure={() => {
            setEditEventModalState({ isOpen: false, eventData: null });
            setBaseStructureModalState(true);
        }}
        onOpenCroquis={() => {
            setEditEventModalState({ isOpen: false, eventData: null });
            setCroquisModalState(true);
        }}
      />

    </div>
  );
};

export default SuperAdminPanel;
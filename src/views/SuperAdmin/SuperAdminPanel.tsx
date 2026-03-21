import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Plus, Settings, Edit2,
  Map as MapIcon, Key, Calendar, Eye, Lock, 
  DatabaseZap, Trash2, Download, Link, UploadCloud,
  ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp
} from 'lucide-react';

import { useSuperAdminLogic } from '../../hooks/useSuperAdminLogic';
import CroquisModal from '../../components/CroquisModal';
import ModalInfoUsuario from '../../components/ModalInfoUsuario';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import BaseStructureModal from '../../components/BaseStructureModal';
import CountdownDeleteModal from '../../components/CountdownDeleteModal';

// --- MODAL PARA EDITAR EL EVENTO ---
const EditEventModal = ({ isOpen, onClose, onSave, initialData, onOpenStructure, onOpenCroquis }: any) => {
  const [formData, setFormData] = useState({
    nombre: '',
    passwordGeneral: '',
    metodoGuardado: 'Firebase'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        passwordGeneral: initialData.passwordGeneral || '',
        metodoGuardado: initialData.metodoGuardado || 'Firebase'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return alert("El nombre es obligatorio.");
    onSave({ ...initialData, ...formData });
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
  <div className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 text-center flex flex-col justify-center">
    <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 tracking-wider leading-tight">{label}</span>
    <span className={`text-sm font-black ${colorClass} leading-none mt-0.5`}>{value}</span>
  </div>
);

const AdminFiche = ({ data, onOpenSettings, onDownload, onView, onDelete }: any) => (
  <div className="w-full sm:w-[280px] bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all rounded-xl flex flex-col overflow-hidden">
    <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
      <div className="pr-2 w-full overflow-hidden">
        <h4 className="font-black text-slate-800 leading-tight text-sm truncate">{data.name}</h4>
        <p className="text-[10px] text-blue-600 font-bold uppercase truncate">{data.area}</p>
        <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{data.org}</p>
      </div>
      
      <div className="flex flex-col gap-1.5 shrink-0 ml-2">
        <button onClick={() => onView(data.id)} className="w-full p-1.5 bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-blue-50 hover:text-blue-600 transition shadow-sm flex items-center justify-center gap-1 text-[10px] font-bold">
          <Eye size={12} /> Ver
        </button>
        <div className="flex gap-1.5">
          <button onClick={() => onOpenSettings(data)} className="p-1.5 bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-slate-100 hover:text-slate-800 transition shadow-sm flex items-center justify-center">
            <Settings size={12} />
          </button>
          <button onClick={() => onDelete(data.id, data.name)} className="p-1.5 bg-red-50 border border-red-100 text-red-500 rounded-md hover:bg-red-100 transition shadow-sm flex items-center justify-center" title="Eliminar Admin">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>

    <div className="p-3 grid grid-cols-2 gap-2 bg-white">
      <StatBadge label="Cajas" value={data.cajas} colorClass="text-slate-700" />
      <StatBadge label="Total Horarios" value={data.horarios} colorClass="text-slate-700" />
      <StatBadge label="Turnos Totales" value={data.turnosTotales} colorClass="text-indigo-600" />
      <StatBadge label="Turnos Disp." value={data.disponibles} colorClass="text-emerald-500" />
      <StatBadge label="Participantes" value={data.necesarios} colorClass="text-slate-700" />
      <StatBadge label="Part. Inactivos" value={data.inactivos} colorClass="text-red-500" />
    </div>

    <div className="px-3 pb-3 flex gap-2">
      <button onClick={() => onDownload(data.id)} className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 p-2 rounded-lg flex items-center justify-center gap-1.5 transition text-[10px] font-bold uppercase shadow-sm">
        <Download size={14} className="text-blue-500" /> Tabla
      </button>
      <button className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 p-2 rounded-lg flex items-center justify-center gap-1.5 transition text-[10px] font-bold uppercase shadow-sm">
        <Link size={14} className="text-indigo-500" /> Link
      </button>
    </div>

    <div className="mt-auto p-2 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-200">
        <Key size={12} className="text-amber-500" />
        <span className="text-[10px] font-mono font-bold text-slate-600">{data.password}</span>
      </div>
      <button className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase px-2 py-1 hover:bg-blue-50 rounded transition">
        Editar Clave
      </button>
    </div>
  </div>
);

const EventoSection = ({ 
  evento, 
  isDefaultExpanded, 
  onDeleteEvent, 
  onOpenSettings, 
  onDownload, 
  onView, 
  onDeleteAdmin,
  onAddAdmin,
  onEditEvent
}: any) => {
  const [isExpanded, setIsExpanded] = useState(isDefaultExpanded);
  
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8; 

  const totalPages = Math.ceil(evento.admins.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentItems = evento.admins.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <section className="bg-white border-2 border-slate-300 shadow-sm rounded-2xl flex flex-col overflow-hidden transition-all duration-300">
      
      {/* HEADER DEL EVENTO */}
      <div className="bg-slate-800 p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-700">
        
        {/* Zona Izquierda: Clickeable para abrir/cerrar */}
        <div 
          className="flex items-center gap-3 flex-1 cursor-pointer group w-full lg:w-auto"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <button className="text-slate-400 group-hover:text-white transition bg-slate-700/50 p-1.5 rounded-lg">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-700 rounded-xl flex items-center justify-center text-blue-400 border border-slate-600 shrink-0">
            <ShieldCheck size={24} />
          </div>
          
          {/* Nombre del Evento y Botón Añadir (Reubicado aquí) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight truncate group-hover:text-blue-300 transition">
                  {evento.nombre}
                </h2>
                {/* <-- BOTÓN AÑADIR ADMIN: Reubicado al lado del nombre (evitando el clic del acordeón con preventPropagation) */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); // <-- Detenemos el clic del acordeón
                        onAddAdmin(evento.id);
                    }} 
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 px-3 rounded-lg transition shadow-md border border-blue-500 flex items-center gap-1.5 text-xs font-bold shrink-0"
                >
                    <Plus size={14} /> Añadir Admin
                </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-1 sm:mt-2">
              <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-600">Admins: {evento.admins.length}</span>
              <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-600 hidden sm:inline-block">Guardado: {evento.metodoGuardado}</span>
            </div>
          </div>
        </div>

        {/* Zona Derecha: Botones de Acción Global (Solo Editar y Borrar) */}
        <div className="flex gap-2 shrink-0 w-full lg:w-auto justify-end mt-3 lg:mt-0 pt-3 lg:pt-0 border-t border-slate-700 lg:border-none">
            <button onClick={() => onEditEvent(evento)} className="bg-slate-700 hover:bg-slate-600 text-white p-2 sm:px-3 rounded-lg transition shadow-sm border border-slate-600 flex items-center gap-1 text-xs font-bold" title="Editar Detalles del Evento">
              <Edit2 size={14} /> <span className="hidden sm:block">Editar</span>
            </button>
            <button onClick={() => onDeleteEvent(evento.id, evento.nombre)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 sm:px-3 rounded-lg transition border border-red-500/30 flex items-center gap-1 text-xs font-bold">
              <Trash2 size={14} /> <span className="hidden sm:block">Borrar</span>
            </button>
        </div>
      </div>

      {/* CONTENIDO DEL EVENTO (ACORDEÓN) */}
      {isExpanded && (
        <div className="p-4 bg-slate-50/50 flex flex-col min-h-[220px] animate-in slide-in-from-top-2 duration-200">
          {evento.admins.length > 0 ? (
              <div className="flex flex-wrap gap-4 flex-1 items-start">
              {currentItems.map((item: any) => (
                  <AdminFiche 
                      key={item.id} 
                      data={item} 
                      onOpenSettings={onOpenSettings}
                      onDownload={onDownload}
                      onView={onView} 
                      onDelete={(adminId: string, adminName: string) => onDeleteAdmin(evento.id, adminId, adminName)} 
                  />
              ))}
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm flex items-center gap-1">
                <ChevronLeft size={16} /> <span className="text-sm font-bold hidden sm:block">Anterior</span>
              </button>
              <div className="flex gap-1.5 items-center">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-black transition ${page === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm flex items-center gap-1">
                 <span className="text-sm font-bold hidden sm:block">Siguiente</span> <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

// --- PANEL PRINCIPAL ---
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

  const handleVerAdmin = (adminId: string) => {
    navigate(`/admin/${adminId}`); 
  };

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
        <button 
          onClick={() => setShowNewEvent(!showNewEvent)}
          className={`px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition shadow-md border-2 ${showNewEvent ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700' : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'}`}
        >
          <Plus size={18} className={showNewEvent ? 'rotate-45 transition-transform' : 'transition-transform'} /> 
          {showNewEvent ? "CERRAR PANEL" : "CREAR EVENTO"}
        </button>
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
        {eventos.map((evento: any, index: number) => (
          <EventoSection 
            key={evento.id} 
            evento={evento}
            isDefaultExpanded={index === 0} 
            onDeleteEvent={(id: string, name: string) => setDeleteModalState({ isOpen: true, type: 'evento', eventoId: id, targetId: id, targetName: name })}
            onOpenSettings={handleOpenAjustesAdmin}
            onDownload={(id: string) => setDownloadModalState({ isOpen: true, adminId: id })}
            onView={handleVerAdmin}
            onDeleteAdmin={(eventoId: string, adminId: string, adminName: string) => setDeleteModalState({ isOpen: true, type: 'admin', eventoId, targetId: adminId, targetName: adminName })}
            onAddAdmin={handleAddAdmin}
            onEditEvent={(eventData: any) => setEditEventModalState({ isOpen: true, eventData })}
          />
        ))}
      </div>

      {/* MODALES EXTERNOS */}
      <CroquisModal isOpen={croquisModalState} onClose={() => setCroquisModalState(false)} isAdmin={true} />
      <ModalInfoUsuario isOpen={infoUsuarioState.isOpen} onClose={() => setInfoUsuarioState({ isOpen: false, data: null })} data={infoUsuarioState.data} isViewingSelf={false} currentUserRole="Administrador" onSave={handleGuardarAjustesAdmin} checkNameExists={() => false} />
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
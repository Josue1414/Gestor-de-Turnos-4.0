import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Plus, Calendar, UploadCloud, LogOut
} from 'lucide-react';

import { useSuperAdminLogic, type EventoData, type AdminData } from '../../hooks/useSuperAdminLogic';

// NUEVOS COMPONENTES IMPORTADOS
import EditEventModal from '../../components/EditEventModal';
import EventoSection from '../../components/EventoSection';
import AdminSettingsFlow from '../../components/AdminSettingsFlow'; // <-- EL NUEVO COMPONENTE

// COMPONENTES EXISTENTES
import CroquisModal from '../../components/CroquisModal';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import BaseStructureModal from '../../components/BaseStructureModal';
import CountdownDeleteModal from '../../components/CountdownDeleteModal';

const SuperAdminPanel = () => {
  const navigate = useNavigate();

  // PROTECCIÓN DE RUTA: Expulsa a cualquiera que no sea SuperAdmin
  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'superadmin') {
      navigate('/'); 
    }
  }, [navigate]);

  const {
    eventos, showNewEvent, setShowNewEvent,
    nuevoEventoForm, setNuevoEventoForm, handleCrearEvento,
    croquisModalState, setCroquisModalState,
    downloadModalState, setDownloadModalState,
    handleGuardarAjustesAdmin, handleUpdateAdminAccess,
    baseStructureModalState, setBaseStructureModalState,
    estructuraGuardada, setEstructuraGuardada,
    deleteModalState, setDeleteModalState, handleConfirmDelete,
    handleAddAdmin,
    editEventModalState, setEditEventModalState, handleSaveEditEvent
  } = useSuperAdminLogic();

  // ESTADO COMPACTO: Maneja todo el flujo de ajustes con el nuevo componente
  const [settingsFlow, setSettingsFlow] = useState<{isOpen: boolean, eventoId: string, admin: AdminData | null}>({isOpen: false, eventoId: '', admin: null});

  const handleVerAdmin = (eventoId: string, adminId: string) => {
    localStorage.setItem('current_admin_id', adminId);
    sessionStorage.setItem('visor_externo_tipo', 'SuperAdmin'); 
    navigate(`/admin/${eventoId}`); 
  };

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    navigate('/');
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
              <button onClick={() => setCroquisModalState({isOpen: true, eventoId: null})} className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 rounded-lg outline-none font-bold text-xs flex items-center justify-center gap-2 transition">
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
            onOpenSettings={(admin) => setSettingsFlow({isOpen: true, eventoId: evento.id, admin})}
            onDownload={(id: string) => setDownloadModalState({ isOpen: true, adminId: id })}
            onView={(adminId: string) => handleVerAdmin(evento.id, adminId)}
            onDeleteAdmin={(eventoId: string, adminId: string, adminName: string) => setDeleteModalState({ isOpen: true, type: 'admin', eventoId, targetId: adminId, targetName: adminName })}
            onAddAdmin={handleAddAdmin}
            onEditEvent={(eventData: EventoData) => setEditEventModalState({ isOpen: true, eventData })}
            onOpenCroquis={() => setCroquisModalState({isOpen: true, eventoId: evento.id})}
          />
        ))}
      </div>

      {/* EL COMPONENTE MÁGICO QUE REEMPLAZA A TODOS LOS DEMÁS */}
      <AdminSettingsFlow 
        isOpen={settingsFlow.isOpen}
        onClose={() => setSettingsFlow({isOpen: false, eventoId: '', admin: null})}
        admin={settingsFlow.admin}
        eventoId={settingsFlow.eventoId}
        currentUserRole="SuperAdmin"
        onSaveProfile={handleGuardarAjustesAdmin}
        onSaveAccess={handleUpdateAdminAccess}
      />

      <CroquisModal 
        isOpen={croquisModalState.isOpen} 
        onClose={() => setCroquisModalState({isOpen: false, eventoId: null})} 
        isAdmin={true} 
      />
      
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
            const evId = editEventModalState.eventData?.id || null;
            setEditEventModalState({ isOpen: false, eventData: null });
            setCroquisModalState({isOpen: true, eventoId: evId});
        }}
      />

    </div>
  );
};

export default SuperAdminPanel;
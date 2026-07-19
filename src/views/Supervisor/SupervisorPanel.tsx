// src/views/Supervisor/SupervisorPanel.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, LogOut, Plus, Calendar, MapIcon } from 'lucide-react'; // <-- AGREGADO MapIcon
import AdminFiche from '../../components/AdminFiche';
import CountdownDeleteModal from '../../components/CountdownDeleteModal';
import BaseStructureModal from '../../components/BaseStructureModal';
import AdminSettingsFlow from '../../components/AdminSettingsFlow'; 
import CroquisModal from '../../components/CroquisModal'; // <-- AGREGADO
import { guardarCroquis } from '../../utils/croquisService'; // <-- AGREGADO

import { useSupervisorLogic } from '../../hooks/useSupervisorLogic';
import type { AdminData } from '../../hooks/useSuperAdminLogic';
import { useToast } from '../../components/ToastProvider';

// Tipado seguro para extraer los datos de imagen
interface EventoExtended {
  nombre?: string;
  admins?: unknown[];
  diasPorAdmin?: Record<string, unknown[]>;
  croquisUrl?: string;
  croquisPorAdmin?: Record<string, string>;
}

const SupervisorPanel = () => {
  const { id: eventoId } = useParams();
  const navigate = useNavigate();

  const [showExitAlert, setShowExitAlert] = useState(false);

  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname);
    const handlePopState = () => {
      setShowExitAlert(true);
      window.history.pushState(null, '', window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'supervisor') navigate('/');
  }, [navigate]);
  
  const { 
    evento, loading, getAdminStats, handleAddAdmin, handleDeleteAdmin, 
    handleEditAccess, handleSaveProfile, handleSaveGlobalStructure 
  } = useSupervisorLogic(eventoId);

  const { showToast } = useToast();

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, adminId: '', adminName: '' });
  const [structureModal, setStructureModal] = useState(false);
  const [settingsFlow, setSettingsFlow] = useState<{isOpen: boolean, admin: AdminData | null}>({isOpen: false, admin: null});
  
  // NUEVO: ESTADO PARA EL CROQUIS
  const [croquisModal, setCroquisModal] = useState<{isOpen: boolean, adminId: string | null}>({ isOpen: false, adminId: null });

  const diasActualesUnicos = new Set<string>();
  if (evento?.diasPorAdmin) {
    Object.values(evento.diasPorAdmin).forEach((diasDelAdmin) => {
      if (Array.isArray(diasDelAdmin)) {
        diasDelAdmin.forEach((d: unknown) => {
          const diaObj = d as { nombreDia?: string };
          if (diaObj.nombreDia) diasActualesUnicos.add(diaObj.nombreDia);
        });
      }
    });
  }
  const listaDiasExistentes = Array.from(diasActualesUnicos);

  const handleVerAdmin = (adminId: string) => {
    sessionStorage.setItem('visor_externo_tipo', 'Supervisor');
    localStorage.setItem('current_admin_id', adminId);
    navigate(`/admin/${eventoId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    sessionStorage.removeItem('visor_externo_tipo');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck size={48} className="text-indigo-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-black text-slate-700">Sincronizando Mando de Supervisión...</h2>
      </div>
    );
  }

  const eventoExt = evento as EventoExtended;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 relative">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg"><ShieldCheck className="text-white" size={24} /></div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">Panel de Supervisión</h1>
            <p className="text-xs text-slate-400 font-bold uppercase">{eventoExt?.nombre || 'Evento'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          
          {/* NUEVO BOTÓN CROQUIS GENERAL EN LA CABECERA */}
          <button onClick={() => setCroquisModal({isOpen: true, adminId: null})} className="flex-1 lg:flex-none bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs sm:text-sm transition">
            <MapIcon size={16} /> Croquis Gral.
          </button>
          
          <button onClick={() => setStructureModal(true)} className="flex-1 lg:flex-none bg-slate-800 text-white px-3 py-2 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs sm:text-sm transition hover:bg-slate-700">
            <Calendar size={16} /> Añadir Día
          </button>
          <button onClick={handleAddAdmin} className="flex-1 lg:flex-none bg-blue-600 text-white px-3 py-2 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs sm:text-sm transition hover:bg-blue-700">
            <Plus size={16} /> Añadir Admin
          </button>
          <button onClick={() => setShowExitAlert(true)} className="px-3 py-2 text-red-500 hover:text-white hover:bg-red-500 bg-red-50 rounded-2xl font-bold text-xs sm:text-sm shrink-0 flex items-center gap-2 transition">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {eventoExt?.admins && eventoExt.admins.length > 0 ? (
          eventoExt.admins.map((adminRaw) => {
            const admin = adminRaw as AdminData;
            return (
              <AdminFiche 
                key={admin.id} 
                data={admin} 
                stats={getAdminStats(admin.id)} 
                onView={() => handleVerAdmin(admin.id)} 
                onOpenSettings={() => setSettingsFlow({ isOpen: true, admin: admin })} 
                onDownload={() => showToast('El Supervisor visualiza y descarga la info dentro del panel del Admin.', 'info')} 
                onDelete={() => setDeleteModal({ isOpen: true, adminId: admin.id, adminName: admin.name })} 
                // CONECTAMOS LA PROPIEDAD PARA CROQUIS INDIVIDUAL
                onOpenCroquisAdmin={(id) => setCroquisModal({ isOpen: true, adminId: id })}
              />
            )
          })
        ) : (
          <div className="col-span-full text-center p-12 text-slate-400 font-bold">Aún no hay administradores.</div>
        )}
      </div>

      <CountdownDeleteModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, adminId: '', adminName: '' })} onConfirm={() => { handleDeleteAdmin(deleteModal.adminId); setDeleteModal({ isOpen: false, adminId: '', adminName: '' }); }} title={deleteModal.adminName} message="¿Seguro de eliminar este administrador?" />
      
      {/* SE SATISFACE A TYPESCRIPT CASTING A UNKNOWN Y LUEGO AL TIPO */}
      <AdminSettingsFlow isOpen={settingsFlow.isOpen} onClose={() => setSettingsFlow({ isOpen: false, admin: null })} admin={settingsFlow.admin} eventoId={eventoId || ''} currentUserRole="Supervisor" onSaveProfile={(evId, updated) => handleSaveProfile(evId, updated as unknown as {id: string, name: string, org: string})} onSaveAccess={handleEditAccess} />
      
      <BaseStructureModal 
        isOpen={structureModal} onClose={() => setStructureModal(false)} 
        isSupervisor={true} existingDays={listaDiasExistentes}
        onSave={async (estructura) => {
          const exitoso = await handleSaveGlobalStructure({ 
            dias: estructura.dias,
            horarios: estructura.horarios || [], 
            cajas: estructura.cajas || [] 
          });
          if (exitoso) setStructureModal(false);
        }}
      />

      {/* COMPONENTE MAESTRO DE CROQUIS INTEGRADO AL SUPERVISOR */}
      <CroquisModal
        isOpen={croquisModal.isOpen}
        onClose={() => setCroquisModal({ isOpen: false, adminId: null })}
        canEdit={true}
        titulo={croquisModal.adminId ? "Croquis Individual del Área" : "Croquis General del Evento"}
        croquisActual={croquisModal.adminId ? (eventoExt?.croquisPorAdmin?.[croquisModal.adminId] || null) : (eventoExt?.croquisUrl || null)}
        onSaveCroquis={async (file) => {
          if (eventoId) {
            await guardarCroquis(eventoId, croquisModal.adminId, file);
          }
        }}
      />

      {showExitAlert && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-800 mb-2">¿Cerrar Sesión?</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Estás a punto de salir del panel de supervisión. ¿Confirmas esta acción?</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowExitAlert(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition">Cancelar</button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black shadow-md hover:bg-red-600 transition">Sí, salir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorPanel;
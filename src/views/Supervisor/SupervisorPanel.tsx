import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, LogOut, Plus, LayoutGrid } from 'lucide-react';
import AdminFiche from '../../components/AdminFiche';
import CountdownDeleteModal from '../../components/CountdownDeleteModal';
import BaseStructureModal from '../../components/BaseStructureModal';

// IMPORTACIÓN DEL FLUJO DE AJUSTES
import AdminSettingsFlow from '../../components/AdminSettingsFlow'; 
import { useSupervisorLogic } from '../../hooks/useSupervisorLogic';
import type { AdminData } from '../../hooks/useSuperAdminLogic';

const SupervisorPanel = () => {
  const { id: eventoId } = useParams();
  const navigate = useNavigate();

  // PROTECCIÓN DE RUTA: Solo entra si es supervisor
  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'supervisor') {
      navigate('/');
    }
  }, [navigate]);
  
  // Conectamos el "Cerebro"
  const { 
    evento, loading, getAdminStats, handleAddAdmin, handleDeleteAdmin, 
    handleEditAccess, handleSaveProfile, handleSaveGlobalStructure 
  } = useSupervisorLogic(eventoId);

  // Estados de Modales
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, adminId: '', adminName: '' });
  const [structureModal, setStructureModal] = useState(false);
  
  // Estado para el Flujo de Ajustes Reutilizable
  const [settingsFlow, setSettingsFlow] = useState<{isOpen: boolean, admin: AdminData | null}>({isOpen: false, admin: null});

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      
      {/* HEADER */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100 shrink-0">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Panel de Supervisión</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{evento?.nombre || 'Evento'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-none">
          {/* BOTÓN: ESTRUCTURA GLOBAL */}
          <button 
            onClick={() => setStructureModal(true)} 
            className="flex-1 lg:flex-none bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 shadow-sm transition text-sm"
          >
            <LayoutGrid size={16} /> Estructura Global
          </button>
          
          {/* BOTÓN: CREAR ADMIN */}
          <button 
            onClick={handleAddAdmin} 
            className="flex-1 lg:flex-none bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm transition text-sm"
          >
            <Plus size={16} /> Añadir Admin
          </button>
          
          <button onClick={handleLogout} className="px-4 py-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition font-bold text-sm shrink-0 flex items-center gap-2" title="Cerrar sesión">
            <LogOut size={16} className="hidden sm:inline-block" /> Salir
          </button>
        </div>
      </header>

      {/* LISTADO DE ADMINS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {evento?.admins && evento.admins.length > 0 ? (
          evento.admins.map((admin) => (
            <AdminFiche 
              key={admin.id}
              data={admin as never} 
              stats={getAdminStats(admin.id)} 
              onView={() => handleVerAdmin(admin.id)}
              onOpenSettings={() => setSettingsFlow({ isOpen: true, admin: admin as AdminData })}
              onDownload={() => alert("El Supervisor visualiza y descarga la info dentro del panel del Admin.")}
              onDelete={() => setDeleteModal({ isOpen: true, adminId: admin.id, adminName: admin.name })}
            />
          ))
        ) : (
          <div className="col-span-full text-center p-12 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl bg-white shadow-sm">
            <ShieldCheck size={40} className="mx-auto mb-3 opacity-50" />
            Aún no hay administradores configurados.<br/>Usa el botón "Añadir Admin" para comenzar.
          </div>
        )}
      </div>

      {/* MODALES */}
      <CountdownDeleteModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ isOpen: false, adminId: '', adminName: '' })} 
        onConfirm={() => {
          handleDeleteAdmin(deleteModal.adminId);
          setDeleteModal({ isOpen: false, adminId: '', adminName: '' });
        }} 
        title={deleteModal.adminName} 
        message="¿Estás seguro de eliminar este administrador? Su acceso será revocado y sus datos quedarán huérfanos."
      />

      <AdminSettingsFlow 
        isOpen={settingsFlow.isOpen}
        onClose={() => setSettingsFlow({ isOpen: false, admin: null })}
        admin={settingsFlow.admin}
        eventoId={eventoId || ''}
        currentUserRole="Supervisor"
        onSaveProfile={handleSaveProfile}
        onSaveAccess={handleEditAccess}
      />

      <BaseStructureModal 
        isOpen={structureModal}
        onClose={() => setStructureModal(false)}
        onSave={async (estructura) => {
          const exitoso = await handleSaveGlobalStructure(estructura);
          if (exitoso) setStructureModal(false);
        }}
      />
    </div>
  );
};

export default SupervisorPanel;
import { Calendar, Plus, LogOut, ArrowLeft, ShieldCheck } from 'lucide-react'; // <-- Agregué ShieldCheck
import { useLocation, useNavigate, useParams } from 'react-router-dom'; // <-- Agregué useParams

import { useAdminLogic } from '../../hooks/useAdminLogic';

import AssignUserModal from '../../components/AssignUserModal';
import ParticipantDrawer from '../../components/ParticipantDrawer';
import MatrizTurnos from '../../components/MatrizTurnos';
import EditNameModal from '../../components/EditNameModal';
import SpecialBoxModal from '../../components/SpecialBoxModal';
import EditShiftModal from '../../components/EditShiftModal';
import ModalInfoUsuario from '../../components/ModalInfoUsuario';
import AdminHeader from '../../components/AdminHeader';
import AdminStatsBar from '../../components/AdminStatsBar';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import CroquisModal from '../../components/CroquisModal';

const AdminPanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // 1. LEEMOS EL ID DEL EVENTO DE LA URL (ej. /admin/12345)
  const { id: eventoId } = useParams(); 
  const openedBySuperAdmin = location.state?.openedBySuperAdmin || false;

  // 2. SE LO PASAMOS A LA LÓGICA
  const {
    dias, diaActivo, setDiaActivo, showDirectorio, setShowDirectorio, showCroquis, setShowCroquis,
    isEditingTitle, setIsEditingTitle, seccionName, setSeccionName, showSpecialModal, setShowSpecialModal,
    editModal, setEditModal, isUsuarioModalOpen, setIsUsuarioModalOpen, usuarioActivo, isViewingSelf, modalAsignacion,
    diaActual, participantesEnriquecidos, getParticipante, totalCajas, turnosActivos, turnosLibres, totalParticipantes,
    abrirModalAsignacion, cerrarModalAsignacion, asignarUsuarioExistente, crearYAsignarUsuario, quitarParticipante,
    handleCrearCaja, handleCrearCajaEspecial, handleCrearHorario, handleEliminarCaja, handleEliminarHorario,
    abrirEditor, handleSaveEdit, getBusyUserIdsForModal, handleAbrirMiPerfil, handleAbrirPerfilParticipante,
    handleGuardarUsuario, handleCheckNameDuplicate, downloadModal, setDownloadModal, loading
  } = useAdminLogic(eventoId || 'demo'); 

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_admin_id');
    navigate('/');
  };

  // 3. PANTALLA DE CARGA MIENTRAS DESCARGA DE FIREBASE
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck size={48} className="text-blue-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-black text-slate-700">Conectando con el Evento...</h2>
        <p className="text-sm text-slate-500 mt-2">Sincronizando base de datos en tiempo real.</p>
      </div>
    );
  }

  // 4. SI EL EVENTO AÚN NO TIENE DÍAS CREADOS
  if (!diaActual && !loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-black text-slate-700">El evento está vacío</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">Aún no se han configurado los días para este evento.</p>
        
        {/* Mostramos el botón de Regresar si es el SuperAdmin */}
        {openedBySuperAdmin ? (
          <button onClick={() => navigate('/super-admin')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition">
            <ArrowLeft size={16} /> Regresar a SuperAdmin
          </button>
        ) : (
          <button onClick={() => handleCrearCaja()} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition">
            Comenzar a configurar (Crear Día 1)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-6 font-sans flex flex-col h-screen relative">
      
      {/* --- BOTONES SUPERIORES: REGRESAR / CERRAR SESIÓN --- */}
      <div className="flex justify-between items-center mb-4">
        {openedBySuperAdmin ? (
          <button 
            onClick={() => navigate('/super-admin')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition"
          >
            <ArrowLeft size={16} /> Regresar a SuperAdmin
          </button>
        ) : (
          <div></div> // Espacio vacío para mantener el layout si no hay botón
        )}

        {/* Solo mostramos Cerrar Sesión si NO somos el SuperAdmin espiando */}
        {!openedBySuperAdmin && (
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white hover:bg-red-50 text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        )}
      </div>

      <AdminHeader 
        seccionName={seccionName} setSeccionName={setSeccionName}
        isEditingTitle={isEditingTitle} setIsEditingTitle={setIsEditingTitle}
        onOpenProfile={handleAbrirMiPerfil} onSave={() => alert("Guardado")} 
      />

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
        {dias.map((dia, idx) => (
          <button key={dia.id} onClick={() => setDiaActivo(idx)} className={`px-5 py-2 rounded-xl font-bold transition whitespace-nowrap ${diaActivo === idx ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            <Calendar size={16} /> {dia.nombreDia}
          </button>
        ))}
        <button onClick={() => setShowSpecialModal(true)} className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-100 transition font-bold text-sm flex items-center gap-2 whitespace-nowrap shadow-sm"><Plus size={16} /> Caja Especial</button>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <AdminStatsBar 
          totalCajas={totalCajas} turnosActivos={turnosActivos} turnosLibres={turnosLibres} totalParticipantes={totalParticipantes}
          onCrearCaja={handleCrearCaja} onShowCroquis={() => setShowCroquis(true)} onShowDirectorio={() => setShowDirectorio(true)}
        />

        <MatrizTurnos 
          diaActual={diaActual} getParticipante={getParticipante} onAsignar={abrirModalAsignacion} onQuitar={quitarParticipante}
          onCrearCaja={handleCrearCaja} onCrearHorario={handleCrearHorario} onDeleteCaja={handleEliminarCaja} onDeleteHorario={handleEliminarHorario}
          onEditCaja={(id) => { const caja = diaActual.cajas.find(c => c.id === id); if (caja) abrirEditor('caja', id, caja.nombre); }}
          onEditHorario={(horario) => abrirEditor('horario', horario, horario)}
        />
      </div>

      {/* MODALES */}
      <AssignUserModal isOpen={modalAsignacion.isOpen} onClose={cerrarModalAsignacion} horario={modalAsignacion.horario} cajaNombre={modalAsignacion.cajaNombre} participantes={participantesEnriquecidos} busyUserIds={getBusyUserIdsForModal()} onAssign={asignarUsuarioExistente} onCreateAndAssign={crearYAsignarUsuario} />
      <ParticipantDrawer isOpen={showDirectorio} onClose={() => setShowDirectorio(false)} participantes={participantesEnriquecidos} currentUserRole="Administrador" onEditParticipante={handleAbrirPerfilParticipante} />
      <EditNameModal isOpen={editModal.isOpen && editModal.type === 'caja'} title={editModal.title} initialValue={editModal.initialValue} label={editModal.label} onClose={() => setEditModal({...editModal, isOpen: false})} onSave={handleSaveEdit} />
      <EditShiftModal isOpen={editModal.isOpen && editModal.type === 'horario'} initialRange={editModal.initialValue} onClose={() => setEditModal({...editModal, isOpen: false})} onSave={handleSaveEdit} />
      <SpecialBoxModal isOpen={showSpecialModal} onClose={() => setShowSpecialModal(false)} onCreate={handleCrearCajaEspecial} />
      
      <ModalInfoUsuario 
        isOpen={isUsuarioModalOpen} 
        onClose={() => setIsUsuarioModalOpen(false)} 
        data={usuarioActivo} 
        isViewingSelf={isViewingSelf} 
        currentUserRole="Administrador" 
        onSave={handleGuardarUsuario} 
        checkNameExists={handleCheckNameDuplicate} 
        onDownloadImage={() => {
          setDownloadModal({
            isOpen: true,
            type: isViewingSelf ? 'general' : 'personal',
            targetUserId: usuarioActivo?.id
          });
          setIsUsuarioModalOpen(false); 
        }} 
      />

      <DownloadScheduleModal
        isOpen={downloadModal.isOpen}
        onClose={() => setDownloadModal({ ...downloadModal, isOpen: false })}
        type={downloadModal.type}
        seccionName={seccionName}
        dias={dias}
        diaActivo={diaActivo}
        participantes={participantesEnriquecidos}
        targetUserId={downloadModal.targetUserId}
      />

      <CroquisModal 
        isOpen={showCroquis} 
        onClose={() => setShowCroquis(false)} 
        isAdmin={true} 
      />
    </div>
  );
};

export default AdminPanel;
import { Calendar, Plus } from 'lucide-react';

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
  // <-- ERROR CORREGIDO AQUÍ: Extraemos las variables de forma limpia
  const {
    dias, diaActivo, setDiaActivo, showDirectorio, setShowDirectorio, showCroquis, setShowCroquis,
    isEditingTitle, setIsEditingTitle, seccionName, setSeccionName, showSpecialModal, setShowSpecialModal,
    editModal, setEditModal, isUsuarioModalOpen, setIsUsuarioModalOpen, usuarioActivo, isViewingSelf, modalAsignacion,
    diaActual, participantesEnriquecidos, getParticipante, totalCajas, turnosActivos, turnosLibres, totalParticipantes,
    abrirModalAsignacion, cerrarModalAsignacion, asignarUsuarioExistente, crearYAsignarUsuario, quitarParticipante,
    handleCrearCaja, handleCrearCajaEspecial, handleCrearHorario, handleEliminarCaja, handleEliminarHorario,
    abrirEditor, handleSaveEdit, getBusyUserIdsForModal, handleAbrirMiPerfil, handleAbrirPerfilParticipante,
    handleGuardarUsuario, handleCheckNameDuplicate, downloadModal, setDownloadModal,
  } = useAdminLogic();

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-6 font-sans flex flex-col h-screen relative">
      
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
// src/views/Admin/AdminPanelModals.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import AssignUserModal from '../../components/AssignUserModal';
import ParticipantDrawer from '../../components/ParticipantDrawer';
import EditNameModal from '../../components/EditNameModal';
import SpecialBoxModal from '../../components/SpecialBoxModal';
import CountdownDeleteModal from '../../components/CountdownDeleteModal';
import ModalInfoUsuario from '../../components/ModalInfoUsuario';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import ModalInputHorario from '../../components/ModalInputHorario';
import ModalAlertaChoque from '../../components/ModalAlertaChoque';
import CroquisModal from '../../components/CroquisModal';
import ModalAsignarCapitan from '../../components/ModalAsignarCapitan'; 

const AdminPanelModals = (props: any) => {
  const {
    modalAsignacion, cerrarModalAsignacion, participantesEnriquecidos, participantesParaAsignacion, localBusyUserIds, asignarUsuarioExistente, crearYAsignarUsuario,
    showDirectorio, setShowDirectorio, handleAbrirPerfilParticipante, setDeletePartModal, eventoId, turnosLibresCount, turnosOcupadosCount,
    editModal, setEditModal, handleSaveEdit,
    showSpecialModal, setShowSpecialModal, handleCrearCajaEspecial,
    deletePartModal, handleConfirmDeleteParticipante,
    deleteEspecialModal, setDeleteEspecialModal, handleDeleteTurnoEspecial,
    isUsuarioModalOpen, setIsUsuarioModalOpen, getDatosParaModal, isViewingSelf, handleGuardarPerfilAjustado, handleCheckNameDuplicate, setDownloadModal, usuarioActivo,
    downloadModal, seccionName, dias, diaActivo,
    createShiftModal, setCreateShiftModal, handleValidarCrearHorario,
    clashModal, setClashModal,
    showCroquis, setShowCroquis, croquisData,
    showCapitanModal, setShowCapitanModal, cajasDisponibles, diasDisponibles, handleCrearCapitan, 
    customInviteLink,
  } = props;

  return (
    <>
      <AssignUserModal 
        isOpen={modalAsignacion.isOpen} 
        onClose={cerrarModalAsignacion} 
        horario={modalAsignacion.horario} 
        cajaNombre={modalAsignacion.cajaNombre} 
        participantes={participantesParaAsignacion || participantesEnriquecidos} 
        busyUserIds={localBusyUserIds} 
        onAssign={asignarUsuarioExistente} 
        onCreateAndAssign={crearYAsignarUsuario} 
      />
      
      <ParticipantDrawer customInviteLink={customInviteLink} isOpen={showDirectorio} onClose={() => setShowDirectorio(false)} participantes={participantesEnriquecidos} currentUserRole={props.isCapitan ? 'Capitan' : 'Administrador'} onEditParticipante={handleAbrirPerfilParticipante} onDeleteParticipante={(id, nombre) => setDeletePartModal({ isOpen: true, id, nombre })} eventoId={eventoId} adminId={localStorage.getItem('current_admin_id') || 'demo'} turnosLibresCount={turnosLibresCount} turnosOcupadosCount={turnosOcupadosCount} />
      
      <EditNameModal isOpen={editModal.isOpen && editModal.type === 'caja'} title={editModal.title} initialValue={editModal.initialValue} label={editModal.label} onClose={() => setEditModal({...editModal, isOpen: false})} onSave={handleSaveEdit} />
      
      <SpecialBoxModal isOpen={showSpecialModal} onClose={() => setShowSpecialModal(false)} onCreate={handleCrearCajaEspecial} />
      
      <CountdownDeleteModal isOpen={deletePartModal.isOpen} onClose={() => setDeletePartModal({ isOpen: false, id: '', nombre: '' })} onConfirm={handleConfirmDeleteParticipante} title={deletePartModal.nombre} message="Se eliminará su perfil y se liberarán todos los turnos que tenía asignados." />
      
      <CountdownDeleteModal isOpen={deleteEspecialModal.isOpen} onClose={() => setDeleteEspecialModal({ isOpen: false, cajaId: '', turnoId: '' })} onConfirm={() => { handleDeleteTurnoEspecial(deleteEspecialModal.cajaId, deleteEspecialModal.turnoId); setDeleteEspecialModal({ isOpen: false, cajaId: '', turnoId: '' }); }} title="Eliminar Horario Especial" message="Se eliminará este bloque de horario." />
      
      <ModalInfoUsuario isOpen={isUsuarioModalOpen} onClose={() => setIsUsuarioModalOpen(false)} data={getDatosParaModal()} isViewingSelf={isViewingSelf} currentUserRole={props.isCapitan ? 'Capitan' : 'Administrador'} onSave={handleGuardarPerfilAjustado} checkNameExists={handleCheckNameDuplicate} onDownloadImage={() => { setDownloadModal({ isOpen: true, type: isViewingSelf ? 'general' : 'personal', targetUserId: usuarioActivo?.id }); setIsUsuarioModalOpen(false); }} />
      
      <DownloadScheduleModal isOpen={downloadModal.isOpen} onClose={() => setDownloadModal({ ...downloadModal, isOpen: false })} type={downloadModal.type} seccionName={seccionName} dias={dias} diaActivo={diaActivo} participantes={participantesEnriquecidos} targetUserId={downloadModal.targetUserId} />
      
      <ModalInputHorario isOpen={createShiftModal?.isOpen || false} onClose={() => setCreateShiftModal && setCreateShiftModal({ ...createShiftModal, isOpen: false })} defaultStart={createShiftModal?.defaultStart || '08:00'} defaultEnd={createShiftModal?.defaultEnd || '09:00'} onConfirm={handleValidarCrearHorario} />
      
      <ModalAlertaChoque isOpen={clashModal?.isOpen || false} onClose={() => setClashModal && setClashModal({ ...clashModal, isOpen: false })} horarioNuevo={`${clashModal?.inicio} - ${clashModal?.fin}`} horarioCruzado={clashModal?.turnoCruzado || ''} />
      
      <CroquisModal 
        isOpen={showCroquis} 
        onClose={() => setShowCroquis(false)} 
        canEdit={false} 
        croquis={croquisData} 
        onSaveCroquis={async () => Promise.resolve()} 
        dias={dias}
        diaActivo={diaActivo}
        currentUserRole={props.isCapitan ? 'Capitan' : 'Administrador'}
        onSavePoligono={props.onSavePoligono}       // <-- Recibimos de AdminPanel
        onDeletePoligono={props.onDeletePoligono}
        participantes={participantesEnriquecidos}
      />
      
      <ModalAsignarCapitan 
        isOpen={showCapitanModal} 
        onClose={() => setShowCapitanModal(false)} 
        diasDisponibles={diasDisponibles} 
        cajasDisponibles={cajasDisponibles} 
        onSave={(nombre, cajas, diasAsig, pwd) => handleCrearCapitan(nombre, cajas, diasAsig, pwd)}
      />
    </>
  );
};

export default AdminPanelModals;
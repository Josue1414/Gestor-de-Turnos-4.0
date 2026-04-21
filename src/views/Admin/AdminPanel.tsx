import { useState, useEffect } from 'react';
import { Calendar, Plus, ShieldCheck, Clock, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { DiaEvento, Participante } from '../../types';

import ModalInputHorario from '../../components/ModalInputHorario';
import ModalAlertaChoque from '../../components/ModalAlertaChoque';
import { useAdminLogic } from '../../hooks/useAdminLogic';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CountdownDeleteModal from '../../components/CountdownDeleteModal';

import AssignUserModal from '../../components/AssignUserModal';
import ParticipantDrawer from '../../components/ParticipantDrawer';
import MatrizTurnos from '../../components/MatrizTurnos';
import EditNameModal from '../../components/EditNameModal';
import SpecialBoxModal from '../../components/SpecialBoxModal';

import ModalInfoUsuario, { type UsuarioModalData } from '../../components/ModalInfoUsuario';
import AdminHeader from '../../components/AdminHeader';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import CroquisModal from '../../components/CroquisModal';

// NUESTRO CEREBRO MATEMÁTICO:
import { calculateAdminStats } from '../../utils/statsCalculator';

interface ParticipanteExtendidoDb extends Participante {
  telefono?: string;
  codigoPais?: string;
  notas?: string;
  organizacion?: string;
  organizationLabel?: string;
  ubicaciones?: string[];
  fechaNacimiento?: string;
}

interface AdminInDB {
  id: string;
  name?: string;
  phone?: string;
  countryCode?: string;
  notes?: string;
  organization?: string;
  organizationLabel?: string;
  supportArea?: string;
  [key: string]: unknown;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { id: eventoId } = useParams(); 
  
  const visorTipo = sessionStorage.getItem('visor_externo_tipo'); 
  const isExternalViewer = !!visorTipo;

  const {
    dias, diaActivo, setDiaActivo, showDirectorio, setShowDirectorio, showCroquis, setShowCroquis,
    isEditingTitle, setIsEditingTitle, seccionName, setSeccionName, showSpecialModal, setShowSpecialModal,
    editModal, setEditModal, isUsuarioModalOpen, setIsUsuarioModalOpen, usuarioActivo, isViewingSelf, modalAsignacion,
    downloadModal, setDownloadModal, loading, 
    diaActual, participantesEnriquecidos, getParticipante,
    abrirModalAsignacion, cerrarModalAsignacion, asignarUsuarioExistente, crearYAsignarUsuario, quitarParticipante,
    handleCrearCaja, handleCrearCajaEspecial, handleCrearHorario, handleEliminarCaja, handleEliminarHorario,
    abrirEditor, handleSaveEdit, getBusyUserIdsForModal, handleAbrirMiPerfil, handleAbrirPerfilParticipante,
    handleCheckNameDuplicate, createShiftModal, setCreateShiftModal, confirmarCrearHorario, clashModal, setClashModal
  } = useAdminLogic(eventoId || 'demo'); 

  const [deletePartModal, setDeletePartModal] = useState({ isOpen: false, id: '', nombre: '' });
  const [deleteEspecialModal, setDeleteEspecialModal] = useState({ isOpen: false, cajaId: '', turnoId: '' });
  const [currentAdminInfo, setCurrentAdminInfo] = useState<{name: string, org: string} | null>(null);

  // ALIMENTAMOS EL HEADER CON LAS ESTADÍSTICAS REALES
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statsActuales = calculateAdminStats(dias as any, participantesEnriquecidos as any);

  useEffect(() => {
    if (!eventoId) return;
    const adminIdL = localStorage.getItem('current_admin_id');
    if (!adminIdL) return;
    
    getDoc(doc(db, 'eventos', eventoId)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        const admins = (data.admins as AdminInDB[]) || [];
        const myAdmin = admins.find((a) => a.id === adminIdL);
        if (myAdmin) {
          setCurrentAdminInfo({
            name: myAdmin.name || 'Administrador',
            org: myAdmin.organizationLabel && myAdmin.organization 
              ? `${myAdmin.organizationLabel}: ${myAdmin.organization}` 
              : myAdmin.organization || 'Sin organización asignada'
          });
        }
      }
    }).catch(err => console.error(err));
  }, [eventoId]);

  const handleConfirmDeleteParticipante = async () => {
    if (!eventoId || !deletePartModal.id) return;
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      
      const data = docSnap.data();
      const adminIdL = localStorage.getItem('current_admin_id') || 'demo';
      
      const participantesDelAdmin: Participante[] = data.participantesPorAdmin?.[adminIdL] || [];
      const participantesFiltrados = participantesDelAdmin.filter((p) => p.id !== deletePartModal.id);

      const diasDelAdmin: DiaEvento[] = data.diasPorAdmin?.[adminIdL] || [];
      const diasLimpios = diasDelAdmin.map((dia) => ({
        ...dia,
        cajas: dia.cajas.map((caja) => ({
          ...caja,
          turnos: caja.turnos.map((turno) => ({
            ...turno,
            participanteId: turno.participanteId === deletePartModal.id ? null : turno.participanteId
          }))
        }))
      }));

      await updateDoc(docRef, {
        [`participantesPorAdmin.${adminIdL}`]: participantesFiltrados,
        [`diasPorAdmin.${adminIdL}`]: diasLimpios
      });

    } catch (error) { console.error(error); }
  };

  const handleDeleteTurnoEspecial = async (cajaId: string, turnoId: string) => {
    if (!diaActual || !eventoId) return;
    const nuevosDias = dias.map((d, i) => i === diaActivo ? {
      ...d, cajas: d.cajas.map(c => c.id === cajaId ? { ...c, turnos: c.turnos.filter(t => t.id !== turnoId) } : c)
    } : d);
    try {
      const adminIdL = localStorage.getItem('current_admin_id') || 'demo';
      await updateDoc(doc(db, 'eventos', eventoId), { [`diasPorAdmin.${adminIdL}`]: nuevosDias });
    } catch (error) { console.error(error); }
  };

  const handleGuardarPerfilAjustado = async (datosActualizados: UsuarioModalData) => {
    if (!eventoId) return;
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      
      const data = docSnap.data();
      const adminIdL = localStorage.getItem('current_admin_id') || 'demo';
      const nuevaEtiqueta = datosActualizados.organizationLabel || 'Congregación';
      const updatePayload: Record<string, unknown> = {};

      if (datosActualizados.role === 'Participante') {
        const participantesDelAdmin: ParticipanteExtendidoDb[] = data.participantesPorAdmin?.[adminIdL] || [];
        const actualizados = participantesDelAdmin.map((p) => 
          p.id === datosActualizados.id 
            ? { ...p, nombre: datosActualizados.name, telefono: datosActualizados.phone, 
                codigoPais: datosActualizados.countryCode, notas: datosActualizados.notes,
                organizacion: datosActualizados.organization, organizationLabel: nuevaEtiqueta,
                fechaNacimiento: datosActualizados.birthDate 
              } : { ...p, organizationLabel: nuevaEtiqueta }
        );
        updatePayload[`participantesPorAdmin.${adminIdL}`] = actualizados;
        
      } else if (datosActualizados.role === 'Administrador' || datosActualizados.role === 'SuperAdmin') {
        const admins: AdminInDB[] = data.admins || [];
        const actualizadosAdmins = admins.map((a) => 
          a.id === datosActualizados.id 
            ? { ...a, name: datosActualizados.name, phone: datosActualizados.phone, 
                countryCode: datosActualizados.countryCode, notes: datosActualizados.notes,
                organization: datosActualizados.organization, organizationLabel: nuevaEtiqueta } : a
        );

        const participantesDelAdmin: ParticipanteExtendidoDb[] = data.participantesPorAdmin?.[adminIdL] || [];
        updatePayload['admins'] = actualizadosAdmins;
        updatePayload[`participantesPorAdmin.${adminIdL}`] = participantesDelAdmin.map(p => ({...p, organizationLabel: nuevaEtiqueta}));

        if (datosActualizados.id === adminIdL) {
          setCurrentAdminInfo({ name: datosActualizados.name, org: datosActualizados.organization ? `${nuevaEtiqueta}: ${datosActualizados.organization}` : 'Sin organización' });
        }
      }
      await updateDoc(docRef, updatePayload);
      setIsUsuarioModalOpen(false); 
    } catch (error) { console.error(error); }
  };

  const getDatosParaModal = (): UsuarioModalData | null => {
    if (!usuarioActivo) return null;
    if (usuarioActivo.role === 'Participante') {
      const p = participantesEnriquecidos.find(x => x.id === usuarioActivo.id) as ParticipanteExtendidoDb | undefined;
      return {
        id: usuarioActivo.id, name: p?.nombre || usuarioActivo.name, role: 'Participante',
        phone: p?.telefono || '', countryCode: p?.codigoPais || '+52', supportArea: usuarioActivo.supportArea || '',
        notes: p?.notas || '', organization: p?.organizacion || '', organizationLabel: p?.organizationLabel || 'Congregación',
        ubicaciones: p?.ubicaciones || [], birthDate: p?.fechaNacimiento || '' 
      };
    }
    const a = usuarioActivo as unknown as AdminInDB;
    return {
      id: usuarioActivo.id, name: a.name || usuarioActivo.name, role: usuarioActivo.role,
      phone: a.phone || '', countryCode: a.countryCode || '+52', supportArea: a.supportArea || '',
      notes: a.notes || '', organization: a.organization || '', organizationLabel: a.organizationLabel || 'Congregación', ubicaciones: []
    };
  };

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_admin_id');
    sessionStorage.removeItem('visor_externo_tipo');
    navigate('/');
  };

  const handleBack = () => {
    const destino = visorTipo === 'SuperAdmin' ? '/super-admin' : `/supervisor/${eventoId}`;
    sessionStorage.removeItem('visor_externo_tipo');
    localStorage.removeItem('current_admin_id');
    navigate(destino);
  };

  const handleSaveEventName = async (): Promise<void> => {
    setIsEditingTitle(false);
    if (!eventoId || !seccionName.trim()) return;
    try { await updateDoc(doc(db, 'eventos', eventoId), { nombre: seccionName.trim() }); } catch (error) { console.error(error); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck size={48} className="text-blue-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-black text-slate-700">Conectando...</h2>
      </div>
    );
  }

  if (!diaActual && !loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-black text-slate-700">El evento está vacío</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">Aún no se han configurado los días para este evento.</p>
        {isExternalViewer ? (
          <button onClick={handleBack} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition">Regresar</button>
        ) : (
          <button onClick={() => handleCrearCaja()} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition">Comenzar a configurar</button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-6 font-sans flex flex-col h-screen relative overflow-x-hidden">
      
      <AdminHeader 
        seccionName={seccionName} setSeccionName={setSeccionName} isEditingTitle={isEditingTitle} setIsEditingTitle={setIsEditingTitle} 
        onOpenProfile={handleAbrirMiPerfil} onSave={handleSaveEventName} onShowCroquis={() => setShowCroquis(true)} 
        onBack={isExternalViewer ? handleBack : undefined} onLogout={!isExternalViewer ? handleLogout : undefined} 
        isSuperAdminViewing={isExternalViewer} adminInfo={currentAdminInfo}
        stats={statsActuales} // <-- Inyección directa de datos al header
      />

      <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 mb-2 no-scrollbar">
        {dias.map((dia, idx) => (
          <button key={dia.id} onClick={() => setDiaActivo(idx)} className={`px-5 py-2.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 ${diaActivo === idx ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            <Calendar size={16} /> {dia.nombreDia}
          </button>
        ))}
      </div>

      {/* BOTONES REORDENADOS: Especial -> Normal -> Horario -> Participantes */}
      <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0">
        <button onClick={() => setShowSpecialModal(true)} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-100 transition font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
          <Plus size={16} /> Caja Especial
        </button>
        <button onClick={handleCrearCaja} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
          <Plus size={16} /> Caja Normal
        </button>
        <button onClick={handleCrearHorario} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
          <Clock size={16} /> Añadir Horario
        </button>
        <button onClick={() => setShowDirectorio(true)} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
          <Users size={16} /> Participantes ({statsActuales.participantes})
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <MatrizTurnos 
          diaActual={diaActual} getParticipante={getParticipante} onAsignar={abrirModalAsignacion} onQuitar={quitarParticipante}
          onCrearCaja={handleCrearCaja} onDeleteCaja={handleEliminarCaja} onDeleteHorario={handleEliminarHorario}
          onEditCaja={(id) => { const caja = diaActual.cajas.find(c => c.id === id); if (caja) abrirEditor('caja', id, caja.nombre as string); }}
          onEditHorario={(horario) => abrirEditor('horario', horario, horario)}
          onDeleteTurnoEspecial={(cajaId, turnoId) => setDeleteEspecialModal({ isOpen: true, cajaId, turnoId })}
          onEditTurnoEspecial={(cajaId: string, turnoId: string) => console.log("Editar:", cajaId, turnoId)} 
        />
      </div>

      <AssignUserModal isOpen={modalAsignacion.isOpen} onClose={cerrarModalAsignacion} horario={modalAsignacion.horario} cajaNombre={modalAsignacion.cajaNombre} participantes={participantesEnriquecidos} busyUserIds={getBusyUserIdsForModal()} onAssign={asignarUsuarioExistente} onCreateAndAssign={crearYAsignarUsuario} />
      <ParticipantDrawer isOpen={showDirectorio} onClose={() => setShowDirectorio(false)} participantes={participantesEnriquecidos} currentUserRole="Administrador" onEditParticipante={handleAbrirPerfilParticipante} onDeleteParticipante={(id, nombre) => setDeletePartModal({ isOpen: true, id, nombre })} eventoId={eventoId} adminId={localStorage.getItem('current_admin_id') || 'demo'} />
      <EditNameModal isOpen={editModal.isOpen && editModal.type === 'caja'} title={editModal.title} initialValue={editModal.initialValue} label={editModal.label} onClose={() => setEditModal({...editModal, isOpen: false})} onSave={handleSaveEdit} />
      <SpecialBoxModal isOpen={showSpecialModal} onClose={() => setShowSpecialModal(false)} onCreate={handleCrearCajaEspecial} />
      <CountdownDeleteModal isOpen={deletePartModal.isOpen} onClose={() => setDeletePartModal({ isOpen: false, id: '', nombre: '' })} onConfirm={handleConfirmDeleteParticipante} title={deletePartModal.nombre} message="Se eliminará su perfil y se liberarán todos los turnos que tenía asignados." />
      <CountdownDeleteModal isOpen={deleteEspecialModal.isOpen} onClose={() => setDeleteEspecialModal({ isOpen: false, cajaId: '', turnoId: '' })} onConfirm={() => { handleDeleteTurnoEspecial(deleteEspecialModal.cajaId, deleteEspecialModal.turnoId); setDeleteEspecialModal({ isOpen: false, cajaId: '', turnoId: '' }); }} title="Eliminar Horario Especial" message="Se eliminará este bloque de horario." />
      <ModalInfoUsuario isOpen={isUsuarioModalOpen} onClose={() => setIsUsuarioModalOpen(false)} data={getDatosParaModal()} isViewingSelf={isViewingSelf} currentUserRole="Administrador" onSave={handleGuardarPerfilAjustado} checkNameExists={handleCheckNameDuplicate} onDownloadImage={() => { setDownloadModal({ isOpen: true, type: isViewingSelf ? 'general' : 'personal', targetUserId: usuarioActivo?.id }); setIsUsuarioModalOpen(false); }} />
      <DownloadScheduleModal isOpen={downloadModal.isOpen} onClose={() => setDownloadModal({ ...downloadModal, isOpen: false })} type={downloadModal.type} seccionName={seccionName} dias={dias} diaActivo={diaActivo} participantes={participantesEnriquecidos} targetUserId={downloadModal.targetUserId} />
      <ModalInputHorario isOpen={createShiftModal?.isOpen || false} onClose={() => setCreateShiftModal && setCreateShiftModal({ ...createShiftModal, isOpen: false })} defaultStart={createShiftModal?.defaultStart || '08:00'} defaultEnd={createShiftModal?.defaultEnd || '09:00'} onConfirm={confirmarCrearHorario} />
      <ModalAlertaChoque isOpen={clashModal?.isOpen || false} onClose={() => setClashModal && setClashModal({ ...clashModal, isOpen: false })} horarioNuevo={`${clashModal?.inicio} - ${clashModal?.fin}`} horarioCruzado={clashModal?.turnoCruzado || ''} onConfirm={() => confirmarCrearHorario(clashModal!.inicio, clashModal!.fin, true)} />
      <CroquisModal isOpen={showCroquis} onClose={() => setShowCroquis(false)} isAdmin={true} />

    </div>
  );
};

export default AdminPanel;
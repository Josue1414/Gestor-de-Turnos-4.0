/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { Calendar, ShieldCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { DiaEvento, Participante } from '../../types';
import { exportToExcel } from '../../utils/exportExcel';

import ModalInputHorario from '../../components/ModalInputHorario';
import ModalAlertaChoque from '../../components/ModalAlertaChoque';
import { useAdminLogic } from '../../hooks/useAdminLogic';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore'; // <-- AGREGADO getDoc AQUÍ
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
import CroquisModal, { type CroquisItem } from '../../components/CroquisModal';

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
  permissions?: { cajas?: boolean; horarios?: boolean; especiales?: boolean }; 
  [key: string]: unknown;
}

interface AdminPermissions {
  cajas: boolean;
  horarios: boolean;
  especiales: boolean;
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
    handleCrearCaja, handleCrearCajaEspecial, handleEliminarCaja, handleEliminarHorario,
    abrirEditor, handleSaveEdit, handleAbrirMiPerfil, handleAbrirPerfilParticipante,
    handleCheckNameDuplicate, createShiftModal, setCreateShiftModal, confirmarCrearHorario, clashModal, setClashModal
  } = useAdminLogic(eventoId || 'demo'); 

  const [deletePartModal, setDeletePartModal] = useState({ isOpen: false, id: '', nombre: '' });
  const [deleteEspecialModal, setDeleteEspecialModal] = useState({ isOpen: false, cajaId: '', turnoId: '' });
  const [showActions, setShowActions] = useState(false);
  const [currentAdminInfo, setCurrentAdminInfo] = useState<{name: string, org: string} | null>(null);
  const [croquisData, setCroquisData] = useState<CroquisItem[]>([]);

  const [adminPerms, setAdminPerms] = useState<AdminPermissions>({
    cajas: true, horarios: true, especiales: true
  });

  const statsActuales = calculateAdminStats(dias, participantesEnriquecidos as any);
  const turnosLibresCount = diaActual ? diaActual.cajas.reduce((acc, caja) => acc + caja.turnos.filter((t) => !t.participanteId).length, 0) : 0;
  const turnosOcupadosCount = diaActual ? diaActual.cajas.reduce((acc, caja) => acc + caja.turnos.filter((t) => Boolean(t.participanteId)).length, 0) : 0;

  useEffect(() => {
    if (!eventoId) return;
    const adminIdL = localStorage.getItem('current_admin_id');
    if (!adminIdL) return;
    
    // Escucha en tiempo real con onSnapshot
    const unsub = onSnapshot(doc(db, 'eventos', eventoId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const admins = (data.admins as AdminInDB[]) || [];
        const myAdmin = admins.find((a) => a.id === adminIdL);
        
        const globalPerms = data.globalPermissions || { cajas: true, horarios: true, especiales: true };

        if (myAdmin) {
          setCurrentAdminInfo({
            name: myAdmin.name || 'Administrador',
            org: myAdmin.organizationLabel && myAdmin.organization ? `${myAdmin.organizationLabel}: ${myAdmin.organization}` : myAdmin.organization || 'Sin organización asignada'
          });

          if (myAdmin.permissions) {
             setAdminPerms({
                cajas: (myAdmin.permissions.cajas ?? true) && globalPerms.cajas,
                horarios: (myAdmin.permissions.horarios ?? true) && globalPerms.horarios,
                especiales: (myAdmin.permissions.especiales ?? true) && globalPerms.especiales,
             });
          } else {
             setAdminPerms({
                cajas: globalPerms.cajas,
                horarios: globalPerms.horarios,
                especiales: globalPerms.especiales,
             });
          }
        }

        const listaCroquis: CroquisItem[] = [{ id: 'general', title: 'Croquis General del Evento', url: data.croquisUrl || null }];
        const croquisIndividual = data.croquisPorAdmin?.[adminIdL];
        if (croquisIndividual) {
          listaCroquis.push({ id: adminIdL, title: `Croquis Individual (${myAdmin?.name || 'Área'})`, url: croquisIndividual });
        }
        setCroquisData(listaCroquis);
      }
    }, (error) => {
        console.error("Error al escuchar cambios en permisos:", error);
    });

    return () => unsub();
  }, [eventoId]);

  const permisosEfectivos = isExternalViewer 
    ? { cajas: true, horarios: true, especiales: true } 
    : adminPerms;

  const parseTimeToMinutes = (t: string) => {
    if (!t) return 0;
    const clean = t.toUpperCase().replace(/ A /g, '-').trim();
    const [hStr, mStr] = clean.split(':');
    let h = parseInt(hStr.replace(/\D/g, '')) || 0;
    const m = parseInt((mStr || '0').replace(/\D/g, '')) || 0;
    if (clean.includes('PM') && h !== 12) h += 12;
    if (clean.includes('AM') && h === 12) h = 0;
    return h * 60 + m;
  };

  const checkChoque = (h1: string, h2: string) => {
    try {
      const r1 = h1.split('-');
      const r2 = h2.split('-');
      const i1 = parseTimeToMinutes(r1[0]);
      const f1 = r1.length > 1 ? parseTimeToMinutes(r1[1]) : i1 + 59;
      const i2 = parseTimeToMinutes(r2[0]);
      const f2 = r2.length > 1 ? parseTimeToMinutes(r2[1]) : i2 + 59;
      return i1 < f2 && i2 < f1;
    } catch { return false; }
  };

  const localBusyUserIds = useMemo(() => {
    if (!diaActual || !modalAsignacion.horario) return [];
    const busy = new Set<string>();
    const cajasArr = Array.isArray(diaActual.cajas) ? diaActual.cajas : Object.values(diaActual.cajas || {});

    cajasArr.forEach((c: any) => {
       const turnosArr = Array.isArray(c.turnos) ? c.turnos : Object.values(c.turnos || {});
       turnosArr.forEach((t: any) => {
          if (t.participanteId && checkChoque(t.horario, modalAsignacion.horario)) {
             busy.add(String(t.participanteId).trim());
          }
       });
    });
    return Array.from(busy);
  }, [diaActual, modalAsignacion.horario]);

  const checkIsEspecial = (c: any): boolean => {
    if (!c || typeof c !== 'object') return false;
    if (c.isEspecial === true || c.especial === true || c.tipo === 'especial') return true;
    if (typeof c.nombre === 'string') {
      const lowerName = c.nombre.toLowerCase();
      return lowerName.includes('especial') || lowerName.includes('vip');
    }
    return false;
  };

  const getSiguienteHorario = () => {
    const cajasArr = Array.isArray(diaActual?.cajas) ? diaActual.cajas : Object.values(diaActual?.cajas || {});
    const cajasNormales = cajasArr.filter(c => !checkIsEspecial(c));
    const horariosSet = new Set<string>();
    
    cajasNormales.forEach((c: any) => {
       const turnosArr = Array.isArray(c.turnos) ? c.turnos : Object.values(c.turnos || {});
       turnosArr.forEach((t: any) => horariosSet.add(t.horario));
    });
    
    const horarios = Array.from(horariosSet);
    if (horarios.length === 0) return { defaultStart: '08:00', defaultEnd: '09:00' };

    horarios.sort((a, b) => parseTimeToMinutes(a.split('-')[0]) - parseTimeToMinutes(b.split('-')[0]));

    const lastHorario = horarios[horarios.length - 1]; 
    const parts = lastHorario.split('-');
    if (parts.length === 2) {
       const startRaw = parts[1].trim();
       const cleanStr = (s: string) => {
          let [h, m] = s.replace(/[^\d:]/g, '').split(':').map(Number);
          if (s.toLowerCase().includes('pm') && h !== 12) h += 12;
          if (s.toLowerCase().includes('am') && h === 12) h = 0;
          return `${(h||0).toString().padStart(2, '0')}:${(m||0).toString().padStart(2, '0')}`;
       }
       const nextStart = cleanStr(startRaw);
       const [h, m] = nextStart.split(':').map(Number);
       const nextH = (h + 1 < 24 ? h + 1 : 0).toString().padStart(2, '0');
       const nextEnd = `${nextH}:${m.toString().padStart(2, '0')}`;
       
       return { defaultStart: nextStart, defaultEnd: nextEnd };
    }
    return { defaultStart: '08:00', defaultEnd: '09:00' };
  };

  const handleValidarCrearHorario = (inicio: string, fin: string) => {
    const startMins = parseTimeToMinutes(inicio);
    const endMins = parseTimeToMinutes(fin);

    if (endMins <= startMins) {
      alert("⚠️ Horario inválido: La hora de fin debe ser posterior a la hora de inicio. No se permiten horarios que crucen la medianoche hacia el día siguiente.");
      return;
    }

    const nuevoHorarioStr = `${inicio} - ${fin}`;
    const cajasArr = Array.isArray(diaActual?.cajas) ? diaActual.cajas : Object.values(diaActual?.cajas || {});
    const cajasNormales = cajasArr.filter(c => !checkIsEspecial(c));
    
    let turnoCruzado = '';
    const isDuplicateOrClash = cajasNormales.some((c: any) => {
      const turnosArr = Array.isArray(c.turnos) ? c.turnos : Object.values(c.turnos || {});
      return turnosArr.some((t: any) => {
        if (checkChoque(t.horario, nuevoHorarioStr)) {
          turnoCruzado = t.horario;
          return true;
        }
        return false;
      });
    });

    if (isDuplicateOrClash) {
      if (setCreateShiftModal) setCreateShiftModal({ isOpen: false, defaultStart: '', defaultEnd: '' });
      if (setClashModal) setClashModal({ isOpen: true, inicio, fin, turnoCruzado });
      return; 
    }

    if (confirmarCrearHorario) confirmarCrearHorario(inicio, fin);
    if (setCreateShiftModal) setCreateShiftModal({ isOpen: false, defaultStart: '', defaultEnd: '' });
  };

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
    } catch (error) { 
      console.error(error); 
    }
  };

  const handleDeleteTurnoEspecial = async (cajaId: string, turnoId: string) => {
    if (!diaActual || !eventoId) return;
    const nuevosDias = dias.map((d, i) => i === diaActivo ? {
      ...d, 
      cajas: d.cajas.map(c => c.id === cajaId ? { 
        ...c, 
        turnos: c.turnos.filter(t => t.id !== turnoId) 
      } : c)
    } : d);
    try {
      const adminIdL = localStorage.getItem('current_admin_id') || 'demo';
      await updateDoc(doc(db, 'eventos', eventoId), { [`diasPorAdmin.${adminIdL}`]: nuevosDias });
    } catch (error) { 
      console.error(error); 
    }
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
            ? { 
                ...p, 
                nombre: datosActualizados.name || p.nombre, 
                telefono: datosActualizados.phone || '', 
                codigoPais: datosActualizados.countryCode || '+52', 
                notas: datosActualizados.notes || '',
                organizacion: datosActualizados.organization || '', 
                organizationLabel: nuevaEtiqueta,
                fechaNacimiento: datosActualizados.birthDate || '' 
              } : { ...p, organizationLabel: nuevaEtiqueta }
        );
        updatePayload[`participantesPorAdmin.${adminIdL}`] = actualizados;
        
      } else if (datosActualizados.role === 'Administrador' || datosActualizados.role === 'SuperAdmin') {
        const admins: AdminInDB[] = data.admins || [];
        const actualizadosAdmins = admins.map((a) => 
          a.id === datosActualizados.id 
            ? { 
                ...a, 
                name: datosActualizados.name, 
                phone: datosActualizados.phone || '', 
                countryCode: datosActualizados.countryCode || '+52', 
                notes: datosActualizados.notes || '',
                organization: datosActualizados.organization || '', 
                organizationLabel: nuevaEtiqueta 
              } : a
        );
        const participantesDelAdmin: ParticipanteExtendidoDb[] = data.participantesPorAdmin?.[adminIdL] || [];
        updatePayload['admins'] = actualizadosAdmins;
        updatePayload[`participantesPorAdmin.${adminIdL}`] = participantesDelAdmin.map(p => ({...p, organizationLabel: nuevaEtiqueta}));
        
        if (datosActualizados.id === adminIdL) {
          setCurrentAdminInfo({ 
            name: datosActualizados.name, 
            org: datosActualizados.organization ? `${nuevaEtiqueta}: ${datosActualizados.organization}` : 'Sin organización' 
          });
        }
      }
      await updateDoc(docRef, updatePayload);
      setIsUsuarioModalOpen(false); 
    } catch (error) { 
      console.error(error); 
    }
  };

  const getDatosParaModal = (): UsuarioModalData | null => {
    if (!usuarioActivo) return null;
    if (usuarioActivo.role === 'Participante') {
      const p = participantesEnriquecidos.find(x => x.id === usuarioActivo.id) as ParticipanteExtendidoDb | undefined;
      return {
        id: usuarioActivo.id, 
        name: p?.nombre || usuarioActivo.name, 
        role: 'Participante',
        phone: p?.telefono || '', 
        countryCode: p?.codigoPais || '+52', 
        supportArea: usuarioActivo.supportArea || '',
        notes: p?.notas || '', 
        organization: p?.organizacion || '', 
        organizationLabel: p?.organizationLabel || 'Congregación',
        ubicaciones: p?.ubicaciones || [], 
        birthDate: p?.fechaNacimiento || '' 
      };
    }
    const a = usuarioActivo as unknown as AdminInDB;
    return {
      id: usuarioActivo.id, 
      name: a.name || usuarioActivo.name, 
      role: usuarioActivo.role,
      phone: a.phone || '', 
      countryCode: a.countryCode || '+52', 
      supportArea: a.supportArea || '',
      notes: a.notes || '', 
      organization: a.organization || '', 
      organizationLabel: a.organizationLabel || 'Congregación', 
      ubicaciones: []
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
    try { 
      await updateDoc(doc(db, 'eventos', eventoId), { nombre: seccionName.trim() }); 
    } catch (error) { 
      console.error(error); 
    }
  };

  const handleExportExcel = () => {
    exportToExcel(
      seccionName || 'Evento', 
      dias as any, 
      participantesEnriquecidos as any, 
      statsActuales, 
      currentAdminInfo
    );
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
    <div className="h-[100dvh] w-full overflow-auto bg-slate-100 font-sans flex flex-col relative">
      
      <div className="sticky left-0 w-[100vw] max-w-[100vw] px-2 sm:px-6 pt-2 sm:pt-6 shrink-0 z-10 box-border">
        <div className="w-full max-w-[1400px] mx-auto">
          <AdminHeader 
            seccionName={seccionName} 
            setSeccionName={setSeccionName} 
            isEditingTitle={isEditingTitle} 
            setIsEditingTitle={setIsEditingTitle} 
            onOpenProfile={handleAbrirMiPerfil} 
            onSave={handleSaveEventName} 
            onShowCroquis={() => setShowCroquis(true)} 
            onBack={isExternalViewer ? handleBack : undefined} 
            onLogout={!isExternalViewer ? handleLogout : undefined} 
            onShowDirectorio={() => setShowDirectorio(true)} 
            participantesCount={participantesEnriquecidos.length} 
            onToggleActions={() => setShowActions(prev => !prev)} 
            showActions={showActions}
            onCrearCajaEspecial={() => setShowSpecialModal(true)} 
            onCrearCaja={handleCrearCaja} 
            
            onCrearHorario={() => {
              if (setCreateShiftModal) {
                 const { defaultStart, defaultEnd } = getSiguienteHorario();
                 setCreateShiftModal({ isOpen: true, defaultStart, defaultEnd });
              }
            }} 

            onDownloadTabla={() => setDownloadModal({ isOpen: true, type: 'general' })}
            isSuperAdminViewing={isExternalViewer} 
            adminInfo={currentAdminInfo} 
            onExportExcel={handleExportExcel} 
            stats={statsActuales}
            adminPerms={permisosEfectivos}
          />
        </div>
      </div>

      <div className="sticky top-0 left-0 z-50 w-[100vw] max-w-[100vw] bg-slate-100 h-[60px] flex items-center shadow-sm border-b border-slate-200 px-2 sm:px-6 shrink-0 box-border mt-2">
        <div className="w-full max-w-[1400px] mx-auto flex gap-2 overflow-x-auto no-scrollbar items-center h-full">
          {dias.map((dia, idx) => (
            <button 
              key={dia.id} 
              onClick={() => setDiaActivo(idx)} 
              className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 ${diaActivo === idx ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 text-[10px]'}`}
            >
              <Calendar size={14} /> {dia.nombreDia}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 sm:px-6 min-w-max pb-10 flex flex-col z-0 overflow-visible bg-transparent rounded-none sm:rounded-2xl border-none sm:border border-transparent mb-0 sm:mb-4">
         <MatrizTurnos 
            diaActual={diaActual} 
            getParticipante={getParticipante} 
            onAsignar={abrirModalAsignacion} 
            onQuitar={quitarParticipante}
            onCrearCaja={handleCrearCaja} 
            onDeleteCaja={handleEliminarCaja} 
            onDeleteHorario={handleEliminarHorario}
            onEditCaja={(id) => { const caja = diaActual.cajas.find(c => c.id === id); if (caja) abrirEditor('caja', id, caja.nombre as string); }}
            onEditHorario={(horario) => abrirEditor('horario', horario, horario)}
            onDeleteTurnoEspecial={(cajaId, turnoId) => setDeleteEspecialModal({ isOpen: true, cajaId, turnoId })}
            onEditTurnoEspecial={(cajaId: string, turnoId: string) => console.log("Editar:", cajaId, turnoId)} 
            adminPerms={permisosEfectivos} 
          />
      </div>

      {/* --- MODALS --- */}
      <AssignUserModal 
        isOpen={modalAsignacion.isOpen} 
        onClose={cerrarModalAsignacion} 
        horario={modalAsignacion.horario} 
        cajaNombre={modalAsignacion.cajaNombre} 
        participantes={participantesEnriquecidos} 
        busyUserIds={localBusyUserIds} 
        onAssign={asignarUsuarioExistente} 
        onCreateAndAssign={crearYAsignarUsuario} 
      />
      
      <ParticipantDrawer 
        isOpen={showDirectorio} 
        onClose={() => setShowDirectorio(false)} 
        participantes={participantesEnriquecidos} 
        currentUserRole="Administrador" 
        onEditParticipante={handleAbrirPerfilParticipante} 
        onDeleteParticipante={(id, nombre) => setDeletePartModal({ isOpen: true, id, nombre })} 
        eventoId={eventoId} 
        adminId={localStorage.getItem('current_admin_id') || 'demo'} 
        turnosLibresCount={turnosLibresCount}
        turnosOcupadosCount={turnosOcupadosCount}
      />
      
      <EditNameModal 
        isOpen={editModal.isOpen && editModal.type === 'caja'} 
        title={editModal.title} 
        initialValue={editModal.initialValue} 
        label={editModal.label} 
        onClose={() => setEditModal({...editModal, isOpen: false})} 
        onSave={handleSaveEdit} 
      />
      
      <SpecialBoxModal 
        isOpen={showSpecialModal} 
        onClose={() => setShowSpecialModal(false)} 
        onCreate={handleCrearCajaEspecial} 
      />
      
      <CountdownDeleteModal 
        isOpen={deletePartModal.isOpen} 
        onClose={() => setDeletePartModal({ isOpen: false, id: '', nombre: '' })} 
        onConfirm={handleConfirmDeleteParticipante} 
        title={deletePartModal.nombre} 
        message="Se eliminará su perfil y se liberarán todos los turnos que tenía asignados." 
      />
      
      <CountdownDeleteModal 
        isOpen={deleteEspecialModal.isOpen} 
        onClose={() => setDeleteEspecialModal({ isOpen: false, cajaId: '', turnoId: '' })} 
        onConfirm={() => { handleDeleteTurnoEspecial(deleteEspecialModal.cajaId, deleteEspecialModal.turnoId); setDeleteEspecialModal({ isOpen: false, cajaId: '', turnoId: '' }); }} 
        title="Eliminar Horario Especial" 
        message="Se eliminará este bloque de horario." 
      />
      
      <ModalInfoUsuario 
        isOpen={isUsuarioModalOpen} 
        onClose={() => setIsUsuarioModalOpen(false)} 
        data={getDatosParaModal()} 
        isViewingSelf={isViewingSelf} 
        currentUserRole="Administrador" 
        onSave={handleGuardarPerfilAjustado} 
        checkNameExists={handleCheckNameDuplicate} 
        onDownloadImage={() => { setDownloadModal({ isOpen: true, type: isViewingSelf ? 'general' : 'personal', targetUserId: usuarioActivo?.id }); setIsUsuarioModalOpen(false); }} 
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
      
      <ModalInputHorario 
        isOpen={createShiftModal?.isOpen || false} 
        onClose={() => setCreateShiftModal && setCreateShiftModal({ ...createShiftModal, isOpen: false })} 
        defaultStart={createShiftModal?.defaultStart || '08:00'} 
        defaultEnd={createShiftModal?.defaultEnd || '09:00'} 
        onConfirm={handleValidarCrearHorario} 
      />
      
      <ModalAlertaChoque 
        isOpen={clashModal?.isOpen || false} 
        onClose={() => setClashModal && setClashModal({ ...clashModal, isOpen: false })} 
        horarioNuevo={`${clashModal?.inicio} - ${clashModal?.fin}`} 
        horarioCruzado={clashModal?.turnoCruzado || ''} 
      />
      
      <CroquisModal 
        isOpen={showCroquis} 
        onClose={() => setShowCroquis(false)} 
        canEdit={false} 
        croquis={croquisData} 
        onSaveCroquis={async () => Promise.resolve()} 
      />

    </div>
  );
};

export default AdminPanel;
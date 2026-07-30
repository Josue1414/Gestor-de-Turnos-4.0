// src/views/Admin/AdminPanel.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { Calendar, ShieldCheck, LayoutGrid, LayoutList } from 'lucide-react'; 
import { useNavigate, useParams } from 'react-router-dom';
import type { DiaEvento, Participante } from '../../types';
import { exportToExcel } from '../../utils/exportExcel';

import { useAdminLogic } from '../../hooks/useAdminLogic';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore'; 
import { db } from '../../firebase';

import MatrizTurnos from '../../components/MatrizTurnos';
import VistaTarjetasCajas from '../../components/VistaTarjetasCajas'; 
import AdminHeader from '../../components/AdminHeader';
import type { UsuarioModalData } from '../../components/ModalInfoUsuario';
import type { CroquisItem } from '../../components/CroquisModal';

import { getLocalBusyUserIds, getSiguienteHorario, validarNuevoHorario } from './AdminPanelFunciones';
import AdminPanelModals from './AdminPanelModals';

import { useEventStats } from '../../hooks/useEventStats';

interface ParticipanteExtendidoDb extends Participante {
  telefono?: string; 
  codigoPais?: string; 
  notas?: string;
  organizacion?: string; 
  organizationLabel?: string;
  ubicaciones?: string[]; 
  fechaNacimiento?: string;
  capitanAsignado?: string;
  capitanId?: string;
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
  diasAsignados?: string[]; 
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
    handleCheckNameDuplicate, createShiftModal, setCreateShiftModal, confirmarCrearHorario, clashModal, setClashModal,
    capitanes, handleCrearCapitan, handleEliminarCapitan, handleEditarCapitan,
    isCapitan, cajasAsignadasCapitan, actualizarEstadoTurno, resolverAlerta
  } = useAdminLogic(eventoId || 'demo'); 

  const [deletePartModal, setDeletePartModal] = useState({ isOpen: false, id: '', nombre: '' });
  const [deleteEspecialModal, setDeleteEspecialModal] = useState({ isOpen: false, cajaId: '', turnoId: '' });
  const [showActions, setShowActions] = useState(false);
  const [croquisData, setCroquisData] = useState<CroquisItem[]>([]);
  
  const [showCapitanModal, setShowCapitanModal] = useState(false);
  const [showSeccionCapitanes, setShowSeccionCapitanes] = useState(false);
  const [currentAdminInfo, setCurrentAdminInfo] = useState<{name: string, org: string, diasAsignados?: string[]} | null>(null);
  const [adminPerms, setAdminPerms] = useState<AdminPermissions>({ cajas: true, horarios: true, especiales: true });
  const [vistaTarjetas, setVistaTarjetas] = useState(false);

  useEffect(() => {
    if (!eventoId) return;
    const adminIdL = localStorage.getItem('current_admin_id');
    const capitanIdL = localStorage.getItem('current_capitan_id');
    if (!adminIdL) return;
    
    const unsub = onSnapshot(doc(db, 'eventos', eventoId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const admins = (data.admins as AdminInDB[]) || [];
        const myAdmin = admins.find((a) => a.id === adminIdL);
        const globalPerms = data.globalPermissions || { cajas: true, horarios: true, especiales: true };

        let nombreDisplay = 'Administrador';
        let orgDisplay = '';
        let diasReales: string[] | undefined = myAdmin?.diasAsignados;

        if (isCapitan && capitanIdL) {
            const capitanesDelAdmin = data.capitanesPorAdmin?.[adminIdL] || [];
            const miCapitan = capitanesDelAdmin.find((c: any) => c.id === capitanIdL);
            if (miCapitan) {
                nombreDisplay = `${miCapitan.nombre} (Admin: ${myAdmin?.name || 'General'})`;
                orgDisplay = miCapitan.organizacion ? (miCapitan.organizationLabel ? `${miCapitan.organizationLabel}: ${miCapitan.organizacion}` : miCapitan.organizacion) : '';
                diasReales = miCapitan.diasAsignados;
            }
        } else if (myAdmin) {
            nombreDisplay = myAdmin.name || 'Administrador';
            orgDisplay = myAdmin.organizationLabel && myAdmin.organization ? `${myAdmin.organizationLabel}: ${myAdmin.organization}` : myAdmin.organization || 'Sin organización asignada';
        }

        if (myAdmin) {
          setCurrentAdminInfo({
            name: nombreDisplay,
            org: orgDisplay,
            diasAsignados: diasReales 
          });

          if (myAdmin.permissions) {
             setAdminPerms({
                cajas: (myAdmin.permissions.cajas ?? true) && globalPerms.cajas,
                horarios: (myAdmin.permissions.horarios ?? true) && globalPerms.horarios,
                especiales: (myAdmin.permissions.especiales ?? true) && globalPerms.especiales,
             });
          } else {
             setAdminPerms({ cajas: globalPerms.cajas, horarios: globalPerms.horarios, especiales: globalPerms.especiales });
          }
        }

        const listaCroquis: CroquisItem[] = [{ id: 'general', title: 'Croquis General del Evento', url: data.croquisUrl || null }];
        const croquisIndividual = data.croquisPorAdmin?.[adminIdL];
        if (croquisIndividual) listaCroquis.push({ id: adminIdL, title: `Croquis Individual (${myAdmin?.name || 'Área'})`, url: croquisIndividual });
        setCroquisData(listaCroquis);
      }
    });

    return () => unsub();
  }, [eventoId, isCapitan]);

  const diasPermitidos = useMemo(() => {
    if (!currentAdminInfo) return [];
    if (currentAdminInfo.diasAsignados === undefined) return dias;
    return dias.filter(d => 
      currentAdminInfo.diasAsignados!.includes(d.nombreDia) || 
      currentAdminInfo.diasAsignados!.includes(d.id)
    );
  }, [dias, currentAdminInfo]);

  const diasFiltrados = useMemo(() => {
    if (!isCapitan) return diasPermitidos;
    return diasPermitidos.map(d => ({
      ...d,
      cajas: d.cajas.filter(c => cajasAsignadasCapitan.includes(c.id))
    }));
  }, [diasPermitidos, isCapitan, cajasAsignadasCapitan]);

  const diaActualFiltrado = diasFiltrados.find(d => d.id === dias[diaActivo]?.id) || null;

  const alertasAsistencia = useMemo(() => {
    const alertas: { dia: string; cajaId: string; cajaNombre: string; turnoId: string; horario: string; participante: string }[] = [];
    
    diasFiltrados.forEach(dia => {
      dia.cajas.forEach(caja => {
        const turnos = Array.isArray(caja.turnos) ? caja.turnos : (caja.turnos ? Object.values(caja.turnos) : []);
        
        turnos.forEach((turno: any) => {
          if (turno.solicitaAsistencia) {
            // Código corregido
            // Le decimos a TypeScript que p y part son del tipo ParticipanteExtendidoDb
            const part = participantesEnriquecidos.find((p: any) => p.id === turno.participanteId) as ParticipanteExtendidoDb | undefined;

            // FILTRO DE PERTENENCIA: Si es capitán, validar que el participante sea de su equipo
            if (isCapitan) {
              const capitanIdL = localStorage.getItem('current_capitan_id');
              // Ahora TypeScript sabe que 'part' puede tener un 'capitanId'
              if (part && part.capitanId !== capitanIdL) return; // Se omite si pertenece a otro
            }
            
            alertas.push({
              dia: dia.nombreDia,
              cajaId: caja.id,
              cajaNombre: caja.nombre as string,
              turnoId: turno.id,
              horario: turno.horario,
              participante: part?.nombre || 'Desconocido'
            });
          }
        });
      });
    });
    return alertas;
  }, [diasFiltrados, participantesEnriquecidos, isCapitan]);

  useEffect(() => {
    if (diasFiltrados.length > 0 && dias.length > 0) {
      const currentDia = dias[diaActivo];
      if (!currentDia || !diasFiltrados.find(d => d.id === currentDia.id)) {
        const firstAllowedIndex = dias.findIndex(d => d.id === diasFiltrados[0].id);
        if (firstAllowedIndex !== -1) setDiaActivo(firstAllowedIndex);
      }
    }
  }, [diasFiltrados, diaActivo, dias, setDiaActivo]);

  const listadoDiasDisponibles = useMemo(() => {
    return diasPermitidos.map(d => ({ id: d.id, nombreDia: d.nombreDia }));
  }, [diasPermitidos]);

  const cajasTotalesParaCapitanes = useMemo(() => {
    if (!diasPermitidos) return [];
    return diasPermitidos.flatMap(dia => 
      dia.cajas.map(caja => ({ id: caja.id, nombre: `${caja.nombre} (${dia.nombreDia})`, diaId: dia.id }))
    );
  }, [diasPermitidos]);

  const cajasLibresParaCrear = useMemo(() => {
    if (!capitanes) return cajasTotalesParaCapitanes;
    const cajasEnUso = capitanes.flatMap((c: any) => c.cajasAsignadas || []);
    return cajasTotalesParaCapitanes.filter(c => !cajasEnUso.includes(c.id));
  }, [cajasTotalesParaCapitanes, capitanes]);

  const permisosEfectivos = isCapitan ? { cajas: false, horarios: false, especiales: false } : isExternalViewer ? { cajas: true, horarios: true, especiales: true } : adminPerms;
  
  // Implementación del nuevo hook con los datos ya filtrados por vista
  const statsActuales = useEventStats(diasFiltrados, participantesEnriquecidos);
  
  const turnosLibresCount = diaActualFiltrado ? diaActualFiltrado.cajas.reduce((acc, caja) => acc + caja.turnos.filter((t) => !t.participanteId).length, 0) : 0;
  const turnosOcupadosCount = diaActualFiltrado ? diaActualFiltrado.cajas.reduce((acc, caja) => acc + caja.turnos.filter((t) => Boolean(t.participanteId)).length, 0) : 0;
  const localBusyUserIds = useMemo(() => getLocalBusyUserIds(diaActual, modalAsignacion.horario || ''), [diaActual, modalAsignacion.horario]);
  
  const handleValidarCrearHorario = (inicio: string, fin: string) => {
    const validacion = validarNuevoHorario(inicio, fin, diaActual);
    if (validacion.error) { alert(validacion.error); return; }
    if (validacion.clash) {
      if (setCreateShiftModal) setCreateShiftModal({ isOpen: false, defaultStart: '', defaultEnd: '' });
      if (setClashModal) setClashModal({ isOpen: true, inicio, fin, turnoCruzado: validacion.turnoCruzado || '' });
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

      await updateDoc(docRef, { [`participantesPorAdmin.${adminIdL}`]: participantesFiltrados, [`diasPorAdmin.${adminIdL}`]: diasLimpios });
    } catch (error) { console.error(error); }
  };

  const handleDeleteTurnoEspecial = async (cajaId: string, turnoId: string) => {
    if (!diaActual || !eventoId) return;
    const nuevosDias = dias.map((d, i) => i === diaActivo ? { ...d, cajas: d.cajas.map(c => c.id === cajaId ? { ...c, turnos: c.turnos.filter(t => t.id !== turnoId) } : c) } : d);
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
      const capitanIdL = localStorage.getItem('current_capitan_id');
      const nuevaEtiqueta = datosActualizados.organizationLabel || 'Congregación';
      const updatePayload: Record<string, unknown> = {};

      if (datosActualizados.role === 'Participante') {
        const participantesDelCapitan = data.participantesPorCapitan?.[capitanIdL as string] || [];
        const creadoPorMiCapitan = participantesDelCapitan.some((p: any) => p.id === datosActualizados.id);
        
        const belongsToCapitan = isCapitan && creadoPorMiCapitan;
        
        const targetProperty = belongsToCapitan ? 'participantesPorCapitan' : 'participantesPorAdmin';
        const finalTargetId = belongsToCapitan ? capitanIdL : adminIdL;
        
        const participantesBase: ParticipanteExtendidoDb[] = data[targetProperty]?.[finalTargetId as string] || [];
        const actualizados = participantesBase.map((p) => 
          p.id === datosActualizados.id ? { 
            ...p, 
            nombre: datosActualizados.name || p.nombre, 
            telefono: datosActualizados.phone || '', 
            codigoPais: datosActualizados.countryCode || '+52', 
            notas: datosActualizados.notes || '', 
            organizacion: datosActualizados.organization || '', 
            organizationLabel: nuevaEtiqueta, 
            fechaNacimiento: datosActualizados.birthDate || '' 
          } : p
        );
        updatePayload[`${targetProperty}.${finalTargetId}`] = actualizados;
        
      } else if ((datosActualizados.role as string) === 'Capitan' && isCapitan) {
        const capitanesList = data.capitanesPorAdmin?.[adminIdL] || [];
        const actualizadosCapitanes = capitanesList.map((c: any) => c.id === capitanIdL ? { 
            ...c, 
            nombre: datosActualizados.name,
            telefono: datosActualizados.phone || '',
            codigoPais: datosActualizados.countryCode || '+52',
            organizacion: datosActualizados.organization || '',
            organizationLabel: nuevaEtiqueta 
        } : c);
        updatePayload[`capitanesPorAdmin.${adminIdL}`] = actualizadosCapitanes;

      } else if (datosActualizados.role === 'Administrador' || datosActualizados.role === 'SuperAdmin') {
        const admins: AdminInDB[] = data.admins || [];
        const actualizadosAdmins = admins.map((a) => a.id === datosActualizados.id ? { ...a, name: datosActualizados.name, phone: datosActualizados.phone || '', countryCode: datosActualizados.countryCode || '+52', notes: datosActualizados.notes || '', organization: datosActualizados.organization || '', organizationLabel: nuevaEtiqueta } : a);
        const participantesDelAdmin: ParticipanteExtendidoDb[] = data.participantesPorAdmin?.[adminIdL] || [];
        updatePayload['admins'] = actualizadosAdmins;
        updatePayload[`participantesPorAdmin.${adminIdL}`] = participantesDelAdmin.map(p => ({...p, organizationLabel: nuevaEtiqueta}));
      }
      await updateDoc(docRef, updatePayload);
      setIsUsuarioModalOpen(false); 
    } catch (error) { console.error(error); }
  };

  const getDatosParaModal = (): UsuarioModalData | null => {
    if (!usuarioActivo) return null;

    if (isCapitan && usuarioActivo.role === 'Capitan') {
      const capitanIdL = localStorage.getItem('current_capitan_id');
      const miCapitan = capitanes.find((c: any) => c.id === capitanIdL);
      return { 
        id: capitanIdL as string, 
        name: miCapitan?.nombre || 'Capitán', 
        role: 'Capitan', 
        phone: miCapitan?.telefono || '', 
        countryCode: miCapitan?.codigoPais || '+52', 
        supportArea: 'Gestión de Cajas', 
        notes: '', 
        organization: miCapitan?.organizacion || '', 
        organizationLabel: miCapitan?.organizationLabel || 'Congregación', 
        ubicaciones: [] 
      };
    }

    if (usuarioActivo.role === 'Participante') {
      const p = participantesEnriquecidos.find(x => x.id === usuarioActivo.id) as ParticipanteExtendidoDb | undefined;
      return { id: usuarioActivo.id, name: p?.nombre || usuarioActivo.name, role: 'Participante', phone: p?.telefono || '', countryCode: p?.codigoPais || '+52', supportArea: usuarioActivo.supportArea || '', notes: p?.notas || '', organization: p?.organizacion || '', organizationLabel: p?.organizationLabel || 'Congregación', ubicaciones: p?.ubicaciones || [], birthDate: p?.fechaNacimiento || '' };
    }
    const a = usuarioActivo as unknown as AdminInDB;
    return { id: usuarioActivo.id, name: a.name || usuarioActivo.name, role: usuarioActivo.role as any, phone: a.phone || '', countryCode: a.countryCode || '+52', supportArea: a.supportArea || '', notes: a.notes || '', organization: a.organization || '', organizationLabel: a.organizationLabel || 'Congregación', ubicaciones: [] };
  };

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_admin_id');
    localStorage.removeItem('current_capitan_id');
    localStorage.removeItem('simulando_capitan');
    sessionStorage.removeItem('visor_externo_tipo');
    navigate('/');
  };

  const handleSimularCapitan = (capitanId: string) => {
    localStorage.setItem('user_role', 'capitan');
    localStorage.setItem('current_capitan_id', capitanId);
    localStorage.setItem('simulando_capitan', 'true');
    window.location.reload();
  };

  const handleBack = () => {
    if (localStorage.getItem('simulando_capitan') === 'true') {
      if (visorTipo === 'SuperAdmin') {
        localStorage.setItem('user_role', 'superadmin');
      } else if (visorTipo === 'Supervisor') {
        localStorage.setItem('user_role', 'supervisor');
      } else {
        localStorage.setItem('user_role', 'admin');
      }
      
      localStorage.removeItem('current_capitan_id');
      localStorage.removeItem('simulando_capitan');
      window.location.reload();
      return;
    }

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

  const handleExportExcel = () => {
    exportToExcel(
      seccionName || 'Evento', 
      diasFiltrados as any, 
      participantesEnriquecidos as any, 
      statsActuales, 
      currentAdminInfo,
      capitanes, 
      isCapitan 
    );
  };

  const currentCapitan = isCapitan ? capitanes.find((c: any) => c.id === localStorage.getItem('current_capitan_id')) : null;
  const customInviteLink = currentCapitan ? currentCapitan.linkUnico : undefined;

  if (loading || !currentAdminInfo) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck size={48} className="text-blue-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-black text-slate-700">Conectando...</h2>
      </div>
    );
  }

  if (diasFiltrados.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-black text-slate-700">No tienes acceso a ningún día o caja</h2>
        {localStorage.getItem('simulando_capitan') === 'true' ? (
           <button onClick={handleBack} className="mt-4 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold shadow-md hover:bg-slate-700 transition">Dejar de Simular</button>
        ) : (
           <button onClick={handleLogout} className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 transition">Cerrar Sesión</button>
        )}
      </div>
    );
  }

  if (!diaActualFiltrado) return null;

  return (
    <div className="h-[100dvh] w-full overflow-auto bg-slate-100 font-sans flex flex-col relative">
      <div className="sticky left-0 w-[100vw] max-w-[100vw] px-2 sm:px-6 pt-2 sm:pt-6 shrink-0 z-[60] box-border">
        <div className="w-full max-w-[1400px] mx-auto">
          <AdminHeader 
            seccionName={seccionName} setSeccionName={setSeccionName} 
            isEditingTitle={isEditingTitle} setIsEditingTitle={setIsEditingTitle} 
            onOpenProfile={handleAbrirMiPerfil} 
            onSave={isCapitan ? undefined : (handleSaveEventName as any)} 
            onShowCroquis={() => setShowCroquis(true)} 
            onBack={isExternalViewer || localStorage.getItem('simulando_capitan') === 'true' ? handleBack : undefined} 
            onLogout={!isExternalViewer && localStorage.getItem('simulando_capitan') !== 'true' ? handleLogout : undefined} 
            onShowDirectorio={() => setShowDirectorio(true)} 
            participantesCount={participantesEnriquecidos.length} 
            onToggleActions={() => setShowActions(prev => !prev)} 
            showActions={showActions} 
            onCrearCajaEspecial={!isCapitan ? () => setShowSpecialModal(true) : undefined} 
            onCrearCaja={!isCapitan ? handleCrearCaja : undefined} 
            onCrearHorario={!isCapitan ? () => {
              if (setCreateShiftModal) {
                 const { defaultStart, defaultEnd } = getSiguienteHorario(diaActual);
                 setCreateShiftModal({ isOpen: true, defaultStart, defaultEnd });
              }
            } : undefined} 
            onDownloadTabla={() => setDownloadModal({ isOpen: true, type: 'general' })}
            isSuperAdminViewing={isExternalViewer} adminInfo={currentAdminInfo} onExportExcel={handleExportExcel} stats={statsActuales} adminPerms={permisosEfectivos}
            isCapitan={isCapitan}
            
            showCapitanes={showSeccionCapitanes} onToggleCapitanes={() => setShowSeccionCapitanes(!showSeccionCapitanes)} capitanes={capitanes || []} onOpenCapitanModal={() => setShowCapitanModal(true)} onDeleteCapitan={handleEliminarCapitan} onSimularCapitan={handleSimularCapitan} dias={diasFiltrados}
            
            diasDisponibles={listadoDiasDisponibles} 
            participantes={participantesEnriquecidos}
            cajasDisponibles={cajasTotalesParaCapitanes} 
            onEditCapitan={handleEditarCapitan}
            
            alertasAsistencia={alertasAsistencia}
            onResolveAlert={resolverAlerta}
          />
        </div>
      </div>

      <div className="sticky top-0 left-0 z-50 w-[100vw] max-w-[100vw] bg-slate-100 h-[60px] flex items-center shadow-sm border-b border-slate-200 px-2 sm:px-6 shrink-0 box-border mt-2">
        <div className="w-full max-w-[1400px] mx-auto flex gap-2 overflow-x-auto no-scrollbar items-center h-full">
          {diasFiltrados.map((dia) => {
            const originalIndex = dias.findIndex(d => d.id === dia.id);
            return (
              <button key={dia.id} onClick={() => setDiaActivo(originalIndex)} className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 ${diaActivo === originalIndex ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 text-[10px]'}`}>
                <Calendar size={14} /> {dia.nombreDia}
              </button>
            )
          })}
        </div>
      </div>

      <div className={`px-2 sm:px-6 pb-10 flex flex-col z-0 overflow-visible bg-transparent rounded-none sm:rounded-2xl border-none sm:border border-transparent mb-0 sm:mb-4 ${vistaTarjetas ? 'w-full' : 'min-w-max'}`}>
         
         <div className="w-full max-w-[1400px] mx-auto mt-2 mb-4 flex justify-start">
            <div className="bg-slate-200/70 p-1 rounded-xl flex items-center">
              <button 
                onClick={() => setVistaTarjetas(false)} 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${!vistaTarjetas ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LayoutList size={16} /> Tabla
              </button>
              <button 
                onClick={() => setVistaTarjetas(true)} 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${vistaTarjetas ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LayoutGrid size={16} /> Tarjetas
              </button>
            </div>
         </div>

         {/* PASAMOS onResolveAlert A LAS VISTAS */}
         {vistaTarjetas ? (
           <VistaTarjetasCajas 
             diaActual={diaActualFiltrado} 
             onActualizarEstadoTurno={actualizarEstadoTurno} 
             onResolveAlert={resolverAlerta} // <-- AQUÍ SE PASA A LAS TARJETAS
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
         ) : (
           <MatrizTurnos 
             diaActual={diaActualFiltrado} 
             onActualizarEstadoTurno={actualizarEstadoTurno} 
             onResolveAlert={resolverAlerta} // <-- AQUÍ SE PASA A LA MATRIZ
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
         )}
      </div>

      <AdminPanelModals 
        modalAsignacion={modalAsignacion} cerrarModalAsignacion={cerrarModalAsignacion} participantesEnriquecidos={participantesEnriquecidos} localBusyUserIds={localBusyUserIds} asignarUsuarioExistente={asignarUsuarioExistente} crearYAsignarUsuario={crearYAsignarUsuario}
        showDirectorio={showDirectorio} setShowDirectorio={setShowDirectorio} handleAbrirPerfilParticipante={handleAbrirPerfilParticipante} setDeletePartModal={setDeletePartModal} eventoId={eventoId} turnosLibresCount={turnosLibresCount} turnosOcupadosCount={turnosOcupadosCount}
        editModal={editModal} setEditModal={setEditModal} handleSaveEdit={handleSaveEdit}
        showSpecialModal={showSpecialModal} setShowSpecialModal={setShowSpecialModal} handleCrearCajaEspecial={handleCrearCajaEspecial}
        deletePartModal={deletePartModal} handleConfirmDeleteParticipante={handleConfirmDeleteParticipante}
        deleteEspecialModal={deleteEspecialModal} setDeleteEspecialModal={setDeleteEspecialModal} handleDeleteTurnoEspecial={handleDeleteTurnoEspecial}
        isUsuarioModalOpen={isUsuarioModalOpen} setIsUsuarioModalOpen={setIsUsuarioModalOpen} getDatosParaModal={getDatosParaModal} isViewingSelf={isViewingSelf} handleGuardarPerfilAjustado={handleGuardarPerfilAjustado} handleCheckNameDuplicate={handleCheckNameDuplicate} setDownloadModal={setDownloadModal} usuarioActivo={usuarioActivo}
        downloadModal={downloadModal} seccionName={seccionName} dias={diasFiltrados} diaActivo={diaActivo}
        createShiftModal={createShiftModal} setCreateShiftModal={setCreateShiftModal} handleValidarCrearHorario={handleValidarCrearHorario}
        clashModal={clashModal} setClashModal={setClashModal} showCroquis={showCroquis} setShowCroquis={setShowCroquis} croquisData={croquisData}
        showCapitanModal={showCapitanModal} setShowCapitanModal={setShowCapitanModal} 
        
        cajasDisponibles={cajasLibresParaCrear} 
        diasDisponibles={listadoDiasDisponibles}

        handleCrearCapitan={handleCrearCapitan}
        isCapitan={isCapitan} customInviteLink={customInviteLink} 
      />
    </div>
  );
};

export default AdminPanel;
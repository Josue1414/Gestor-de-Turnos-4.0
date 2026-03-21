import { useState, useEffect } from 'react';
import type { DiaEvento, Participante } from '../types';
import { isNameDuplicate } from '../utils/validations';

const hayChoqueDeHorario = (rango1: string, rango2: string) => {
  try {
    const [inicio1, fin1] = rango1.split('-').map(t => t.trim());
    const [inicio2, fin2] = rango2.split('-').map(t => t.trim());
    const aMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
    const i1 = aMin(inicio1), f1 = aMin(fin1);
    const i2 = aMin(inicio2), f2 = aMin(fin2);
    return i1 < f2 && i2 < f1;
  } catch (e) {
    return false; 
  }
};

export const useAdminLogic = () => {
  // --- ESTADOS DE LA INTERFAZ ---
  const [diaActivo, setDiaActivo] = useState(0);
  const [showDirectorio, setShowDirectorio] = useState(false);
  const [showCroquis, setShowCroquis] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [seccionName, setSeccionName] = useState('Accesos Principales');
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, title: '', initialValue: '', label: '', type: '' as 'caja' | 'horario', id: '' });
  
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [usuarioActivo, setUsuarioActivo] = useState<any>(null);
  const [isViewingSelf, setIsViewingSelf] = useState(false);
  const [modalAsignacion, setModalAsignacion] = useState({ isOpen: false, cajaId: '', turnoId: '', horario: '', cajaNombre: '' });
  
  const [downloadModal, setDownloadModal] = useState<{ isOpen: boolean; type: 'personal' | 'general'; targetUserId?: string; }>({ isOpen: false, type: 'personal' });

  // --- ESTADOS DE DATOS (NUESTRA API SIMULADA) ---
  const [misDatosAdmin, setMisDatosAdmin] = useState({
    id: 'admin_1', name: 'Administrador Principal', role: 'Administrador' as const, phone: '+52 899 123 4567',
    supportArea: 'Líder de línea - Flex-Norte', notes: 'Supervisión de accesos principales.', organizationLabel: 'Empresa', organization: 'Flex-Norte'
  });

  // CARGAMOS DESDE LOCALSTORAGE O USAMOS VALORES POR DEFECTO
  const [participantes, setParticipantes] = useState<Participante[]>(() => {
    const guardados = localStorage.getItem('gestor_participantes');
    if (guardados) return JSON.parse(guardados);
    return [
      { id: 'p1', nombre: 'Roberto Sánchez', linkUnico: '...', estado: 'Libre' },
      { id: 'p2', nombre: 'Juan Pérez', linkUnico: '...', estado: 'Libre' },
      { id: 'p3', nombre: 'Sofía Martínez', linkUnico: '...', estado: 'Libre' },
      { id: 'p4', nombre: 'María López', linkUnico: '...', estado: 'Libre' },
    ];
  });

  // CARGAMOS DESDE LOCALSTORAGE O USAMOS VALORES POR DEFECTO
  const [dias, setDias] = useState<DiaEvento[]>(() => {
    const guardados = localStorage.getItem('gestor_dias');
    if (guardados) return JSON.parse(guardados);
    return [
      {
        id: 'd1', fecha: '2026-03-15', nombreDia: 'Viernes 15',
        horariosMaestros: ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00'],
        cajas: [
          { id: 'c1', nombre: 'Caja 1', turnos: [{ id: 't1', horario: '08:00 - 10:00', participanteId: 'p2' }, { id: 't2', horario: '10:00 - 12:00', participanteId: null }, { id: 't2b', horario: '12:00 - 14:00', participanteId: 'CERRADO' }, { id: 't2c', horario: '14:00 - 16:00', participanteId: null }] },
          { id: 'c2', nombre: 'Caja 2', turnos: [{ id: 't3', horario: '08:00 - 10:00', participanteId: 'p4' }, { id: 't4', horario: '10:00 - 12:00', participanteId: 'p2' }, { id: 't4b', horario: '12:00 - 14:00', participanteId: null }, { id: 't4c', horario: '14:00 - 16:00', participanteId: null }] },
          { id: 'spec1', nombre: 'Staff VIP', esEspecial: true, turnos: [{ id: 'ts1', horario: '08:00 - 16:00', participanteId: 'p1' }] } as any
        ]
      },
      {
        id: 'd2', fecha: '2026-03-16', nombreDia: 'Sábado 16',
        horariosMaestros: ['09:00 - 11:00', '11:00 - 13:00', '13:00 - 15:00'],
        cajas: [
          { id: 'c3', nombre: 'Caja 1', turnos: [{ id: 't5', horario: '09:00 - 11:00', participanteId: 'p2' }, { id: 't6', horario: '11:00 - 13:00', participanteId: 'p1' }, { id: 't7', horario: '13:00 - 15:00', participanteId: null }] },
          { id: 'c4', nombre: 'Caja 2', turnos: [{ id: 't9', horario: '09:00 - 11:00', participanteId: null }, { id: 't10', horario: '11:00 - 13:00', participanteId: 'p3' }, { id: 't11', horario: '13:00 - 15:00', participanteId: 'p4' }] }
        ]
      },
      {
        id: 'd3', fecha: '2026-03-17', nombreDia: 'Domingo 17',
        horariosMaestros: ['10:00 - 12:00', '12:00 - 14:00'],
        cajas: [
          { id: 'c5', nombre: 'Caja Principal', turnos: [{ id: 't13', horario: '10:00 - 12:00', participanteId: 'p2' }, { id: 't14', horario: '12:00 - 14:00', participanteId: null }] },
          { id: 'spec2', nombre: 'Estacionamiento', esEspecial: true, turnos: [{ id: 'ts2', horario: '09:00 - 15:00', participanteId: 'p3' }] } as any
        ]
      }
    ];
  });

  // --- EFECTOS PARA GUARDAR AUTOMÁTICAMENTE ---
  useEffect(() => { localStorage.setItem('gestor_participantes', JSON.stringify(participantes)); }, [participantes]);
  useEffect(() => { localStorage.setItem('gestor_dias', JSON.stringify(dias)); }, [dias]);

  const diaActual = dias[diaActivo];

  const participantesEnriquecidos = participantes.map(p => {
    const ubicaciones: string[] = [];
    diaActual.cajas.forEach(caja => { caja.turnos.forEach(turno => { if (turno.participanteId === p.id) ubicaciones.push(`${caja.nombre} - ${turno.horario}`); }); });
    return { ...p, estado: ubicaciones.length > 0 ? 'Asignado' : 'Libre', ubicaciones } as Participante;
  });

  const getParticipante = (id: string | null) => participantesEnriquecidos.find(p => p.id === id);
  const totalCajas = diaActual.cajas.length;
  const turnosActivos = diaActual.cajas.reduce((acc, c) => acc + c.turnos.filter(t => t.participanteId !== 'CERRADO').length, 0);
  const turnosLibres = diaActual.cajas.reduce((acc, c) => acc + c.turnos.filter(t => t.participanteId === null).length, 0);

  const abrirModalAsignacion = (cajaId: string, cajaNombre: string, turnoId: string, horario: string) => setModalAsignacion({ isOpen: true, cajaId, turnoId, horario, cajaNombre });
  const cerrarModalAsignacion = () => setModalAsignacion({ ...modalAsignacion, isOpen: false });

  const actualizarTurnoVisual = (participanteId: string | null) => {
    const nuevosDias = [...dias]; const caja = nuevosDias[diaActivo].cajas.find(c => c.id === modalAsignacion.cajaId);
    if (caja) { const turno = caja.turnos.find(t => t.id === modalAsignacion.turnoId); if (turno) turno.participanteId = participanteId; }
    setDias(nuevosDias);
  };

  const asignarUsuarioExistente = (participanteId: string) => { actualizarTurnoVisual(participanteId); cerrarModalAsignacion(); };
  const handleCheckNameDuplicate = (newName: string, currentId: string) => isNameDuplicate(newName, participantes.map(p => ({ id: p.id, nombre: p.nombre })), currentId);

  const crearYAsignarUsuario = (nombre: string) => {
    if (handleCheckNameDuplicate(nombre, '')) { alert('Este participante ya existe.'); return; }
    const nuevoId = 'nuevo_' + Date.now();
    setParticipantes(prev => [...prev, { id: nuevoId, nombre, linkUnico: '...', estado: 'Libre' }]);
    actualizarTurnoVisual(nuevoId); cerrarModalAsignacion();
  };

  const quitarParticipante = (cajaId: string, turnoId: string) => {
    const nuevosDias = [...dias]; const caja = nuevosDias[diaActivo].cajas.find(c => c.id === cajaId);
    if (caja) { const turno = caja.turnos.find(t => t.id === turnoId); if (turno) turno.participanteId = null; }
    setDias(nuevosDias);
  };

  const handleCrearCaja = () => {
    const nuevosDias = [...dias]; const dia = nuevosDias[diaActivo];
    dia.cajas.push({ id: `c_${Date.now()}`, nombre: `Caja ${dia.cajas.length + 1}`, turnos: dia.horariosMaestros.map(h => ({ id: `t_${Date.now()}_${Math.random()}`, horario: h, participanteId: null })) });
    setDias(nuevosDias);
  };

  const handleCrearCajaEspecial = (nombre: string, turnosConfig: any[]) => {
    const nuevosDias = [...dias]; const dia = nuevosDias[diaActivo];
    dia.cajas.push({ id: `special_${Date.now()}`, nombre: nombre, esEspecial: true, turnos: turnosConfig.map((config: any) => ({ id: `t_spec_${Date.now()}_${Math.random()}`, horario: `${config.inicio} - ${config.fin}`, participanteId: null })) } as any);
    setDias(nuevosDias);
  };

  const handleCrearHorario = () => {
    const nuevosDias = [...dias]; const dia = nuevosDias[diaActivo];
    let nuevoHorarioText = "08:00 - 10:00";
    if (dia.horariosMaestros.length > 0) {
      const partes = dia.horariosMaestros[dia.horariosMaestros.length - 1].split('-');
      if (partes.length === 2) { const hFin = parseInt(partes[1].trim().split(':')[0]); if (!isNaN(hFin)) nuevoHorarioText = `${hFin.toString().padStart(2, '0')}:00 - ${(hFin + 2).toString().padStart(2, '0')}:00`; }
    }
    dia.horariosMaestros.push(nuevoHorarioText); dia.horariosMaestros.sort((a, b) => a.substring(0, 5).localeCompare(b.substring(0, 5)));
    dia.cajas.forEach(caja => {
      if (!(caja as any).esEspecial) { caja.turnos.push({ id: `t_${Date.now()}_${Math.random()}`, horario: nuevoHorarioText, participanteId: null }); caja.turnos.sort((a, b) => a.horario.substring(0, 5).localeCompare(b.horario.substring(0, 5))); }
    });
    setDias(nuevosDias);
  };

  const handleEliminarCaja = (cajaId: string) => { const nuevosDias = [...dias]; nuevosDias[diaActivo].cajas = nuevosDias[diaActivo].cajas.filter(c => c.id !== cajaId); setDias(nuevosDias); };
  const handleEliminarHorario = (horarioText: string) => {
    const nuevosDias = [...dias]; nuevosDias[diaActivo].horariosMaestros = nuevosDias[diaActivo].horariosMaestros.filter(h => h !== horarioText);
    nuevosDias[diaActivo].cajas.forEach(caja => { caja.turnos = caja.turnos.filter(t => t.horario !== horarioText); }); setDias(nuevosDias);
  };

  const abrirEditor = (type: 'caja' | 'horario', id: string, currentVal: string) => setEditModal({ isOpen: true, type, id, initialValue: currentVal, title: type === 'caja' ? 'Editar Nombre de Caja' : 'Editar Horario', label: type === 'caja' ? 'Nombre de la ubicación' : 'Rango de tiempo' });

  const handleSaveEdit = (newValue: string) => {
    const nuevosDias = [...dias]; const dia = nuevosDias[diaActivo];
    if (editModal.type === 'caja') { const caja = dia.cajas.find(c => c.id === editModal.id); if (caja) caja.nombre = newValue; } 
    else {
      dia.horariosMaestros = dia.horariosMaestros.map(h => h === editModal.id ? newValue : h); dia.horariosMaestros.sort((a, b) => a.substring(0, 5).localeCompare(b.substring(0, 5)));
      dia.cajas.forEach(caja => { caja.turnos.forEach(t => { if (t.horario === editModal.id) t.horario = newValue; }); caja.turnos.sort((a, b) => a.horario.substring(0, 5).localeCompare(b.horario.substring(0, 5))); });
    }
    setDias(nuevosDias); setEditModal({ ...editModal, isOpen: false });
  };

  const getBusyUserIdsForModal = () => {
    if (!modalAsignacion.horario) return [];
    const ocupados: string[] = [];
    diaActual.cajas.forEach(caja => { caja.turnos.forEach(turno => { if (turno.participanteId && turno.participanteId !== 'CERRADO' && hayChoqueDeHorario(modalAsignacion.horario, turno.horario)) ocupados.push(turno.participanteId); }); });
    return ocupados;
  };

  const handleAbrirMiPerfil = () => { setUsuarioActivo(misDatosAdmin); setIsViewingSelf(true); setIsUsuarioModalOpen(true); };
  const handleAbrirPerfilParticipante = (idParticipante: string) => {
    const p = participantesEnriquecidos.find(x => x.id === idParticipante);
    if (p) { setUsuarioActivo({ id: p.id, name: p.nombre, role: 'Participante', phone: '', supportArea: p.ubicaciones?.join(', ') || 'Sin área asignada', notes: '' }); setIsViewingSelf(false); setIsUsuarioModalOpen(true); }
  };
  const handleGuardarUsuario = (datosActualizados: any) => {
    if (isViewingSelf) setMisDatosAdmin(datosActualizados); else setParticipantes(prev => prev.map(p => p.id === datosActualizados.id ? { ...p, nombre: datosActualizados.name } : p));
    setIsUsuarioModalOpen(false);
  };

  return {
    dias, diaActivo, setDiaActivo, showDirectorio, setShowDirectorio, showCroquis, setShowCroquis,
    isEditingTitle, setIsEditingTitle, seccionName, setSeccionName, showSpecialModal, setShowSpecialModal,
    editModal, setEditModal, isUsuarioModalOpen, setIsUsuarioModalOpen, usuarioActivo, isViewingSelf, modalAsignacion,
    downloadModal, setDownloadModal,
    diaActual, participantesEnriquecidos, getParticipante, totalCajas, turnosActivos, turnosLibres, totalParticipantes: participantes.length,
    abrirModalAsignacion, cerrarModalAsignacion, asignarUsuarioExistente, crearYAsignarUsuario, quitarParticipante,
    handleCrearCaja, handleCrearCajaEspecial, handleCrearHorario, handleEliminarCaja, handleEliminarHorario,
    abrirEditor, handleSaveEdit, getBusyUserIdsForModal, handleAbrirMiPerfil, handleAbrirPerfilParticipante,
    handleGuardarUsuario, handleCheckNameDuplicate
  };
};
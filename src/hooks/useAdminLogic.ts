import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import type { DiaEvento, Participante } from '../types';
import { isNameDuplicate } from '../utils/validations';

interface UsuarioPerfil {
  id: string;
  name: string;
  role: 'Administrador' | 'Participante' | 'SuperAdmin';
  phone: string;
  supportArea: string;
  notes: string;
  organizationLabel?: string;
  organization?: string;
}

interface TurnoEspecialConfig {
  inicio: string;
  fin: string;
}

const hayChoqueDeHorario = (rango1: string, rango2: string) => {
  try {
    const [inicio1, fin1] = rango1.split('-').map(t => t.trim());
    const [inicio2, fin2] = rango2.split('-').map(t => t.trim());
    const aMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
    const i1 = aMin(inicio1), f1 = aMin(fin1);
    const i2 = aMin(inicio2), f2 = aMin(fin2);
    return i1 < f2 && i2 < f1;
  } catch { 
    return false; 
  }
};

// --- AHORA RECIBIMOS EL ID DEL EVENTO POR PARÁMETRO ---
export const useAdminLogic = (eventoId: string) => {
  const [diaActivo, setDiaActivo] = useState(0);
  const [showDirectorio, setShowDirectorio] = useState(false);
  const [showCroquis, setShowCroquis] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [seccionName, setSeccionName] = useState('Accesos Principales');
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, title: '', initialValue: '', label: '', type: '' as 'caja' | 'horario', id: '' });
  
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioPerfil | null>(null);
  const [isViewingSelf, setIsViewingSelf] = useState(false);
  const [modalAsignacion, setModalAsignacion] = useState({ isOpen: false, cajaId: '', turnoId: '', horario: '', cajaNombre: '' });
  const [downloadModal, setDownloadModal] = useState<{ isOpen: boolean; type: 'personal' | 'general'; targetUserId?: string; }>({ isOpen: false, type: 'personal' });

  const [misDatosAdmin, setMisDatosAdmin] = useState<UsuarioPerfil>({
    id: 'admin_1', name: 'Admin', role: 'Administrador', phone: '', supportArea: '', notes: '', organizationLabel: 'Organización', organization: ''
  });

  // --- ESTADOS DE DATOS REALES ---
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [dias, setDias] = useState<DiaEvento[]>([]);
  const [loading, setLoading] = useState(true);

// --- 1. ESCUCHAR FIREBASE EN TIEMPO REAL ---
  useEffect(() => {
    if (!eventoId || eventoId === 'demo') {
      // Usamos el setTimeout para evitar el "Cascading Render"
      const timer = setTimeout(() => {
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const eventoRef = doc(db, 'eventos', eventoId);
    
    // onSnapshot es asíncrono por naturaleza, así que aquí setLoading(false) sí está permitido
    const unsubscribe = onSnapshot(eventoRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDias(data.dias || []);
        setParticipantes(data.participantes || []);
        if (data.nombre) setSeccionName(data.nombre);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventoId]);

  // --- 2. FUNCIONES PARA GUARDAR EN FIREBASE ---
  const syncDias = async (nuevosDias: DiaEvento[]) => {
    setDias(nuevosDias); // Actualiza la pantalla al instante
    if (eventoId && eventoId !== 'demo') {
      await updateDoc(doc(db, 'eventos', eventoId), { dias: nuevosDias }); // Lo sube a la nube
    }
  };

  const syncParticipantes = async (nuevosParticipantes: Participante[]) => {
    setParticipantes(nuevosParticipantes);
    if (eventoId && eventoId !== 'demo') {
      await updateDoc(doc(db, 'eventos', eventoId), { participantes: nuevosParticipantes });
    }
  };

  const diaActual = dias[diaActivo] || null;

  const participantesEnriquecidos = participantes.map(p => {
    const ubicaciones: string[] = [];
    if (diaActual) {
      diaActual.cajas.forEach(caja => { 
        caja.turnos.forEach(turno => { 
          if (turno.participanteId === p.id) ubicaciones.push(`${caja.nombre} - ${turno.horario}`); 
        }); 
      });
    }
    return { ...p, estado: ubicaciones.length > 0 ? 'Asignado' : 'Libre', ubicaciones } as Participante;
  });

  const getParticipante = (id: string | null) => participantesEnriquecidos.find(p => p.id === id);
  const totalCajas = diaActual ? diaActual.cajas.length : 0;
  const turnosActivos = diaActual ? diaActual.cajas.reduce((acc, c) => acc + c.turnos.filter(t => t.participanteId !== 'CERRADO' && t.participanteId !== null).length, 0) : 0;
  const turnosLibres = diaActual ? diaActual.cajas.reduce((acc, c) => acc + c.turnos.filter(t => t.participanteId === null).length, 0) : 0;

  const abrirModalAsignacion = (cajaId: string, cajaNombre: string, turnoId: string, horario: string) => setModalAsignacion({ isOpen: true, cajaId, turnoId, horario, cajaNombre });
  const cerrarModalAsignacion = () => setModalAsignacion({ ...modalAsignacion, isOpen: false });

  const actualizarTurnoVisual = (participanteId: string | null) => {
    if (!diaActual) return;
    const nuevosDias = [...dias]; const caja = nuevosDias[diaActivo].cajas.find(c => c.id === modalAsignacion.cajaId);
    if (caja) { const turno = caja.turnos.find(t => t.id === modalAsignacion.turnoId); if (turno) turno.participanteId = participanteId; }
    syncDias(nuevosDias); // GUARDAMOS EN LA NUBE
  };

  const asignarUsuarioExistente = (participanteId: string) => { actualizarTurnoVisual(participanteId); cerrarModalAsignacion(); };
  const handleCheckNameDuplicate = (newName: string, currentId: string) => isNameDuplicate(newName, participantes.map(p => ({ id: p.id, nombre: p.nombre })), currentId);

  const crearYAsignarUsuario = (nombre: string) => {
    if (handleCheckNameDuplicate(nombre, '')) { alert('Este participante ya existe.'); return; }
    const nuevoId = 'p_' + Date.now();
    const nuevosParticipantes = [...participantes, { id: nuevoId, nombre, linkUnico: '...', estado: 'Libre' as const }];
    syncParticipantes(nuevosParticipantes); // GUARDAMOS EN LA NUBE
    actualizarTurnoVisual(nuevoId); 
    cerrarModalAsignacion();
  };

  const quitarParticipante = (cajaId: string, turnoId: string) => {
    if (!diaActual) return;
    const nuevosDias = [...dias]; const caja = nuevosDias[diaActivo].cajas.find(c => c.id === cajaId);
    if (caja) { const turno = caja.turnos.find(t => t.id === turnoId); if (turno) turno.participanteId = null; }
    syncDias(nuevosDias); // GUARDAMOS EN LA NUBE
  };

  const handleCrearCaja = () => {
    if (!diaActual) return;
    const nuevosDias = [...dias]; const dia = nuevosDias[diaActivo];
    dia.cajas.push({ id: `c_${Date.now()}`, nombre: `Caja ${dia.cajas.length + 1}`, turnos: dia.horariosMaestros.map(h => ({ id: `t_${Date.now()}_${Math.random()}`, horario: h, participanteId: null })) });
    syncDias(nuevosDias);
  };

  const handleCrearCajaEspecial = (nombre: string, turnosConfig: TurnoEspecialConfig[]) => {
    if (!diaActual) return;
    const nuevosDias = [...dias]; const dia = nuevosDias[diaActivo];
    dia.cajas.push({ id: `special_${Date.now()}`, nombre: nombre, esEspecial: true, turnos: turnosConfig.map((config) => ({ id: `t_spec_${Date.now()}_${Math.random()}`, horario: `${config.inicio} - ${config.fin}`, participanteId: null })) });
    syncDias(nuevosDias);
  };

  const handleCrearHorario = () => {
    if (!diaActual) return;
    const nuevosDias = [...dias]; const dia = nuevosDias[diaActivo];
    let nuevoHorarioText = "08:00 - 10:00";
    if (dia.horariosMaestros.length > 0) {
      const partes = dia.horariosMaestros[dia.horariosMaestros.length - 1].split('-');
      if (partes.length === 2) { const hFin = parseInt(partes[1].trim().split(':')[0]); if (!isNaN(hFin)) nuevoHorarioText = `${hFin.toString().padStart(2, '0')}:00 - ${(hFin + 2).toString().padStart(2, '0')}:00`; }
    }
    dia.horariosMaestros.push(nuevoHorarioText); dia.horariosMaestros.sort((a, b) => a.substring(0, 5).localeCompare(b.substring(0, 5)));
    dia.cajas.forEach(caja => {
      if (!caja.esEspecial) { caja.turnos.push({ id: `t_${Date.now()}_${Math.random()}`, horario: nuevoHorarioText, participanteId: null }); caja.turnos.sort((a, b) => a.horario.substring(0, 5).localeCompare(b.horario.substring(0, 5))); }
    });
    syncDias(nuevosDias);
  };

  const handleEliminarCaja = (cajaId: string) => { 
    if (!diaActual) return;
    const nuevosDias = [...dias]; nuevosDias[diaActivo].cajas = nuevosDias[diaActivo].cajas.filter(c => c.id !== cajaId); 
    syncDias(nuevosDias); 
  };
  
  const handleEliminarHorario = (horarioText: string) => {
    if (!diaActual) return;
    const nuevosDias = [...dias]; nuevosDias[diaActivo].horariosMaestros = nuevosDias[diaActivo].horariosMaestros.filter(h => h !== horarioText);
    nuevosDias[diaActivo].cajas.forEach(caja => { caja.turnos = caja.turnos.filter(t => t.horario !== horarioText); }); 
    syncDias(nuevosDias);
  };

  const abrirEditor = (type: 'caja' | 'horario', id: string, currentVal: string) => setEditModal({ isOpen: true, type, id, initialValue: currentVal, title: type === 'caja' ? 'Editar Nombre de Caja' : 'Editar Horario', label: type === 'caja' ? 'Nombre de la ubicación' : 'Rango de tiempo' });

  const handleSaveEdit = (newValue: string) => {
    if (!diaActual) return;
    const nuevosDias = [...dias]; const dia = nuevosDias[diaActivo];
    if (editModal.type === 'caja') { const caja = dia.cajas.find(c => c.id === editModal.id); if (caja) caja.nombre = newValue; } 
    else {
      dia.horariosMaestros = dia.horariosMaestros.map(h => h === editModal.id ? newValue : h); dia.horariosMaestros.sort((a, b) => a.substring(0, 5).localeCompare(b.substring(0, 5)));
      dia.cajas.forEach(caja => { caja.turnos.forEach(t => { if (t.horario === editModal.id) t.horario = newValue; }); caja.turnos.sort((a, b) => a.horario.substring(0, 5).localeCompare(b.horario.substring(0, 5))); });
    }
    syncDias(nuevosDias); 
    setEditModal({ ...editModal, isOpen: false });
  };

  const getBusyUserIdsForModal = () => {
    if (!modalAsignacion.horario || !diaActual) return [];
    const ocupados: string[] = [];
    diaActual.cajas.forEach(caja => { caja.turnos.forEach(turno => { if (turno.participanteId && turno.participanteId !== 'CERRADO' && hayChoqueDeHorario(modalAsignacion.horario, turno.horario)) ocupados.push(turno.participanteId); }); });
    return ocupados;
  };

  const handleAbrirMiPerfil = () => { setUsuarioActivo(misDatosAdmin); setIsViewingSelf(true); setIsUsuarioModalOpen(true); };
  
  const handleAbrirPerfilParticipante = (idParticipante: string) => {
    const p = participantesEnriquecidos.find(x => x.id === idParticipante);
    if (p) { setUsuarioActivo({ id: p.id, name: p.nombre, role: 'Participante', phone: '', supportArea: p.ubicaciones?.join(', ') || 'Sin área asignada', notes: '' }); setIsViewingSelf(false); setIsUsuarioModalOpen(true); }
  };
  
  const handleGuardarUsuario = (datosActualizados: UsuarioPerfil) => {
    if (isViewingSelf) {
      setMisDatosAdmin(datosActualizados);
    } else {
      const nuevosParticipantes = participantes.map(p => p.id === datosActualizados.id ? { ...p, nombre: datosActualizados.name } : p);
      syncParticipantes(nuevosParticipantes);
    }
    setIsUsuarioModalOpen(false);
  };

  return {
    dias, diaActivo, setDiaActivo, showDirectorio, setShowDirectorio, showCroquis, setShowCroquis,
    isEditingTitle, setIsEditingTitle, seccionName, setSeccionName, showSpecialModal, setShowSpecialModal,
    editModal, setEditModal, isUsuarioModalOpen, setIsUsuarioModalOpen, usuarioActivo, isViewingSelf, modalAsignacion,
    downloadModal, setDownloadModal, loading, // <-- Agregamos loading para saber si está cargando
    diaActual, participantesEnriquecidos, getParticipante, totalCajas, turnosActivos, turnosLibres, totalParticipantes: participantes.length,
    abrirModalAsignacion, cerrarModalAsignacion, asignarUsuarioExistente, crearYAsignarUsuario, quitarParticipante,
    handleCrearCaja, handleCrearCajaEspecial, handleCrearHorario, handleEliminarCaja, handleEliminarHorario,
    abrirEditor, handleSaveEdit, getBusyUserIdsForModal, handleAbrirMiPerfil, handleAbrirPerfilParticipante,
    handleGuardarUsuario, handleCheckNameDuplicate
  };
};
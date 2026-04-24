/**
 * RESUMEN: Lógica de Horarios en useAdminLogic
 * Maneja la apertura del modal, la validación de choques de tiempo 
 * y el guardado (creación o edición) sincronizado con Firebase.
 */


import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import type { DiaEvento, Participante } from '../types';

// Interfaz estricta para reemplazar el "any" del admin
interface AdminDB {
  id: string;
  name?: string;
  phone?: string;
  area?: string;
  notes?: string;
  organizationLabel?: string;
  organization?: string;
}

interface UsuarioPerfil {
  id: string;
  name: string;
  role: 'Administrador' | 'Participante' | 'SuperAdmin';
  phone: string;
  supportArea: string;
  notes: string;
  organizationLabel?: string;
  organization?: string;
  birthDate?: string;
}

interface TurnoEspecialConfig {
  inicio: string;
  fin: string;
}

const hayChoqueDeHorario = (rango1: string, rango2: string) => {
  try {
    const parse = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const r1 = rango1.split('-');
    const r2 = rango2.split('-');
    const i1 = parse(r1[0].trim());
    const f1 = r1.length > 1 ? parse(r1[1].trim()) : i1 + 59; 
    const i2 = parse(r2[0].trim());
    const f2 = r2.length > 1 ? parse(r2[1].trim()) : i2 + 59;
    return i1 < f2 && i2 < f1;
  } catch { 
    return false; 
  }
};

export const useAdminLogic = (eventoId: string) => {
  const adminIdL = localStorage.getItem('current_admin_id') || 'demo';

  const [dias, setDias] = useState<DiaEvento[]>([]);
  const [diaActivo, setDiaActivo] = useState(0);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [seccionName, setSeccionName] = useState('Mi Evento');
  
  const [showDirectorio, setShowDirectorio] = useState(false);
  const [showCroquis, setShowCroquis] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  
  const [editModal, setEditModal] = useState<{isOpen: boolean; type: 'caja' | 'horario'; title: string; initialValue: string; label: string; targetId?: string}>({
    isOpen: false, type: 'caja', title: '', initialValue: '', label: ''
  });
  
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioPerfil | null>(null);
  const [isViewingSelf, setIsViewingSelf] = useState(false);
  
  const [modalAsignacion, setModalAsignacion] = useState({ isOpen: false, cajaId: '', cajaNombre: '', turnoId: '', horario: '' });
  const [downloadModal, setDownloadModal] = useState<{isOpen: boolean; type: 'general'|'personal'; targetUserId?: string}>({ isOpen: false, type: 'general' });
  const [loading, setLoading] = useState(true);
  const [misDatosAdmin, setMisDatosAdmin] = useState<UsuarioPerfil | null>(null);

  const [createShiftModal, setCreateShiftModal] = useState({ isOpen: false, defaultStart: '08:00', defaultEnd: '09:00' });

  const [horarioEditando, setHorarioEditando] = useState<string | null>(null);
  const [clashModal, setClashModal] = useState({ isOpen: false, inicio: '', fin: '', turnoCruzado: '' });

  useEffect(() => {
    if (!eventoId) return;
    const docRef = doc(db, 'eventos', eventoId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDias(data.diasPorAdmin?.[adminIdL] || []);
        setParticipantes(data.participantesPorAdmin?.[adminIdL] || []);
        if (data.nombre) setSeccionName(data.nombre);

        // Se reemplazó a:any por AdminDB
        const currentAdmin = data.admins?.find((a: AdminDB) => a.id === adminIdL);
        if (currentAdmin) {
          setMisDatosAdmin({
            id: currentAdmin.id,
            name: currentAdmin.name || 'Admin',
            role: 'Administrador',
            phone: currentAdmin.phone || '',
            supportArea: currentAdmin.area || 'General',
            notes: currentAdmin.notes || '',
            organizationLabel: currentAdmin.organizationLabel,
            organization: currentAdmin.organization
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventoId, adminIdL]);

  const syncEvent = async (nuevosDias: DiaEvento[]) => {
    await updateDoc(doc(db, 'eventos', eventoId), { [`diasPorAdmin.${adminIdL}`]: nuevosDias });
  };
  const syncParticipantes = async (nuevosParticipantes: Participante[]) => {
    await updateDoc(doc(db, 'eventos', eventoId), { [`participantesPorAdmin.${adminIdL}`]: nuevosParticipantes });
  };

  const diaActual = dias[diaActivo];

  const getParticipante = (id: string | null) => participantes.find(p => p.id === id);

  const participantesEnriquecidos = participantes.map(p => {
    const ubicaciones: string[] = [];
    dias.forEach((dia) => {
      dia.cajas.forEach(caja => {
        caja.turnos.forEach(turno => {
          if (turno.participanteId === p.id) {
            ubicaciones.push(`${dia.nombreDia.substring(0,3)} ${turno.horario} - ${caja.nombre}`);
          }
        });
      });
    });
    return { ...p, estado: ubicaciones.length > 0 ? 'Asignado' : 'Libre', ubicaciones };
  });

  let totalCajas = 0, turnosActivos = 0, turnosLibres = 0;
  if (diaActual) {
    totalCajas = diaActual.cajas.length;
    diaActual.cajas.forEach(caja => {
      caja.turnos.forEach(turno => {
        if (turno.participanteId) turnosActivos++;
        else turnosLibres++;
      });
    });
  }

  const handleCrearCaja = () => {
    if (!diaActual) return;
    
    // FILTRO ESTRICTO: Solo extraer horarios de las cajas que NO sean especiales
    const cajasNormales = diaActual.cajas.filter(c => !('isEspecial' in c && c.isEspecial));
    
    const horarios = cajasNormales.length > 0 
      ? Array.from(new Set(cajasNormales.flatMap(c => c.turnos.map(t => t.horario)))) 
      : ['09:00 - 10:00'];
      
    const nuevaCaja = {
      id: `caja_${Date.now()}`,
      nombre: `Caja ${diaActual.cajas.length + 1}`,
      turnos: horarios.map(h => ({ id: `t_${Date.now()}_${Math.random()}`, horario: h, participanteId: null }))
    };
    syncEvent(dias.map((d, i) => i === diaActivo ? { ...d, cajas: [...d.cajas, nuevaCaja] } : d));
  };

  const handleCrearCajaEspecial = (nombre: string, turnosConfig: TurnoEspecialConfig[]) => {
    if (!diaActual) return;
    const nuevaCajaEspecial = {
      id: `especial_${Date.now()}`,
      nombre,
      isEspecial: true,
      turnos: turnosConfig.map(t => ({
        id: `t_${Date.now()}_${Math.random()}`,
        horario: `${t.inicio} - ${t.fin}`,
        participanteId: null
      }))
    };
    syncEvent(dias.map((d, i) => i === diaActivo ? { ...d, cajas: [...d.cajas, nuevaCajaEspecial] } : d));
    setShowSpecialModal(false);
  };

  // 1. Abre el modal y calcula mágicamente la hora sugerida
  const handleCrearHorario = () => {
  if (!diaActual || diaActual.cajas.length === 0) return;

  const cajasNormales = diaActual.cajas.filter(c => !('isEspecial' in c && c.isEspecial));
  let sugerenciaInicio = '08:00';
  let sugerenciaFin = '09:00';

  if (cajasNormales.length > 0 && cajasNormales[0].turnos.length > 0) {
    const turnos = cajasNormales[0].turnos;
    const ultimoTurno = turnos[turnos.length - 1].horario;
    const partes = ultimoTurno.split('-');
    if (partes.length === 2) {
      sugerenciaInicio = partes[1].trim();
      const [h, m] = sugerenciaInicio.split(':').map(Number);
      sugerenciaFin = `${((h + 1) % 24).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }
  setHorarioEditando(null); // Estamos creando, no editando
  setCreateShiftModal({ isOpen: true, defaultStart: sugerenciaInicio, defaultEnd: sugerenciaFin });
};


const confirmarCrearHorario = (inicio: string, fin: string, forzar = false) => {
  if (!diaActual) return false;
  const nuevoHorario = `${inicio} - ${fin}`;
  const cajasNormales = diaActual.cajas.filter(c => !('isEspecial' in c && c.isEspecial));

  if (!forzar && cajasNormales.length > 0) {
    const turnosExistentes = cajasNormales[0].turnos;
    const turnosAValidar = horarioEditando 
      ? turnosExistentes.filter(t => t.horario !== horarioEditando)
      : turnosExistentes;

    const turnoCruzado = turnosAValidar.find(t => hayChoqueDeHorario(t.horario, nuevoHorario));
    
    // En lugar de window.confirm, abrimos el modal bonito
    if (turnoCruzado) {
      setClashModal({ isOpen: true, inicio, fin, turnoCruzado: turnoCruzado.horario });
      return false; // Pausamos la creación
    }
  }

  // --- LÓGICA DE GUARDADO ---
  const getMinutos = (rango: string) => { 
    const hora = rango.split('-')[0].trim();
    const [h, m] = hora.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const nuevosDias = dias.map((d, idx) => {
    if (idx !== diaActivo) return d;
    return {
      ...d, cajas: d.cajas.map(c => {
        if ('isEspecial' in c && c.isEspecial) return c;
        const turnosActualizados = horarioEditando 
          ? c.turnos.map(t => t.horario === horarioEditando ? { ...t, horario: nuevoHorario } : t)
          : [...c.turnos, { id: `t_${Date.now()}_${Math.random()}`, horario: nuevoHorario, participanteId: null }];
        return { ...c, turnos: turnosActualizados.sort((a, b) => getMinutos(a.horario) - getMinutos(b.horario)) };
      })
    };
  });

  syncEvent(nuevosDias);
  setCreateShiftModal({ ...createShiftModal, isOpen: false });
  setClashModal({ isOpen: false, inicio: '', fin: '', turnoCruzado: '' });
  return true;
};

  const handleEliminarCaja = (cajaId: string) => {
    syncEvent(dias.map((d, i) => i === diaActivo ? { ...d, cajas: d.cajas.filter(c => c.id !== cajaId) } : d));
  };

  const handleEliminarHorario = (horario: string) => {
    syncEvent(dias.map((d, i) => i === diaActivo ? {
      ...d, cajas: d.cajas.map(c => ({ ...c, turnos: c.turnos.filter(t => t.horario !== horario) }))
    } : d));
  };

  const abrirEditor = (type: 'caja' | 'horario', idOrValue: string, initialValue: string) => {
  if (type === 'horario') {
    const [inicio, fin] = initialValue.split('-').map(s => s.trim());
    setHorarioEditando(initialValue); // Guardamos cuál estamos editando
    setCreateShiftModal({ isOpen: true, defaultStart: inicio, defaultEnd: fin });
  } else {
    setEditModal({
      isOpen: true, type,
      title: 'Renombrar Caja',
      label: 'Nombre de la Caja',
      initialValue, targetId: idOrValue
    });
  }
};

  const handleSaveEdit = (newValue: string) => {
    if (editModal.type === 'caja') {
      const nombreLimpio = newValue.trim();
      
      // 1. Validar límite de caracteres
      if (nombreLimpio.length > 20) {
        alert("El nombre de la caja es muy largo. El límite son 20 caracteres.");
        return;
      }
      
      // 2. Validar que no haya nombres duplicados
      if (diaActual) {
        const duplicado = diaActual.cajas.some(c => 
          c.id !== editModal.targetId && 
          (c.nombre as string).toLowerCase() === nombreLimpio.toLowerCase()
        );
        
        if (duplicado) {
          alert("Ya existe una caja con ese nombre. Por favor, elige uno diferente.");
          return;
        }
      }

      // 3. Guardar si todo es correcto
      syncEvent(dias.map((d, i) => i === diaActivo ? {
        ...d, cajas: d.cajas.map(c => c.id === editModal.targetId ? { ...c, nombre: nombreLimpio } : c)
      } : d));
    } else {
      // Lógica de edición de horario...
      syncEvent(dias.map((d, i) => i === diaActivo ? {
        ...d, cajas: d.cajas.map(c => ({
          ...c, turnos: c.turnos.map(t => t.horario === editModal.initialValue ? { ...t, horario: newValue } : t)
        }))
      } : d));
    }
    setEditModal({ ...editModal, isOpen: false });
  };

  const abrirModalAsignacion = (cajaId: string, cajaNombre: string, turnoId: string, horario: string) => {
    setModalAsignacion({ isOpen: true, cajaId, cajaNombre, turnoId, horario });
  };

  const cerrarModalAsignacion = () => setModalAsignacion({ ...modalAsignacion, isOpen: false });

  const getBusyUserIdsForModal = () => {
    const { horario } = modalAsignacion;
    if (!diaActual || !horario) return [];
    
    const busyIds = new Set<string>();
    diaActual.cajas.forEach(caja => {
      caja.turnos.forEach(turno => {
        if (turno.participanteId && hayChoqueDeHorario(turno.horario, horario)) {
          busyIds.add(turno.participanteId);
        }
      });
    });
    return Array.from(busyIds);
  };

  const asignarUsuarioExistente = (participanteId: string) => {
    syncEvent(dias.map((d, i) => i === diaActivo ? {
      ...d, cajas: d.cajas.map(c => c.id === modalAsignacion.cajaId ? {
        ...c, turnos: c.turnos.map(t => t.id === modalAsignacion.turnoId ? { ...t, participanteId } : t)
      } : c)
    } : d));
    cerrarModalAsignacion();
  };

  const crearYAsignarUsuario = (nombre: string) => {
    const nuevoId = `part_${Date.now()}`;
    // SE CORRIGIÓ EL ERROR: Se agregó el linkUnico obligatorio por la interfaz
    syncParticipantes([...participantes, { 
      id: nuevoId, 
      nombre, 
      estado: 'Libre',
      linkUnico: `inv-${nuevoId}` 
    }]);
    asignarUsuarioExistente(nuevoId);
  };

  const quitarParticipante = (cajaId: string, turnoId: string) => {
    syncEvent(dias.map((d, i) => i === diaActivo ? {
      ...d, cajas: d.cajas.map(c => c.id === cajaId ? {
        ...c, turnos: c.turnos.map(t => t.id === turnoId ? { ...t, participanteId: null } : t)
      } : c)
    } : d));
  };

  const handleAbrirMiPerfil = () => { setUsuarioActivo(misDatosAdmin); setIsViewingSelf(true); setIsUsuarioModalOpen(true); };
  
  const handleAbrirPerfilParticipante = (id: string) => {
    const p = participantesEnriquecidos.find(x => x.id === id);
    if (p) { setUsuarioActivo({ id: p.id, name: p.nombre, role: 'Participante', phone: '', supportArea: p.ubicaciones?.join(', ') || 'Sin área asignada', notes: '' }); setIsViewingSelf(false); setIsUsuarioModalOpen(true); }
  };
  
  // SE CORRIGIÓ EL ERROR DE ARGUMENTOS: Validación directa a prueba de fallos
  const handleCheckNameDuplicate = (name: string, currentId: string) => {
    const lowerName = name.trim().toLowerCase();
    return participantes.some(p => p.id !== currentId && p.nombre.trim().toLowerCase() === lowerName);
  };

  return {
    dias, diaActivo, setDiaActivo, showDirectorio, setShowDirectorio, showCroquis, setShowCroquis,
    isEditingTitle, setIsEditingTitle, seccionName, setSeccionName, showSpecialModal, setShowSpecialModal,
    editModal, setEditModal, isUsuarioModalOpen, setIsUsuarioModalOpen, usuarioActivo, isViewingSelf, modalAsignacion,
    downloadModal, setDownloadModal, loading, 
    diaActual, participantesEnriquecidos, getParticipante, totalCajas, turnosActivos, turnosLibres, totalParticipantes: participantes.length,
    abrirModalAsignacion, cerrarModalAsignacion, asignarUsuarioExistente, crearYAsignarUsuario, quitarParticipante,
    handleCrearCaja, handleCrearCajaEspecial, handleCrearHorario, handleEliminarCaja, handleEliminarHorario,
    abrirEditor, handleSaveEdit, getBusyUserIdsForModal, handleAbrirMiPerfil, handleAbrirPerfilParticipante,
    handleCheckNameDuplicate,createShiftModal, setCreateShiftModal, confirmarCrearHorario,horarioEditando,setHorarioEditando,
    clashModal, setClashModal, misDatosAdmin
  
  };
};
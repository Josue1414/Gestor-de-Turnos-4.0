import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import type { DiaEvento, Participante } from '../types';
import { DiaEventoSchema, ParticipanteSchema } from '../utils/schemas';
import { rangesOverlap } from '../utils/validations';
import { useToast } from '../components/ToastProvider';

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
  role: 'Administrador' | 'Participante' | 'SuperAdmin' | 'Capitan';
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

export const useAdminLogic = (eventoId: string) => {
  // DETECCIÓN DE ROL Y CREDENCIALES LOCALES
  const userRole = localStorage.getItem('user_role');
  const isCapitan = userRole === 'capitan';
  const adminIdL = localStorage.getItem('current_admin_id') || 'demo';
  const capitanIdL = localStorage.getItem('current_capitan_id') || '';

  const { showToast } = useToast();

  const [dias, setDias] = useState<DiaEvento[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [capitanes, setCapitanes] = useState<any[]>([]);
  const [cajasAsignadasCapitan, setCajasAsignadasCapitan] = useState<string[]>([]);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isCajaEspecial = (c: any): boolean => {
    if (!c || typeof c !== 'object') return false;
    if (c.isEspecial === true || c.esEspecial === true || c.especial === true) return true;
    if (c.tipo === 'especial') return true;
    if (typeof c.nombre === 'string') {
      const ln = c.nombre.toLowerCase();
      if (ln.includes('especial') || ln.includes('vip') || ln.includes('kiosco')) return true;
    }
    return false;
  };

  useEffect(() => {
    if (!eventoId) return;
    const docRef = doc(db, 'eventos', eventoId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // 1. CARGAR DÍAS (El esqueleto base es el del Admin)
        const rawDias = data.diasPorAdmin?.[adminIdL] || [];
        const validatedDias = Array.isArray(rawDias)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? rawDias.map((d: any) => {
              const res = DiaEventoSchema.safeParse(d);
              if (!res.success) return d;
              return res.data as DiaEvento;
            })
          : [];
        setDias(validatedDias as DiaEvento[]);

        // 2. CARGAR CAPITANES
        const misCapitanes = data.capitanesPorAdmin?.[adminIdL] || [];
        setCapitanes(misCapitanes);

        if (isCapitan) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const miDataCapitan = misCapitanes.find((c: any) => c.id === capitanIdL);
          setCajasAsignadasCapitan(miDataCapitan?.cajasAsignadas || []);
        }

        // 3. CARGAR PARTICIPANTES (AISLAMIENTO TOTAL)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        
        // 3. CARGAR PARTICIPANTES (AISLAMIENTO TOTAL + CRUCE SIN DUPLICADOS)
        let allParts: any[] = [];
        
        if (isCapitan) {
          // El Capitán SOLO descarga a sus propios invitados y los que estén en sus cajas
          const misParts = data.participantesPorCapitan?.[capitanIdL] || [];
          const adminParts = data.participantesPorAdmin?.[adminIdL] || [];
          const miDataCapitan = misCapitanes.find((c: any) => c.id === capitanIdL);
          const misCajas = miDataCapitan?.cajasAsignadas || [];
          
          const partsEnMisCajas = adminParts.filter((p: any) => {
            const rawDias = data.diasPorAdmin?.[adminIdL] || [];
            const misDias = miDataCapitan?.diasAsignados || []; // <-- Recoger sus días
            
            return rawDias.some((dia: any) => 
              misDias.includes(dia.id) && // <-- FILTRO CLAVE: Solo días del capitán
              dia.cajas.some((caja: any) => 
                misCajas.includes(caja.id) && caja.turnos.some((t: any) => t.participanteId === p.id)
              )
            );
          });
          
          // Agrupamos para evitar duplicados en la vista del capitán
          const mapCapitan = new Map();
          [...misParts, ...partsEnMisCajas].forEach(p => mapCapitan.set(p.id, p));
          allParts = Array.from(mapCapitan.values());

        } else {
          // ADMIN: Consolida todos los participantes sin duplicar usando un Map
          const allPartsMap = new Map<string, any>();

          // 3.1 Cargar los creados por el Admin
          const misParts = data.participantesPorAdmin?.[adminIdL] || [];
          misParts.forEach((p: any) => {
            allPartsMap.set(p.id, { ...p, creador: 'Admin', capitanesInvolucrados: new Set() });
          });

          // 3.2 Cargar los creados por los Capitanes
          misCapitanes.forEach((cap: any) => {
            const capParts = data.participantesPorCapitan?.[cap.id] || [];
            capParts.forEach((p: any) => {
              if (!allPartsMap.has(p.id)) {
                allPartsMap.set(p.id, { ...p, creador: cap.nombre, capitanesInvolucrados: new Set([cap.nombre]) });
              }
            });
          });

          // 3.3 Calcular etiquetas dinámicas según los turnos asignados
          const rawDias = data.diasPorAdmin?.[adminIdL] || [];
          rawDias.forEach((dia: any) => {
            dia.cajas.forEach((caja: any) => {
              // Verificamos si esta caja le pertenece a algún capitán
              const capitanDuenio = misCapitanes.find((c: any) => c.cajasAsignadas?.includes(caja.id));
              if (capitanDuenio) {
                caja.turnos.forEach((t: any) => {
                  if (t.participanteId && allPartsMap.has(t.participanteId)) {
                    const p = allPartsMap.get(t.participanteId);
                    p.capitanesInvolucrados.add(capitanDuenio.nombre);
                  }
                });
              }
            });
          });

          // Convertir el Map a Array y los Sets a Arrays para el renderizado
          allParts = Array.from(allPartsMap.values()).map(p => ({
            ...p,
            capitanesInvolucrados: Array.from(p.capitanesInvolucrados)
          }));
        }

        const validatedParts = Array.isArray(allParts)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? allParts.map((p: any) => {
              const res = ParticipanteSchema.safeParse(p);
              if (!res.success) return p;
              return res.data as Participante;
            })
          : [];
        setParticipantes(validatedParts as Participante[]);

        if (data.nombre) setSeccionName(data.nombre);
        
        // 4. DATOS DEL PERFIL ACTUAL
        if (isCapitan) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const miDataCapitan = misCapitanes.find((c: any) => c.id === capitanIdL);
          setMisDatosAdmin({
            id: capitanIdL,
            name: miDataCapitan?.nombre || 'Capitán',
            role: 'Capitan',
            phone: '',
            supportArea: 'Gestión de Cajas',
            notes: '',
            organizationLabel: 'Equipo',
            organization: 'Apoyo'
          });
        } else {
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
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventoId, adminIdL, isCapitan, capitanIdL]);

  const syncEvent = async (nuevosDias: DiaEvento[]) => {
    // Protección: Solo el Admin puede modificar la estructura (crear/borrar cajas o turnos)
    if (isCapitan) return; 
    await updateDoc(doc(db, 'eventos', eventoId), { [`diasPorAdmin.${adminIdL}`]: nuevosDias });
  };

  const syncParticipantes = async (nuevosParticipantes: Participante[]) => {
    // Si es Capitán, guarda en su cajón. Si es Admin, guarda en el suyo.
    if (isCapitan) {
      await updateDoc(doc(db, 'eventos', eventoId), { [`participantesPorCapitan.${capitanIdL}`]: nuevosParticipantes });
    } else {
      await updateDoc(doc(db, 'eventos', eventoId), { [`participantesPorAdmin.${adminIdL}`]: nuevosParticipantes });
    }
  };

  const diaActual = dias[diaActivo];

  const getParticipante = (id: string | null) => participantes.find(p => p.id === id);

  const participantesEnriquecidos = participantes.map(p => {
    const ubicaciones: string[] = [];
    dias.forEach((dia) => {
      dia.cajas.forEach(caja => {
        caja.turnos.forEach(turno => {
          if (turno.participanteId === p.id) {
            // Evaluamos si el nombre de la caja ya dice "Caja", si no, se lo agregamos
            const nombreCaja = caja.nombre as string;
            const textoCaja = nombreCaja.toLowerCase().includes('caja') ? nombreCaja : `Caja ${nombreCaja}`;
            
            ubicaciones.push(`${dia.nombreDia.substring(0,3)} ${turno.horario} - ${textoCaja}`);
          }
        });
      });
    });
    return { ...p, estado: ubicaciones.length > 0 ? 'Asignado' : 'Libre', ubicaciones };
  });

  const handleCrearCaja = () => { 
    if (!diaActual) return;
    const cajasNormales = diaActual.cajas.filter(c => !isCajaEspecial(c));
    const horarios = cajasNormales.length > 0 ? Array.from(new Set(cajasNormales.flatMap(c => c.turnos.map(t => t.horario)))) : ['09:00 - 10:00'];
    const nuevaCaja = { id: `caja_${Date.now()}`, nombre: `Caja ${diaActual.cajas.length + 1}`, turnos: horarios.map(h => ({ id: `t_${Date.now()}_${Math.random()}`, horario: h, participanteId: null })) };
    syncEvent(dias.map((d, i) => i === diaActivo ? { ...d, cajas: [...d.cajas, nuevaCaja] } : d));
  };

  const handleCrearCajaEspecial = (nombre: string, turnosConfig: TurnoEspecialConfig[]) => {
    if (!diaActual) return;
    const nuevaCajaEspecial = { id: `especial_${Date.now()}`, nombre, isEspecial: true, turnos: turnosConfig.map(t => ({ id: `t_${Date.now()}_${Math.random()}`, horario: `${t.inicio} - ${t.fin}`, participanteId: null })) };
    syncEvent(dias.map((d, i) => i === diaActivo ? { ...d, cajas: [...d.cajas, nuevaCajaEspecial] } : d));
    setShowSpecialModal(false);
  };

  const handleCrearHorario = () => {
    if (!diaActual || diaActual.cajas.length === 0) return;
    const cajasNormales = diaActual.cajas.filter(c => !isCajaEspecial(c));
    let sugerenciaInicio = '08:00';
    let sugerenciaFin = '09:00';

    if (cajasNormales.length > 0 && cajasNormales[0].turnos.length > 0) {
      const turnos = cajasNormales[0].turnos;
      const partes = turnos[turnos.length - 1].horario.split('-');
      if (partes.length === 2) {
        sugerenciaInicio = partes[1].trim();
        const [h, m] = sugerenciaInicio.split(':').map(Number);
        sugerenciaFin = `${((h + 1) % 24).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
    }
    setHorarioEditando(null); 
    setCreateShiftModal({ isOpen: true, defaultStart: sugerenciaInicio, defaultEnd: sugerenciaFin });
  };

  const confirmarCrearHorario = (inicio: string, fin: string, forzar = false) => {
    if (!diaActual) return false;
    const nuevoHorario = `${inicio} - ${fin}`;
    const cajasNormales = diaActual.cajas.filter(c => !isCajaEspecial(c));

    if (!forzar && cajasNormales.length > 0) {
      const turnosAValidar = horarioEditando ? cajasNormales[0].turnos.filter(t => t.horario !== horarioEditando) : cajasNormales[0].turnos;
      const turnoCruzado = turnosAValidar.find(t => rangesOverlap(t.horario, nuevoHorario));
      if (turnoCruzado) {
        setClashModal({ isOpen: true, inicio, fin, turnoCruzado: turnoCruzado.horario });
        return false; 
      }
    }

    const getMinutos = (rango: string) => { 
      const hora = rango.split('-')[0].trim();
      const [h, m] = hora.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const nuevosDias = dias.map((d, idx) => {
      if (idx !== diaActivo) return d;
      return {
        ...d, cajas: d.cajas.map(c => {
          if (isCajaEspecial(c)) return c;
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

  const handleEliminarCaja = (cajaId: string) => syncEvent(dias.map((d, i) => i === diaActivo ? { ...d, cajas: d.cajas.filter(c => c.id !== cajaId) } : d));
  const handleEliminarHorario = (horario: string) => syncEvent(dias.map((d, i) => i === diaActivo ? { ...d, cajas: d.cajas.map(c => { if (isCajaEspecial(c)) return c; return { ...c, turnos: c.turnos.filter(t => t.horario !== horario) }; }) } : d));

  const abrirEditor = (type: 'caja' | 'horario', idOrValue: string, initialValue: string) => {
    if (type === 'horario') {
      const [inicio, fin] = initialValue.split('-').map(s => s.trim());
      setHorarioEditando(initialValue);
      setCreateShiftModal({ isOpen: true, defaultStart: inicio, defaultEnd: fin });
    } else {
      setEditModal({ isOpen: true, type, title: 'Renombrar Caja', label: 'Nombre de la Caja', initialValue, targetId: idOrValue });
    }
  };

  const handleSaveEdit = (newValue: string) => {
    if (editModal.type === 'caja') {
      const nombreLimpio = newValue.trim();
      if (nombreLimpio.length > 20) { showToast("Límite son 20 caracteres.", 'error'); return; }
      if (diaActual && diaActual.cajas.some(c => c.id !== editModal.targetId && (c.nombre as string).toLowerCase() === nombreLimpio.toLowerCase())) {
        showToast("Ya existe una caja con ese nombre.", 'error'); return;
      }
      syncEvent(dias.map((d, i) => i === diaActivo ? { ...d, cajas: d.cajas.map(c => c.id === editModal.targetId ? { ...c, nombre: nombreLimpio } : c) } : d));
    } else {
      syncEvent(dias.map((d, i) => i === diaActivo ? { ...d, cajas: d.cajas.map(c => { if (isCajaEspecial(c)) return c; return { ...c, turnos: c.turnos.map(t => t.horario === editModal.initialValue ? { ...t, horario: newValue } : t) }; }) } : d));
    }
    setEditModal({ ...editModal, isOpen: false });
  };

  const abrirModalAsignacion = (cajaId: string, cajaNombre: string, turnoId: string, horario: string) => setModalAsignacion({ isOpen: true, cajaId, cajaNombre, turnoId, horario });
  const cerrarModalAsignacion = () => setModalAsignacion({ ...modalAsignacion, isOpen: false });

  const asignarUsuarioExistente = (participanteId: string) => {
    // IMPORTANTE: Aquí la actualización de la matriz (la estructura de turnos) debe hacerla el Capitán
    // por lo tanto, usamos updateDoc directo si es capitán, o syncEvent si es admin.
    const nuevosDias = dias.map((d, i) => i === diaActivo ? { ...d, cajas: d.cajas.map(c => c.id === modalAsignacion.cajaId ? { ...c, turnos: c.turnos.map(t => t.id === modalAsignacion.turnoId ? { ...t, participanteId } : t) } : c) } : d);
    updateDoc(doc(db, 'eventos', eventoId), { [`diasPorAdmin.${adminIdL}`]: nuevosDias });
    cerrarModalAsignacion();
  };

  const crearYAsignarUsuario = (nombre: string) => {
    const nuevoId = `part_${Date.now()}`;
    syncParticipantes([...participantes, { id: nuevoId, nombre, estado: 'Libre', linkUnico: `inv-${nuevoId}` }]);
    asignarUsuarioExistente(nuevoId);
  };

  const quitarParticipante = (cajaId: string, turnoId: string) => {
    const nuevosDias = dias.map((d, i) => i === diaActivo ? { ...d, cajas: d.cajas.map(c => c.id === cajaId ? { ...c, turnos: c.turnos.map(t => t.id === turnoId ? { ...t, participanteId: null } : t) } : c) } : d);
    updateDoc(doc(db, 'eventos', eventoId), { [`diasPorAdmin.${adminIdL}`]: nuevosDias });
  };

  const handleAbrirMiPerfil = () => { setUsuarioActivo(misDatosAdmin); setIsViewingSelf(true); setIsUsuarioModalOpen(true); };
  
  const handleAbrirPerfilParticipante = (id: string) => {
    const p = participantesEnriquecidos.find(x => x.id === id);
    if (p) { setUsuarioActivo({ id: p.id, name: p.nombre, role: 'Participante', phone: '', supportArea: p.ubicaciones?.join(', ') || 'Sin área asignada', notes: '' }); setIsViewingSelf(false); setIsUsuarioModalOpen(true); }
  };
  
  const handleCheckNameDuplicate = (name: string, currentId: string) => participantes.some(p => p.id !== currentId && p.nombre.trim().toLowerCase() === name.trim().toLowerCase());

  // --- LÓGICA DE CAPITANES (Solo manipulable por Admin) ---
  // --- LÓGICA DE CAPITANES (Solo manipulable por Admin) ---
  // --- LÓGICA DE CAPITANES (Solo manipulable por Admin) ---
  
  // Modificar handleCrearCapitan para que reciba diasAsignados
  const handleCrearCapitan = async (nombre: string, cajasAsignadas: string[], diasAsignados: string[], passwordSeguro: string) => {
    if (!eventoId || !adminIdL) return;

    const normalizeText = (text: string) => text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const nombreNormalizado = normalizeText(nombre);
    const existeDuplicado = capitanes.some(c => normalizeText(c.nombre) === nombreNormalizado);
    if (existeDuplicado) {
      showToast('Ya existe un capitán con ese nombre. Por favor elige otro.', 'error');
      return;
    }
    
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const randomString = Math.random().toString(36).substring(2, 8);
      const nuevoCapitan = {
        id: `cap_${Date.now()}_${randomString}`,
        nombre,
        usuario: `cap-${randomString.toUpperCase()}`,
        password: passwordSeguro,
        cajasAsignadas,
        diasAsignados, // <-- SE GUARDA LOS DIAS AQUI
        linkUnico: `inv-cap-${randomString}`
      };
      const actualizados = [...capitanes, nuevoCapitan];
      await updateDoc(docRef, { [`capitanesPorAdmin.${adminIdL}`]: actualizados });
      showToast('Capitán creado exitosamente.', 'success');
    } catch (error) { console.error(error); showToast('Error al crear el capitán.', 'error'); }
  };

  // NUEVA FUNCION PARA EDITAR
  const handleEditarCapitan = async (capitanId: string, nombre: string, diasAsignados: string[], cajasAsignadas: string[]) => {
    if (!eventoId || !adminIdL) return;
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const actualizados = capitanes.map(c => 
        c.id === capitanId ? { ...c, nombre, diasAsignados, cajasAsignadas } : c
      );
      await updateDoc(docRef, { [`capitanesPorAdmin.${adminIdL}`]: actualizados });
      showToast('Capitán actualizado exitosamente.', 'success');
    } catch (error) { console.error(error); showToast('Error al actualizar el capitán.', 'error'); }
  };

  const handleEliminarCapitan = async (capitanId: string) => {
    if (!eventoId || !adminIdL) return;
    try {
      const docRef = doc(db, 'eventos', eventoId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filtrados = capitanes.filter((c: any) => c.id !== capitanId);
      await updateDoc(docRef, { [`capitanesPorAdmin.${adminIdL}`]: filtrados });
      showToast('Capitán eliminado.', 'success');
    } catch (error) { console.error(error); showToast('Error al eliminar.', 'error'); }
  };

  return {
    dias, diaActivo, setDiaActivo, showDirectorio, setShowDirectorio, showCroquis, setShowCroquis,
    isEditingTitle, setIsEditingTitle, seccionName, setSeccionName, showSpecialModal, setShowSpecialModal,
    editModal, setEditModal, isUsuarioModalOpen, setIsUsuarioModalOpen, usuarioActivo, isViewingSelf, modalAsignacion,
    downloadModal, setDownloadModal, loading, 
    diaActual, participantesEnriquecidos, getParticipante, totalParticipantes: participantes.length,
    abrirModalAsignacion, cerrarModalAsignacion, asignarUsuarioExistente, crearYAsignarUsuario, quitarParticipante,
    handleCrearCaja, handleCrearCajaEspecial, handleCrearHorario, handleEliminarCaja, handleEliminarHorario,
    abrirEditor, handleSaveEdit, handleAbrirMiPerfil, handleAbrirPerfilParticipante,
    handleCheckNameDuplicate, createShiftModal, setCreateShiftModal, confirmarCrearHorario, horarioEditando, setHorarioEditando,
    clashModal, setClashModal, misDatosAdmin,
    capitanes, handleCrearCapitan, handleEliminarCapitan,handleEditarCapitan,
    // EXPORTAMOS LA DATA CLAVE PARA EL FILTRADO VISUAL
    isCapitan, cajasAsignadasCapitan
  };
};
import { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface AdminData {
  id: string;
  name: string;
  area: string;
  org: string;
  cajas: number;
  horarios: number;
  turnosTotales: number;
  necesarios: number;
  disponibles: number;
  inactivos: number;
  password?: string;
}

export interface EventoData {
  id: string;
  nombre: string;
  passwordGeneral: string;
  metodoGuardado: string;
  admins: AdminData[];
  createdAt?: string;
}

interface DeleteModalState {
  isOpen: boolean; type: 'evento' | 'admin' | null;
  eventoId: string | null; targetId: string | null; targetName: string;
}

export const useSuperAdminLogic = () => {
  const [eventos, setEventos] = useState<EventoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const colRef = collection(db, 'eventos');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const listaEventos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EventoData[];
      setEventos(listaEventos);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [showNewEvent, setShowNewEvent] = useState(false);
  const [nuevoEventoForm, setNuevoEventoForm] = useState({ nombre: '', passwordGeneral: '', metodoGuardado: 'Firebase (Recomendado)', numAdmins: '' });
  const [croquisModalState, setCroquisModalState] = useState(false);
  const [infoUsuarioState, setInfoUsuarioState] = useState<{isOpen: boolean, data: AdminData | null}>({ isOpen: false, data: null });
  const [downloadModalState, setDownloadModalState] = useState<{isOpen: boolean, adminId?: string}>({ isOpen: false });
  const [baseStructureModalState, setBaseStructureModalState] = useState(false);
  const [estructuraGuardada, setEstructuraGuardada] = useState<{ dias: string[], horarios: string[], cajas: string[] } | null>(null);
  const [deleteModalState, setDeleteModalState] = useState<DeleteModalState>({ isOpen: false, type: null, eventoId: null, targetId: null, targetName: '' });
  const [editEventModalState, setEditEventModalState] = useState<{isOpen: boolean, eventData: EventoData | null}>({ isOpen: false, eventData: null });

  const handleCrearEvento = async () => {
    if (!nuevoEventoForm.nombre.trim()) return alert("Por favor, ingresa un nombre.");

    const cantidadAdmins = parseInt(nuevoEventoForm.numAdmins) || 0;
    const nuevosAdmins: AdminData[] = [];
    const cantCajas = estructuraGuardada ? estructuraGuardada.cajas.length : 0;
    const cantHorarios = estructuraGuardada ? estructuraGuardada.horarios.length : 0;
    const totalTurnos = cantCajas * cantHorarios;

    for (let i = 0; i < cantidadAdmins; i++) {
      // ID MÁS CORTITO PARA EL LOGIN (Ej. admin-A3B9)
      const shortId = Math.random().toString(36).substring(2, 6).toUpperCase(); 
      nuevosAdmins.push({
        id: `admin-${shortId}`, 
        name: `Nuevo Admin ${i + 1}`, 
        area: 'Sin asignar', org: 'Sin asignar',
        cajas: cantCajas, horarios: cantHorarios, turnosTotales: totalTurnos, necesarios: totalTurnos, disponibles: totalTurnos,
        inactivos: 0, password: `admin${Math.floor(Math.random() * 1000)}`
      });
    }

    // CONSTRUIMOS LOS DÍAS A PARTIR DE LA ESTRUCTURA BASE PARA GUARDARLOS EN FIREBASE
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let diasIniciales: any[] = [];
    if (estructuraGuardada) {
      diasIniciales = estructuraGuardada.dias.map((nombreDia, index) => ({
        id: `d_${Date.now()}_${index}`,
        fecha: '',
        nombreDia: nombreDia,
        horariosMaestros: estructuraGuardada.horarios,
        cajas: estructuraGuardada.cajas.map((nombreCaja, cIndex) => ({
          id: `c_${Date.now()}_${cIndex}`,
          nombre: nombreCaja,
          esEspecial: false,
          turnos: estructuraGuardada.horarios.map(h => ({
            id: `t_${Date.now()}_${Math.random()}`,
            horario: h,
            participanteId: null
          }))
        }))
      }));
    }

    const nuevoEvento = {
      nombre: nuevoEventoForm.nombre,
      passwordGeneral: nuevoEventoForm.passwordGeneral,
      metodoGuardado: nuevoEventoForm.metodoGuardado,
      admins: nuevosAdmins,
      dias: diasIniciales, // <--- GUARDAMOS LA TABLA AQUÍ
      participantes: [],
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'eventos'), nuevoEvento);
      setNuevoEventoForm({ nombre: '', passwordGeneral: '', metodoGuardado: 'Firebase (Recomendado)', numAdmins: '' });
      setEstructuraGuardada(null); 
      setShowNewEvent(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al conectar con la nube.");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteModalState.type === 'evento' && deleteModalState.targetId) {
        await deleteDoc(doc(db, 'eventos', deleteModalState.targetId));
      } else if (deleteModalState.type === 'admin' && deleteModalState.eventoId && deleteModalState.targetId) {
        const ev = eventos.find(e => e.id === deleteModalState.eventoId);
        if (ev) {
          const nuevosAdmins = ev.admins.filter(a => a.id !== deleteModalState.targetId);
          await updateDoc(doc(db, 'eventos', deleteModalState.eventoId), { admins: nuevosAdmins });
        }
      }
    } catch {
      alert("No se pudo eliminar.");
    }
    setDeleteModalState({ isOpen: false, type: null, eventoId: null, targetId: null, targetName: '' });
  };

  const handleAddAdmin = async (eventoId: string) => {
    const ev = eventos.find(e => e.id === eventoId);
    if (!ev) return;

    const baseAdmin = ev.admins.length > 0 ? ev.admins[0] : null;
    const shortId = Math.random().toString(36).substring(2, 6).toUpperCase(); 
    const nuevoAdmin: AdminData = {
      id: `admin-${shortId}`,
      name: `Nuevo Admin ${ev.admins.length + 1}`,
      area: 'Sin asignar', org: 'Sin asignar',
      cajas: baseAdmin ? baseAdmin.cajas : 0, horarios: baseAdmin ? baseAdmin.horarios : 0, 
      turnosTotales: baseAdmin ? baseAdmin.turnosTotales : 0, necesarios: baseAdmin ? baseAdmin.turnosTotales : 0, 
      disponibles: baseAdmin ? baseAdmin.turnosTotales : 0, inactivos: 0, password: `admin${Math.floor(Math.random() * 1000)}`
    };

    await updateDoc(doc(db, 'eventos', eventoId), { admins: [...ev.admins, nuevoAdmin] });
  };

  const handleSaveEditEvent = async (editedEventData: EventoData) => {
    const { id, ...datosSinId } = editedEventData;
    await updateDoc(doc(db, 'eventos', id), datosSinId);
    setEditEventModalState({ isOpen: false, eventData: null });
  };

  const handleOpenAjustesAdmin = (adminData: AdminData) => setInfoUsuarioState({ isOpen: true, data: adminData });
  const handleGuardarAjustesAdmin = () => { setInfoUsuarioState({ isOpen: false, data: null }); };

  return {
    eventos, loading, showNewEvent, setShowNewEvent, nuevoEventoForm, setNuevoEventoForm, handleCrearEvento, 
    croquisModalState, setCroquisModalState, infoUsuarioState, setInfoUsuarioState, downloadModalState, setDownloadModalState, 
    baseStructureModalState, setBaseStructureModalState, estructuraGuardada, setEstructuraGuardada, deleteModalState, setDeleteModalState, 
    handleConfirmDelete, handleAddAdmin, editEventModalState, setEditEventModalState, handleSaveEditEvent,
    handleOpenAjustesAdmin, handleGuardarAjustesAdmin
  };
};
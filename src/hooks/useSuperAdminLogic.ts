import { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- 1. DEFINICIÓN ESTRICTA DE TIPOS ---
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
  isOpen: boolean;
  type: 'evento' | 'admin' | null;
  eventoId: string | null;
  targetId: string | null;
  targetName: string;
}

export const useSuperAdminLogic = () => {
  const [eventos, setEventos] = useState<EventoData[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 2. ESCUCHAR LA BASE DE DATOS EN TIEMPO REAL ---
  useEffect(() => {
    const colRef = collection(db, 'eventos');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const listaEventos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventoData[];
      setEventos(listaEventos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- ESTADOS DE LA INTERFAZ ---
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [nuevoEventoForm, setNuevoEventoForm] = useState({ nombre: '', passwordGeneral: '', metodoGuardado: 'Firebase (Recomendado)', numAdmins: '' });
  const [croquisModalState, setCroquisModalState] = useState(false);
  
  const [infoUsuarioState, setInfoUsuarioState] = useState<{isOpen: boolean, data: AdminData | null}>({ isOpen: false, data: null });
  const [downloadModalState, setDownloadModalState] = useState<{isOpen: boolean, adminId?: string}>({ isOpen: false });
  const [baseStructureModalState, setBaseStructureModalState] = useState(false);
  const [estructuraGuardada, setEstructuraGuardada] = useState<{ dias: string[], horarios: string[], cajas: string[] } | null>(null);
  
  const [deleteModalState, setDeleteModalState] = useState<DeleteModalState>({ isOpen: false, type: null, eventoId: null, targetId: null, targetName: '' });
  const [editEventModalState, setEditEventModalState] = useState<{isOpen: boolean, eventData: EventoData | null}>({ isOpen: false, eventData: null });

  // --- 3. CREAR EVENTO EN FIREBASE ---
  const handleCrearEvento = async () => {
    if (!nuevoEventoForm.nombre.trim()) return alert("Por favor, ingresa un nombre.");

    const cantidadAdmins = parseInt(nuevoEventoForm.numAdmins) || 0;
    const nuevosAdmins: AdminData[] = [];
    const cantCajas = estructuraGuardada ? estructuraGuardada.cajas.length : 0;
    const cantHorarios = estructuraGuardada ? estructuraGuardada.horarios.length : 0;
    const totalTurnos = cantCajas * cantHorarios;

    for (let i = 0; i < cantidadAdmins; i++) {
      nuevosAdmins.push({
        id: `admin_${Date.now()}_${i}`, 
        name: `Nuevo Admin ${i + 1}`, 
        area: 'Sin asignar', org: 'Sin asignar',
        cajas: cantCajas, horarios: cantHorarios, turnosTotales: totalTurnos, necesarios: totalTurnos, disponibles: totalTurnos,
        inactivos: 0, password: `admin${Math.floor(Math.random() * 1000)}`
      });
    }

    const nuevoEvento = {
      nombre: nuevoEventoForm.nombre,
      passwordGeneral: nuevoEventoForm.passwordGeneral,
      metodoGuardado: nuevoEventoForm.metodoGuardado,
      admins: nuevosAdmins,
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

  // --- 4. CONFIRMAR BORRADO EN FIREBASE ---
  // --- 4. CONFIRMAR BORRADO EN FIREBASE ---
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
    } catch { // <-- ¡AQUÍ ESTÁ EL CAMBIO! Solo borra la 'e' y los paréntesis
      alert("No se pudo eliminar.");
    }
    setDeleteModalState({ isOpen: false, type: null, eventoId: null, targetId: null, targetName: '' });
  };

  // --- 5. AÑADIR ADMIN A EVENTO EXISTENTE ---
  const handleAddAdmin = async (eventoId: string) => {
    const ev = eventos.find(e => e.id === eventoId);
    if (!ev) return;

    const baseAdmin = ev.admins.length > 0 ? ev.admins[0] : null;
    const nuevoAdmin: AdminData = {
      id: `admin_${Date.now()}`,
      name: `Nuevo Admin ${ev.admins.length + 1}`,
      area: 'Sin asignar', org: 'Sin asignar',
      cajas: baseAdmin ? baseAdmin.cajas : 0, 
      horarios: baseAdmin ? baseAdmin.horarios : 0, 
      turnosTotales: baseAdmin ? baseAdmin.turnosTotales : 0, 
      necesarios: baseAdmin ? baseAdmin.turnosTotales : 0, 
      disponibles: baseAdmin ? baseAdmin.turnosTotales : 0,
      inactivos: 0, password: `admin${Math.floor(Math.random() * 1000)}`
    };

    await updateDoc(doc(db, 'eventos', eventoId), {
      admins: [...ev.admins, nuevoAdmin]
    });
  };

  // --- 6. GUARDAR EDICIÓN DEL EVENTO ---
  const handleSaveEditEvent = async (editedEventData: EventoData) => {
    // Extraemos el id para no actualizarlo, y guardamos el resto
    const { id, ...datosSinId } = editedEventData;
    await updateDoc(doc(db, 'eventos', id), datosSinId);
    setEditEventModalState({ isOpen: false, eventData: null });
  };

  const handleOpenAjustesAdmin = (adminData: AdminData) => setInfoUsuarioState({ isOpen: true, data: adminData });
  
  // Solución al error de variable no usada: Quitamos el parámetro que no se usaba
  const handleGuardarAjustesAdmin = () => { 
    setInfoUsuarioState({ isOpen: false, data: null }); 
  };

  return {
    eventos, loading, showNewEvent, setShowNewEvent, nuevoEventoForm, setNuevoEventoForm, handleCrearEvento, 
    croquisModalState, setCroquisModalState, infoUsuarioState, setInfoUsuarioState,
    downloadModalState, setDownloadModalState, baseStructureModalState, setBaseStructureModalState,
    estructuraGuardada, setEstructuraGuardada, 
    deleteModalState, setDeleteModalState, handleConfirmDelete, 
    handleAddAdmin, editEventModalState, setEditEventModalState, handleSaveEditEvent,
    handleOpenAjustesAdmin, handleGuardarAjustesAdmin
  };
};
import { useState, useEffect } from 'react';
// 1. Importamos la conexión a la base de datos y las funciones de Firebase
import { db } from '../firebase'; 
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export const useSuperAdminLogic = () => {
  const [eventos, setEventos] = useState<any[]>([]); // Empezamos con lista vacía
  const [loading, setLoading] = useState(true); // Estado para saber si está cargando de la nube

  // --- 2. ESCUCHAR LA BASE DE DATOS EN TIEMPO REAL ---
  useEffect(() => {
    // Referencia a la colección "eventos" en Firebase
    const colRef = collection(db, 'eventos');

    // onSnapshot hace que si alguien cambia algo en la nube, tu app se actualice solita
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const listaEventos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEventos(listaEventos);
      setLoading(false);
    });

    return () => unsubscribe(); // Limpiamos al cerrar
  }, []);

  // --- ESTADOS DE LA INTERFAZ (Se mantienen igual) ---
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [nuevoEventoForm, setNuevoEventoForm] = useState({ nombre: '', passwordGeneral: '', metodoGuardado: 'Firebase (Recomendado)', numAdmins: '' });
  const [croquisModalState, setCroquisModalState] = useState(false);
  const [infoUsuarioState, setInfoUsuarioState] = useState<{isOpen: boolean, data: any}>({ isOpen: false, data: null });
  const [downloadModalState, setDownloadModalState] = useState<{isOpen: boolean, adminId?: string}>({ isOpen: false });
  const [baseStructureModalState, setBaseStructureModalState] = useState(false);
  const [estructuraGuardada, setEstructuraGuardada] = useState<{ dias: string[], horarios: string[], cajas: string[] } | null>(null);
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, type: 'evento' | 'admin' | null, eventoId: string | null, targetId: string | null, targetName: string}>({ isOpen: false, type: null, eventoId: null, targetId: null, targetName: '' });
  const [editEventModalState, setEditEventModalState] = useState<{isOpen: boolean, eventData: any}>({ isOpen: false, eventData: null });

  // --- 3. CREAR EVENTO EN FIREBASE ---
  const handleCrearEvento = async () => {
    if (!nuevoEventoForm.nombre.trim()) return alert("Por favor, ingresa un nombre.");

    const cantidadAdmins = parseInt(nuevoEventoForm.numAdmins) || 0;
    const nuevosAdmins: any[] = [];
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
      // Guardamos en Firebase
      await addDoc(collection(db, 'eventos'), nuevoEvento);
      
      // Limpiamos
      setNuevoEventoForm({ nombre: '', passwordGeneral: '', metodoGuardado: 'Firebase (Recomendado)', numAdmins: '' });
      setEstructuraGuardada(null); 
      setShowNewEvent(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al conectar con la nube.");
    }
  };

  // --- 4. CONFIRMAR BORRADO EN FIREBASE ---
  const handleConfirmDelete = async () => {
    try {
      if (deleteModalState.type === 'evento' && deleteModalState.targetId) {
        await deleteDoc(doc(db, 'eventos', deleteModalState.targetId));
      } else if (deleteModalState.type === 'admin' && deleteModalState.eventoId && deleteModalState.targetId) {
        const ev = eventos.find(e => e.id === deleteModalState.eventoId);
        const nuevosAdmins = ev.admins.filter((a: any) => a.id !== deleteModalState.targetId);
        await updateDoc(doc(db, 'eventos', deleteModalState.eventoId), { admins: nuevosAdmins });
      }
    } catch (e) {
      alert("No se pudo eliminar.");
    }
    setDeleteModalState({ isOpen: false, type: null, eventoId: null, targetId: null, targetName: '' });
  };

  // --- 5. AÑADIR ADMIN A EVENTO EXISTENTE ---
  const handleAddAdmin = async (eventoId: string) => {
    const ev = eventos.find(e => e.id === eventoId);
    if (!ev) return;

    const baseAdmin = ev.admins.length > 0 ? ev.admins[0] : null;
    const nuevoAdmin = {
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
  const handleSaveEditEvent = async (editedEventData: any) => {
    const { id, ...datosSinId } = editedEventData;
    await updateDoc(doc(db, 'eventos', id), datosSinId);
    setEditEventModalState({ isOpen: false, eventData: null });
  };

  const handleOpenAjustesAdmin = (adminData: any) => setInfoUsuarioState({ isOpen: true, data: adminData });
  const handleGuardarAjustesAdmin = (datosActualizados: any) => { 
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
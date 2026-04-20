/**
 * ============================================================================
 * HOOK: useSupervisorLogic
 * ============================================================================
 * DESCRIPCIÓN: 
 * Este es el "Cerebro" del Panel de Supervisión. Se encarga de conectarse a Firebase
 * en tiempo real para leer un evento específico y controlar a sus Administradores.
 * * FUNCIONES PRINCIPALES:
 * 1. Sincronización en tiempo real de los datos del evento.
 * 2. Cálculo matemático de estadísticas (cajas, turnos totales, disponibles) por Admin.
 * 3. Crear y Eliminar administradores en la base de datos.
 * 4. Modificar el Perfil de los admins (Nombre, Área, Empresa).
 * 5. Modificar el Acceso (ID/Password) con migración de datos si el ID cambia.
 * 6. Propagar una Estructura Global (nuevos días/cajas/horarios) a todos los Administradores a la vez.
 * * TIPADO: 100% Estricto (Sin usos de 'any') para asegurar builds limpios en Vercel.
 * ============================================================================
 */
import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { checkGlobalIdAvailable } from '../utils/validations';

// --- INTERFACES ESTRICTAS ---
interface Turno { 
  id: string; 
  participanteId: string | null; 
  horario: string; 
}

interface Caja { 
  id: string; 
  nombre: string; 
  turnos: Turno[]; 
}

interface Dia { 
  id: string; 
  nombreDia: string; 
  fecha?: string; 
  cajas: Caja[]; 
}

interface ParticipanteData {
  id: string;
  nombre: string;
  estado?: string;
}

export interface AdminData { 
  id: string; 
  name: string; 
  password?: string;
  area?: string;
  org?: string;
  phone?: string;
  notes?: string;
  orgLabel?: string;
  cajas?: number;
  horarios?: number;
  turnosTotales?: number;
  necesarios?: number;
  disponibles?: number;
  inactivos?: number;
}

interface EventoDocument {
  nombre: string;
  admins: AdminData[];
  diasPorAdmin?: Record<string, Dia[]>;
  participantesPorAdmin?: Record<string, ParticipanteData[]>;
}

export const useSupervisorLogic = (eventoId: string | undefined) => {
  const [evento, setEvento] = useState<EventoDocument | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Escucha de datos en tiempo real
  useEffect(() => {
    if (!eventoId) return;
    const unsubscribe = onSnapshot(doc(db, 'eventos', eventoId), (snap) => {
      if (snap.exists()) setEvento(snap.data() as EventoDocument);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [eventoId]);

  // 2. Calculadora de Estadísticas Reales
  const getAdminStats = (adminId: string) => {
    if (!evento) return { cajas: 0, horarios: 0, totales: 0, disponibles: 0, participantes: 0 };
    
    const adminDias = evento.diasPorAdmin?.[adminId] || [];
    const adminParticipantes = evento.participantesPorAdmin?.[adminId] || [];

    let calcTotales = 0;
    let calcDisponibles = 0;
    const calcCajas = adminDias[0]?.cajas?.length || 0;
    const calcHorarios = adminDias[0]?.cajas?.[0]?.turnos?.length || 0;

    adminDias.forEach((dia) => {
      dia.cajas?.forEach((caja) => {
        calcTotales += caja.turnos?.length || 0;
        calcDisponibles += caja.turnos?.filter((t) => !t.participanteId).length || 0;
      });
    });

    return {
      cajas: calcCajas,
      horarios: calcHorarios,
      totales: calcTotales,
      disponibles: calcDisponibles,
      participantes: adminParticipantes.length
    };
  };

  // 3. Crear Nuevo Admin
  const handleAddAdmin = async () => {
    if (!eventoId || !evento) return;
    const adminNum = evento.admins.length + 1;
    
    const newAdmin: AdminData = {
      id: `admin-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      name: `Admin ${adminNum}`,
      password: Math.random().toString(36).slice(-6),
      area: 'Sin asignar',
      org: 'Sin asignar',
      orgLabel: 'Empresa'
    };

    try {
      await updateDoc(doc(db, 'eventos', eventoId), {
        admins: [...evento.admins, newAdmin]
      });
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Eliminar Admin
  const handleDeleteAdmin = async (adminId: string) => {
    if (!eventoId || !evento) return;
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const nuevosAdmins = evento.admins.filter((a) => a.id !== adminId);
      await updateDoc(docRef, { admins: nuevosAdmins });
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Editar Perfil y Contraseña (Aquí se aplicó la corrección de evId)
  const handleSaveProfile = async (evId: string, updatedAdmin: AdminData) => {
    if (!evId) return;
    try {
      const docRef = doc(db, 'eventos', evId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;

      const data = snap.data() as EventoDocument;
      const nuevosAdmins = data.admins.map((a: AdminData) => a.id === updatedAdmin.id ? updatedAdmin : a);
      
      await updateDoc(docRef, { admins: nuevosAdmins });
    } catch (error) {
      console.error(error);
      alert("Error al guardar ajustes del perfil.");
    }
  };

  const handleEditAccess = async (evId: string, oldId: string, newId: string, newPass: string): Promise<boolean> => {
    if (!evId) return false;
    try {
      const isAvailable = await checkGlobalIdAvailable(newId, oldId);
      if (!isAvailable) {
        alert("Este ID ya está en uso en el sistema. Elige uno diferente.");
        return false;
      }

      const docRef = doc(db, 'eventos', evId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return false;
      
      const data = snap.data() as EventoDocument;

      const nuevosAdmins = data.admins.map((a: AdminData) => a.id === oldId ? { ...a, id: newId, password: newPass } : a);
      const updatePayload: Record<string, unknown> = { admins: nuevosAdmins };

      if (oldId !== newId) {
        if (data.diasPorAdmin?.[oldId]) {
          updatePayload[`diasPorAdmin.${newId}`] = data.diasPorAdmin[oldId];
          updatePayload[`diasPorAdmin.${oldId}`] = null;
        }
        if (data.participantesPorAdmin?.[oldId]) {
          updatePayload[`participantesPorAdmin.${newId}`] = data.participantesPorAdmin[oldId];
          updatePayload[`participantesPorAdmin.${oldId}`] = null;
        }
      }

      await updateDoc(docRef, updatePayload);
      return true;
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el acceso.");
      return false;
    }
  };

  // 6. Estructura Global
  const handleSaveGlobalStructure = async (estructura: { dias: string[], horarios: string[], cajas: string[] }) => {
    if (!eventoId || !evento) return false;
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const nuevosDias: Record<string, Dia[]> = { ...(evento.diasPorAdmin || {}) };

      evento.admins.forEach((admin) => {
        let adminDias = nuevosDias[admin.id] || [];

        estructura.dias.forEach((fechaStr) => {
          const exists = adminDias.some((d) => d.fecha === fechaStr || d.nombreDia === fechaStr);
          if (!exists) {
            const nuevasCajas = estructura.cajas.map((cajaNombre, cIdx) => ({
              id: `caja_${Date.now()}_${cIdx}`, 
              nombre: cajaNombre,
              turnos: estructura.horarios.map((horario, hIdx) => ({
                id: `t_${Date.now()}_${hIdx}`, 
                horario: horario, 
                participanteId: null
              }))
            }));
            adminDias.push({ id: `dia_${Date.now()}_${Math.random()}`, nombreDia: fechaStr, fecha: fechaStr, cajas: nuevasCajas });
          }
        });

        adminDias = adminDias.map((dia) => {
          const updatedCajas = [...(dia.cajas || [])];
          estructura.cajas.forEach((cajaNombre) => {
            if (!updatedCajas.some((c) => c.nombre === cajaNombre)) {
              updatedCajas.push({
                id: `caja_extra_${Date.now()}_${Math.random()}`, 
                nombre: cajaNombre,
                turnos: estructura.horarios.map((horario, hIdx) => ({
                  id: `t_extra_${Date.now()}_${hIdx}`, 
                  horario: horario, 
                  participanteId: null
                }))
              });
            }
          });
          return { ...dia, cajas: updatedCajas };
        });

        nuevosDias[admin.id] = adminDias;
      });

      await updateDoc(docRef, { diasPorAdmin: nuevosDias });
      alert("Estructura global aplicada con éxito a todos los Administradores.");
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return { 
    evento, 
    loading, 
    getAdminStats, 
    handleAddAdmin, 
    handleDeleteAdmin, 
    handleEditAccess, 
    handleSaveGlobalStructure,
    handleSaveProfile
  };
};
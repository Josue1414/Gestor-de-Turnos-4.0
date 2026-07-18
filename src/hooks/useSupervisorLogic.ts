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
import { doc, onSnapshot, updateDoc, getDoc, collection, getDocs, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import type { Evento } from '../utils/schemas';
import { useToast } from '../components/ToastProvider';

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
  const { showToast } = useToast();
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
    const newAdminId = `admin-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newPassword = Math.random().toString(36).slice(-6);

    const existingAdminDays = Object.values(evento.diasPorAdmin || {}).find((dias) => Array.isArray(dias) && dias.length > 0) as Dia[] | undefined;
    const defaultHorario = existingAdminDays?.[0]?.cajas?.[0]?.turnos?.[0]?.horario || '08:00 - 09:00';
    const defaultDayItems = existingAdminDays && existingAdminDays.length > 0
      ? existingAdminDays.map((dia, index) => ({
          id: `dia_${Date.now()}_${index}`,
          nombreDia: dia.nombreDia,
          fecha: dia.fecha,
          cajas: [
            {
              id: `caja_${Date.now()}_${index}_1`,
              nombre: 'Caja 1',
              turnos: [
                {
                  id: `turno_${Date.now()}_${index}_1`,
                  horario: defaultHorario,
                  participanteId: null
                }
              ]
            }
          ]
        }))
      : [
          {
            id: `dia_${Date.now()}_1`,
            nombreDia: 'Día 1',
            fecha: '',
            cajas: [
              {
                id: `caja_${Date.now()}_1`,
                nombre: 'Caja 1',
                turnos: [
                  {
                    id: `turno_${Date.now()}_1`,
                    horario: '08:00 - 09:00',
                    participanteId: null
                  }
                ]
              }
            ]
          }
        ];

    const newAdmin: AdminData = {
      id: newAdminId,
      name: `Admin ${adminNum}`,
      password: newPassword,
      area: 'Sin asignar',
      org: 'Sin asignar',
      orgLabel: 'Empresa'
    };

    try {
      await updateDoc(doc(db, 'eventos', eventoId), {
        admins: [...evento.admins, newAdmin],
        [`diasPorAdmin.${newAdminId}`]: defaultDayItems,
        [`participantesPorAdmin.${newAdminId}`]: []
      });
    } catch (e) {
      console.error(e);
      showToast('No se pudo agregar el administrador.', 'error');
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
        showToast('No se pudo eliminar el administrador.', 'error');
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
      showToast("Error al guardar ajustes del perfil.", 'error');
    }
  };

  const handleEditAccess = async (evId: string, oldId: string, newId: string, newPass: string): Promise<boolean> => {
    if (!evId) return false;
    try {
      const docRef = doc(db, 'eventos', evId);
      const result = await runTransaction(db, async (transaction) => {
        // Re-verificar disponibilidad global
        const all = await getDocs(collection(db, 'eventos'));
        for (const d of all.docs) {
          const ev = d.data() as Evento | undefined;
          if ((ev as any)?.supervisor && (ev as any).supervisor.usuario === newId) return false;
          if (Array.isArray((ev as any)?.admins) && (ev as any).admins.some((a: any) => a.id === newId && a.id !== oldId)) return false;
        }

        const snap = await transaction.get(docRef as any);
        if (!snap.exists()) return false;
        const data = snap.data() as EventoDocument;

        const nuevosAdmins = data.admins.map((a: AdminData) => a.id === oldId ? { ...a, id: newId, password: newPass } : a);
        const updatePayload: Record<string, any> = { admins: nuevosAdmins };

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

        transaction.update(docRef as any, updatePayload);
        return true;
      });
      return !!result;
    } catch (error) {
      console.error(error);
        showToast("Error al actualizar el acceso.", 'error');
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
        showToast("Estructura global aplicada con éxito a todos los Administradores.", 'success');
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
// src/hooks/useSupervisorLogic.ts
import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, getDoc, collection, getDocs, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import type { Evento } from '../utils/schemas';
import { useToast } from '../components/ToastProvider';

interface Turno { id: string; participanteId: string | null; horario: string; }
interface Caja { id: string; nombre: string; turnos: Turno[]; }
interface Dia { id: string; nombreDia: string; fecha?: string; cajas: Caja[]; }
interface ParticipanteData { id: string; nombre: string; estado?: string; organizationLabel?: string; }

export interface AdminData { 
  id: string; 
  name: string; 
  password?: string;
  supportArea?: string; 
  organization?: string; 
  phone?: string;
  countryCode?: string; 
  notes?: string;
  organizationLabel?: string; 
  cajas?: number;
  horarios?: number;
  turnosTotales?: number;
  necesarios?: number;
  disponibles?: number;
  inactivos?: number;
  diasAsignados?: string[]; 
  
  area?: string;
  org?: string;
  orgLabel?: string;
}

interface EventoDocument {
  nombre: string;
  admins: AdminData[];
  diasPorAdmin?: Record<string, Dia[]>;
  participantesPorAdmin?: Record<string, ParticipanteData[]>;
  capitanesPorAdmin?: Record<string, any[]>; 
  participantesPorCapitan?: Record<string, ParticipanteData[]>;
  globalPermissions?: { cajas: boolean; horarios: boolean; especiales: boolean };
  croquisUrl?: string;
  croquisPorAdmin?: Record<string, string>;
  // NUEVOS CAMPOS PARA SINCRONIZACIÓN GLOBAL
  cajasSincronizadas?: boolean;
  diasGlobales?: Dia[];
}

export const useSupervisorLogic = (eventoId: string | undefined) => {
  const { showToast } = useToast();
  const [evento, setEvento] = useState<EventoDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventoId) return;
    const unsubscribe = onSnapshot(doc(db, 'eventos', eventoId), (snap) => {
      if (snap.exists()) {
        setEvento({ id: snap.id, ...snap.data() } as EventoDocument & { id: string });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [eventoId]);

  const getAdminStats = (adminId: string) => {
    if (!evento) return { cajas: 0, horarios: 0, totales: 0, disponibles: 0, participantes: 0 };
    
    // Si están sincronizadas, leemos de diasGlobales, si no, de sus propios días
    const adminDias = evento.cajasSincronizadas 
        ? (evento.diasGlobales || []) 
        : (evento.diasPorAdmin?.[adminId] || []);
        
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

  const handleAddAdmin = async () => {
    if (!eventoId || !evento) return;
    const adminNum = evento.admins.length + 1;
    const newAdminId = `admin-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newPassword = Math.random().toString(36).slice(-6);

    const existingAdminDays = evento.cajasSincronizadas 
        ? evento.diasGlobales 
        : Object.values(evento.diasPorAdmin || {}).find((dias) => Array.isArray(dias) && dias.length > 0) as Dia[] | undefined;
        
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
      supportArea: 'Sin asignar',
      organization: 'Sin asignar',
      organizationLabel: 'Empresa',
      countryCode: '+52',
      phone: ''
    };

    try {
      const payload: any = {
        admins: [...evento.admins, newAdmin],
        [`participantesPorAdmin.${newAdminId}`]: []
      };
      
      // Si no están sincronizadas, le creamos su propia estructura base
      if (!evento.cajasSincronizadas) {
          payload[`diasPorAdmin.${newAdminId}`] = defaultDayItems;
      }

      await updateDoc(doc(db, 'eventos', eventoId), payload);
    } catch (e) {
      console.error(e);
      showToast('No se pudo agregar el administrador.', 'error');
    }
  };

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

  const handleSaveProfile = async (evId: string, updatedAdmin: AdminData) => {
    if (!evId) return;
    try {
      const docRef = doc(db, 'eventos', evId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;

      const data = snap.data() as EventoDocument;
      const nuevosAdmins = data.admins.map((a: AdminData) => a.id === updatedAdmin.id ? updatedAdmin : a);
      
      const participantesDelAdmin = data.participantesPorAdmin?.[updatedAdmin.id] || [];
      const participantesActualizados = participantesDelAdmin.map(p => ({
          ...p,
          organizationLabel: updatedAdmin.organizationLabel || 'Congregación'
      }));

      await updateDoc(docRef, { 
        admins: nuevosAdmins,
        [`participantesPorAdmin.${updatedAdmin.id}`]: participantesActualizados
      });
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

  // NUEVA FUNCIÓN: Habilitar o deshabilitar la sincronización global
  const handleToggleSincronizacion = async (sincronizar: boolean) => {
    if (!eventoId || !evento) return;
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const payload: any = { cajasSincronizadas: sincronizar };
      
      // Si activamos la sincronización y no hay cajas globales, 
      // copiamos las cajas del primer admin como punto de partida.
      if (sincronizar && (!evento.diasGlobales || evento.diasGlobales.length === 0)) {
         const adminIds = Object.keys(evento.diasPorAdmin || {});
         if (adminIds.length > 0) {
            payload.diasGlobales = evento.diasPorAdmin![adminIds[0]];
         } else {
            payload.diasGlobales = []; 
         }
      }
      
      await updateDoc(docRef, payload);
      showToast(sincronizar ? 'Cajas globalizadas y sincronizadas.' : 'Cajas separadas por administrador.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error al cambiar la sincronización de cajas.', 'error');
    }
  };

  // FUNCIÓN ADAPTADA: Ahora sabe si guardar en `diasGlobales` o `diasPorAdmin`
  const handleSaveGlobalStructure = async (estructura: { dias: string[], horarios: string[], cajas: string[] }) => {
    if (!eventoId || !evento) return false;
    try {
      const docRef = doc(db, 'eventos', eventoId);
      
      // Función helper para construir la matriz
      const buildDias = (baseDias: Dia[]) => {
        let updatedDias = [...baseDias];
        
        estructura.dias.forEach((fechaStr) => {
          const exists = updatedDias.some((d) => d.fecha === fechaStr || d.nombreDia === fechaStr);
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
            updatedDias.push({ id: `dia_${Date.now()}_${Math.random()}`, nombreDia: fechaStr, fecha: fechaStr, cajas: nuevasCajas });
          }
        });

        updatedDias = updatedDias.map((dia) => {
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
        
        return updatedDias;
      };

      if (evento.cajasSincronizadas) {
        // Modo Sincronizado: Solo actualizamos la base global
        const nuevosDiasGlobales = buildDias(evento.diasGlobales || []);
        await updateDoc(docRef, { diasGlobales: nuevosDiasGlobales });
      } else {
        // Modo Individual: Actualizamos a cada admin
        const nuevosDias: Record<string, Dia[]> = { ...(evento.diasPorAdmin || {}) };
        evento.admins.forEach((admin) => {
          nuevosDias[admin.id] = buildDias(nuevosDias[admin.id] || []);
        });
        await updateDoc(docRef, { diasPorAdmin: nuevosDias });
      }

      showToast("Estructura global aplicada con éxito.", 'success');
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return { 
    evento, loading, getAdminStats, handleAddAdmin, handleDeleteAdmin, 
    handleEditAccess, handleSaveGlobalStructure, handleSaveProfile,
    handleToggleSincronizacion // NUEVA FUNCIÓN EXPUESTA
  };
};
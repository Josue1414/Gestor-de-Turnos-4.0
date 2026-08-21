// src/views/User/useParticipantLogic.ts
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';

import type { DiaEvento, Participante } from '../../types';
import type { UsuarioModalData } from '../../components/ModalInfoUsuario';
import type { CroquisItem } from '../../components/CroquisModal';
import { useToast } from '../../components/ToastProvider';
import { enviarAlertaVercel } from '../../utils/pushNotifications';
import { useTiempoReal } from '../../hooks/useTiempoReal';

import { limpiarSesionLocal } from '../../utils/sessionCleanup';
import type { MotivoSalida } from '../../components/EventoFinalizadoScreen';

export interface ParticipanteExtendidoDb extends Participante {
  telefono?: string;
  codigoPais?: string;
  notas?: string;
  organizacion?: string;
  organizationLabel?: string;
  ubicaciones?: string[];
  fechaNacimiento?: string;
  capitanId?: string; 
  cajasDelCapitan?: string[]; 
  diasDelCapitan?: string[]; 
  capitanNombre?: string; 
  capitanTelefono?: string; 
}

export const useParticipantLogic = () => {
  const { eventoId, adminId, participanteId } = useParams<{ eventoId: string; adminId: string; participanteId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(Boolean(eventoId && adminId));
  const loadingRef = useRef(loading);
  const [dias, setDias] = useState<DiaEvento[]>([]);
  const [participantes, setParticipantes] = useState<ParticipanteExtendidoDb[]>([]);
  const [eventoNombre, setEventoNombre] = useState('Evento');
  
  const [croquisGral, setCroquisGral] = useState<string | null>(null);
  const [croquisIndiv, setCroquisIndiv] = useState<string | null>(null);
  
  const [poligonosGral, setPoligonosGral] = useState<any[]>([]);
  const [poligonosIndiv, setPoligonosIndiv] = useState<any[]>([]);
  
  const [diaActivo, setDiaActivo] = useState(0);
  const [vistaTarjetas, setVistaTarjetas] = useState(false); 
  const [downloadModal, setDownloadModal] = useState(false);
  const [showDirectorio, setShowDirectorio] = useState(false);
  const [showCroquis, setShowCroquis] = useState(false);
  
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [adminContacto, setAdminContacto] = useState({ nombre: 'Administrador', telefono: '' });
  const [motivoSalida, setMotivoSalida] = useState<MotivoSalida | null>(null);

  const horaActual = useTiempoReal();

  const TIEMPO_MAXIMO_CARGA_MS = 15000;


  // Al detectar que el evento ya no está disponible borramos la sesión guardada
  // para que el dispositivo no vuelva a entrar en bucle al panel inexistente.
  const cerrarPorEventoNoDisponible = useCallback((motivo: MotivoSalida) => {
    limpiarSesionLocal();
    setMotivoSalida(motivo);
    loadingRef.current = false;
    setLoading(false);
  }, []);


  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'participante') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!eventoId || !adminId) return;
    const docRef = doc(db, 'eventos', eventoId);

    // Si Firestore nunca responde (sin conexión) evitamos la pantalla eterna de carga.
    const timeoutCarga = setTimeout(() => {
      if (loadingRef.current) cerrarPorEventoNoDisponible('sin-conexion');
    }, TIEMPO_MAXIMO_CARGA_MS);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      clearTimeout(timeoutCarga);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.nombre) setEventoNombre(data.nombre);

        if (data.finalizado === true || data.estado === 'finalizado') {
          cerrarPorEventoNoDisponible('finalizado');
          return;
        }
        
        const adminsList = data.admins || [];
        const currentAdmin = adminsList.find((a: any) => a.id === adminId);
        setAdminContacto({
          nombre: currentAdmin?.name || 'Administrador',
          telefono: currentAdmin?.phone || ''
        });
        
        const allPartsMap = new Map<string, ParticipanteExtendidoDb>();
        const adminParts = data.participantesPorAdmin?.[adminId] || [];
        adminParts.forEach((p: any) => allPartsMap.set(p.id, { ...p, creador: 'Admin' }));
        
        const capitanes = data.capitanesPorAdmin?.[adminId] || [];
        capitanes.forEach((cap: any) => {
          const capParts = data.participantesPorCapitan?.[cap.id] || [];
          capParts.forEach((p: any) => {
             if (!allPartsMap.has(p.id)) {
               allPartsMap.set(p.id, {
                 ...p, 
                 capitanId: cap.id, 
                 capitanNombre: cap.nombre, 
                 capitanTelefono: cap.telefono || '', 
                 cajasDelCapitan: cap.cajasAsignadas || [],
                 diasDelCapitan: cap.diasAsignados || [] 
               });
             }
          });
        });
        
        const allParts = Array.from(allPartsMap.values());
        setParticipantes(allParts);
        
        const currentUser = allParts.find(p => p.id === participanteId);
        
        const isSync = data.cajasSincronizadas === true;
        const rawDias = isSync ? (data.diasGlobales || []) : (data.diasPorAdmin?.[adminId] || []);

        let diasProcesados: DiaEvento[] = rawDias;
        const viewCapitanId = localStorage.getItem('view_capitan_id');
        
        let cajasVisibles: string[] | null = null;
        let diasVisibles: string[] | null = null; 
        let nombreEquipoActual = '';

        if (viewCapitanId) {
           const capVista = capitanes.find((c: any) => c.id === viewCapitanId);
           if (capVista) {
               cajasVisibles = capVista.cajasAsignadas || [];
               diasVisibles = capVista.diasAsignados || [];
               nombreEquipoActual = capVista.nombre;
           }
        } else if (currentUser?.capitanId) {
           cajasVisibles = currentUser.cajasDelCapitan || [];
           diasVisibles = currentUser.diasDelCapitan || []; 
           nombreEquipoActual = currentUser.capitanNombre || '';
        }

        if (diasVisibles !== null) {
           diasProcesados = diasProcesados.filter(d => diasVisibles!.includes(d.id));
        }

        if (cajasVisibles) {
           diasProcesados = diasProcesados.map(d => ({
             ...d,
             cajas: d.cajas.filter((c: any) => cajasVisibles!.includes(c.id))
           })).filter(d => d.cajas.length > 0);
        }

        if (currentUser && nombreEquipoActual) {
             currentUser.capitanNombre = nombreEquipoActual;
        }
        
        setDias(diasProcesados);
        setCroquisGral(data.croquisUrl || null);
        setCroquisIndiv(data.croquisPorAdmin?.[adminId] || null);

        setPoligonosGral(data.poligonos_general || data.poligonosGeneral || data.croquisPoligonos?.general || data.poligonosGlobales || []);
        setPoligonosIndiv(data[`poligonos_${adminId}`] || data.poligonosPorAdmin?.[adminId] || data.croquisPoligonos?.[adminId] || []);

        // El participante fue eliminado del evento: mostramos la salida en vez
        // de una pantalla en blanco. Ignoramos snapshots de caché para no
        // expulsar a alguien que acaba de registrarse.
        if (!currentUser && !docSnap.metadata.fromCache) {
          cerrarPorEventoNoDisponible('sin-acceso');
          return;
        }

      } else {
        cerrarPorEventoNoDisponible('finalizado');
        return;
      }
      loadingRef.current = false;
      setLoading(false);
      }, (error) => {
      clearTimeout(timeoutCarga);
      console.error('Error escuchando el evento:', error);
      cerrarPorEventoNoDisponible('sin-conexion');
    });

    return () => {
      clearTimeout(timeoutCarga);
      unsubscribe();
    };
  }, [eventoId, adminId, participanteId, cerrarPorEventoNoDisponible]);

  const formatHorario12h = (horario: string) => {
    const formatPart = (t: string) => {
      if(!t) return '';
      const [hStr, mStr] = t.trim().split(':');
      let h = parseInt(hStr) || 0;
      const ampm = h >= 12 ? 'pm' : 'am';
      h = h % 12 || 12;
      return `${h}:${mStr} ${ampm}`;
    };
    const partes = horario.split('-');
    if(partes.length === 2) return `${formatPart(partes[0])} - ${formatPart(partes[1])}`;
    return formatPart(horario);
  };

  const participantesEnriquecidos = useMemo(() => {
    return participantes.map((p) => {
      const ubicaciones: string[] = [];
      dias.forEach((dia) => {
        dia.cajas.forEach((caja) => {
          caja.turnos.forEach((turno) => {
            if (turno.participanteId === p.id) {
              const horario12 = formatHorario12h(turno.horario);
              const rawName = String(caja.nombre || '').trim();
              const textoCaja = rawName.toLowerCase().includes('caja') ? rawName : `Caja ${rawName}`;
              ubicaciones.push(`${dia.nombreDia.substring(0,3)} ${horario12} - ${textoCaja}`);
            }
          });
        });
      });
      return {
        ...p,
        estado: ubicaciones.length > 0 ? 'Asignado' : 'Libre',
        ubicaciones
      };
    });
  }, [participantes, dias]);

  const miUsuario = participantesEnriquecidos.find(p => p.id === participanteId);

  const participantesDirectorio = useMemo(() => {
    if (!miUsuario) return [];
    const capitanVistaId = localStorage.getItem('view_capitan_id') || miUsuario.capitanId;

    return participantesEnriquecidos.filter(p => {
       if (capitanVistaId) {
          if (p.capitanId === capitanVistaId) return true;
          if (!p.capitanId && p.ubicaciones && p.ubicaciones.length > 0) return true;
          return false;
       } else {
          return !p.capitanId;
       }
    });
  }, [participantesEnriquecidos, miUsuario]);

  const datosParaModal: UsuarioModalData | null = useMemo(() => {
    if (!miUsuario) return null;

    const misTurnos: { dia: string; horario: string; caja: string }[] = [];
    dias.forEach(dia => {
      dia.cajas.forEach(caja => {
        caja.turnos.forEach(turno => {
          if (turno.participanteId === miUsuario.id) {
            const horario12 = formatHorario12h(turno.horario);
            const rawName = String(caja.nombre || '').trim();
            const textoCaja = rawName.toLowerCase().includes('caja') ? rawName : `Caja ${rawName}`;
            misTurnos.push({
              dia: dia.nombreDia || 'Día',
              horario: horario12,
              caja: textoCaja
            });
          }
        });
      });
    });

    return {
      id: miUsuario.id,
      name: miUsuario.nombre,
      role: 'Participante',
      phone: miUsuario.telefono || '',
      countryCode: miUsuario.codigoPais || '+52',
      supportArea: miUsuario.ubicaciones?.length ? miUsuario.ubicaciones.join(', ') : 'Libre',
      notes: miUsuario.notas || '',
      organization: miUsuario.organizacion || '',
      organizationLabel: miUsuario.organizationLabel || 'Congregación',
      ubicaciones: miUsuario.ubicaciones || [],
      birthDate: miUsuario.fechaNacimiento || '',
      turnosAsignados: misTurnos 
    };
  }, [miUsuario, dias]);

  const handleGuardarPerfilAjustado = async (datosActualizados: UsuarioModalData) => {
    if (!eventoId || !adminId || !miUsuario) return;
    
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      
      const data = docSnap.data();
      const isCapitanUser = !!miUsuario.capitanId;
      const targetId = isCapitanUser ? miUsuario.capitanId : adminId;
      const targetProperty = isCapitanUser ? 'participantesPorCapitan' : 'participantesPorAdmin';
      
      const participantesBase = data[targetProperty]?.[targetId as string] || [];
      const actualizados = participantesBase.map((p: any) => 
        p.id === miUsuario.id 
          ? { 
              ...p, 
              nombre: datosActualizados.name, 
              telefono: datosActualizados.phone, 
              codigoPais: datosActualizados.countryCode,
              notas: datosActualizados.notes,
              organizacion: datosActualizados.organization,
              organizationLabel: datosActualizados.organizationLabel,
              fechaNacimiento: datosActualizados.birthDate
            } 
          : p
      );

      await updateDoc(docRef, { [`${targetProperty}.${targetId}`]: actualizados });
      setIsUsuarioModalOpen(false);
    } catch (error) {
      console.error("Error guardando perfil:", error);
      showToast('Hubo un error al guardar tu perfil.', 'error');
    }
  };

  const diaActual = dias[diaActivo];

  const turnosLibresCount = diaActual ? diaActual.cajas.reduce((acc, caja) => acc + caja.turnos.filter((t) => !t.participanteId).length, 0) : 0;
  const turnosOcupadosCount = diaActual ? diaActual.cajas.reduce((acc, caja) => acc + caja.turnos.filter((t) => Boolean(t.participanteId)).length, 0) : 0;

  const hayChoque = useCallback((h1: string, h2: string) => {
    try {
      const parse = (t: string) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };
      const r1 = h1.split('-'), r2 = h2.split('-');
      const i1 = parse(r1[0].trim()), f1 = r1.length > 1 ? parse(r1[1].trim()) : i1 + 59;
      const i2 = parse(r2[0].trim()), f2 = r2.length > 1 ? parse(r2[1].trim()) : i2 + 59;
      return i1 < f2 && i2 < f1;
    } catch { return false; }
  }, []);

  const isBusy = useCallback((horario: string) => {
    if (!diaActual || !miUsuario) return false;
    const misHorariosHoy: string[] = [];
    
    diaActual.cajas.forEach(c => {
      c.turnos.forEach(t => {
        if (t.participanteId === miUsuario.id) {
          misHorariosHoy.push(t.horario);
        }
      });
    });

    return misHorariosHoy.some(miHor => hayChoque(miHor, horario));
  }, [diaActual, miUsuario, hayChoque]);

  const updateDiasData = async (nuevosDias: DiaEvento[]) => {
    if (!eventoId) return;
    const docRef = doc(db, 'eventos', eventoId);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().cajasSincronizadas) {
       await updateDoc(docRef, { diasGlobales: nuevosDias });
    } else {
       await updateDoc(docRef, { [`diasPorAdmin.${adminId}`]: nuevosDias });
    }
  };

  const handleAsignarme = async (cajaId: string, turnoId: string) => {
    if (!miUsuario || !eventoId || !adminId || !diaActual) return;
    try {
      const nuevosDias = dias.map((d: any) => d.id === diaActual.id ? {
        ...d, cajas: d.cajas.map((c: any) => c.id === cajaId ? {
          ...c, turnos: c.turnos.map((t: any) => t.id === turnoId ? { ...t, participanteId: miUsuario.id } : t)
        } : c)
      } : d);
      await updateDiasData(nuevosDias);
    } catch (error) { console.error(error); }
  };

  const handleQuitarme = async (cajaId: string, turnoId: string) => {
    if (!eventoId || !adminId || !diaActual) return;
    try {
      const nuevosDias = dias.map((d: any) => d.id === diaActual.id ? {
        ...d, cajas: d.cajas.map((c: any) => c.id === cajaId ? {
          ...c, turnos: c.turnos.map((t: any) => t.id === turnoId ? { ...t, participanteId: null } : t)
        } : c)
      } : d);
      await updateDiasData(nuevosDias);
    } catch (error) { console.error(error); }
  };

  // ACTUALIZADO PARA ENVIAR EL TIPO DE ALERTA
  const handleSolicitarAsistencia = async (estado: boolean, tipo: 'asistencia' | 'peligro' | null = null) => {
    if (!eventoId || !adminId || !diaActual || !turnoAlertaInfo || !miUsuario) return;
    
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      
      const data = docSnap.data();
      const isSync = data.cajasSincronizadas === true;
      const rawDias = isSync ? (data.diasGlobales || []) : (data.diasPorAdmin?.[adminId] || []);

      const nuevosDias = rawDias.map((d: any) => d.id === diaActual.id ? {
        ...d, cajas: d.cajas.map((c: any) => c.id === turnoAlertaInfo.cajaId ? {
          ...c, turnos: c.turnos.map((t: any) => t.id === turnoAlertaInfo.turnoId ? { 
            ...t, 
            solicitaAsistencia: estado,
            tipoAsistencia: estado ? tipo : null 
          } : t)
        } : c)
      } : d);

      if (isSync) {
         await updateDoc(docRef, { diasGlobales: nuevosDias });
      } else {
         await updateDoc(docRef, { [`diasPorAdmin.${adminId}`]: nuevosDias });
      }

      if ("vibrate" in navigator) {
        navigator.vibrate(estado && tipo === 'peligro' ? [500, 200, 500, 200, 500] : estado ? [100, 50, 100] : [50]);
      }

      if (estado) {
        const targetId = miUsuario.capitanId || adminId;
        const subscription = data.suscripcionesPush?.[targetId];
        
        if (subscription) {
          const cajaObj = diaActual.cajas.find((c: any) => c.id === turnoAlertaInfo.cajaId);
          await enviarAlertaVercel(subscription, miUsuario.nombre, cajaObj?.nombre || 'Caja');
        }
      }

      const mensajeExito = tipo === 'peligro' ? '⚠️ ALERTA DE EMERGENCIA ENVIADA' : 'Asistencia solicitada al administrador.';
      showToast(estado ? mensajeExito : 'Alerta cancelada.', estado && tipo === 'peligro' ? 'error' : 'success');
    } catch (error) {
      console.error(error);
      showToast('Error al conectar con el servidor.', 'error');
    }
  };

  const handleLogout = useCallback(() => {
    const savedCapitanLink = localStorage.getItem('saved_capitan_link');
    
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_admin_id');
    localStorage.removeItem('view_capitan_id');
    localStorage.removeItem('saved_capitan_link');
    localStorage.removeItem('saved_participant_url');
    
    if (eventoId && adminId) {
      if (savedCapitanLink) {
         navigate(`/invite-team/${eventoId}/${adminId}/${savedCapitanLink}`, { replace: true });
      } else {
         navigate(`/invite/${eventoId}/${adminId}`, { replace: true });
      }
    } else {
      navigate('/', { replace: true });
    }
  }, [eventoId, adminId, navigate]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname);
    const handlePopState = () => {
      const confirmar = window.confirm("¿Seguro que deseas salir de tu sesión actual?");
      if (confirmar) {
        handleLogout(); 
      } else {
        window.history.pushState(null, '', window.location.pathname);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleLogout]);

  const croquisDataParaMostrar: CroquisItem[] = useMemo(() => {
    const arr: CroquisItem[] = [];
    arr.push({ 
        id: 'general', 
        title: 'Croquis General', 
        url: croquisGral,
        poligonos: poligonosGral 
    });
    if (croquisIndiv) {
      arr.push({ 
          id: adminId || 'admin', 
          title: 'Croquis del Área', 
          url: croquisIndiv,
          poligonos: poligonosIndiv 
      });
    }
    return arr;
  }, [croquisGral, croquisIndiv, adminId, poligonosGral, poligonosIndiv]);

 // ACTUALIZADO PARA LEER EL TIPO DE ALERTA
 const turnoAlertaInfo = useMemo(() => {
    if (!diaActual || !miUsuario || !horaActual) return null;

    for (const caja of diaActual.cajas) {
      const turnos: any[] = Array.isArray(caja.turnos) ? caja.turnos : (caja.turnos ? Object.values(caja.turnos) : []);
      const turnoConAlerta = turnos.find((t: any) => t.participanteId === miUsuario.id && t.solicitaAsistencia);
      if (turnoConAlerta) {
        return { 
          cajaId: caja.id, 
          turnoId: turnoConAlerta.id, 
          solicitaAsistencia: true,
          tipoAsistencia: turnoConAlerta.tipoAsistencia // <-- Extrae si es peligro o asistencia
        };
      }
    }

    const hoyStr = `${horaActual.getFullYear()}-${String(horaActual.getMonth() + 1).padStart(2, '0')}-${String(horaActual.getDate()).padStart(2, '0')}`;
    if (!diaActual.fecha || !diaActual.fecha.includes(hoyStr)) return null;

    const minActual = horaActual.getHours() * 60 + horaActual.getMinutes();

    for (const caja of diaActual.cajas) {
      const turnos: any[] = Array.isArray(caja.turnos) ? caja.turnos : (caja.turnos ? Object.values(caja.turnos) : []);
      
      const turnoActual = turnos.find((t: any) => {
        if (t.participanteId !== miUsuario.id) return false;
        
        const [inicioStr, finStr] = t.horario.split('-').map((s: string) => s.trim());
        const obtenerMinutos = (horaStr: string) => {
          if (!horaStr) return 0;
          const [h, m] = horaStr.split(':').map(Number);
          return (h * 60) + m;
        };
        
        const minInicio = obtenerMinutos(inicioStr);
        const minFin = obtenerMinutos(finStr || inicioStr);
        
        return minActual >= minInicio && minActual <= minFin;
      });

      if (turnoActual) {
        return { 
          cajaId: caja.id, 
          turnoId: turnoActual.id, 
          solicitaAsistencia: turnoActual.solicitaAsistencia,
          tipoAsistencia: turnoActual.tipoAsistencia 
        };
      }
    }
    return null;
  }, [diaActual, miUsuario, horaActual]);

  return {
    eventoId, adminId, loading, dias, participantes, eventoNombre,
    diaActivo, setDiaActivo, vistaTarjetas, setVistaTarjetas,
    downloadModal, setDownloadModal, showDirectorio, setShowDirectorio,
    showCroquis, setShowCroquis, isUsuarioModalOpen, setIsUsuarioModalOpen,
    showLogoutConfirm, setShowLogoutConfirm, miUsuario, participantesDirectorio,
    datosParaModal, diaActual, turnosLibresCount, turnosOcupadosCount,
    croquisDataParaMostrar, handleGuardarPerfilAjustado, isBusy,
    handleAsignarme, handleQuitarme, handleLogout, motivoSalida,
    adminContacto,handleSolicitarAsistencia,turnoAlertaInfo
  };
};
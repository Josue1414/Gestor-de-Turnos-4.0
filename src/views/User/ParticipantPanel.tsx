// src/views/User/ParticipantPanel.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Users, ShieldCheck, LogOut, Settings, LayoutList, LayoutGrid } from 'lucide-react';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';

import type { DiaEvento, Participante } from '../../types';

import MatrizTurnosParticipante from '../../components/MatrizTurnosParticipante';
import VistaTarjetasCajas from '../../components/VistaTarjetasCajas';
import ModalInfoUsuario, { type UsuarioModalData } from '../../components/ModalInfoUsuario';
import ParticipantDrawer from '../../components/ParticipantDrawer';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import CroquisModal, { type CroquisItem } from '../../components/CroquisModal';
import { useToast } from '../../components/ToastProvider';

interface ParticipanteExtendidoDb extends Participante {
  telefono?: string;
  codigoPais?: string;
  notas?: string;
  organizacion?: string;
  organizationLabel?: string;
  ubicaciones?: string[];
  fechaNacimiento?: string;
  capitanId?: string; 
  cajasDelCapitan?: string[]; 
  capitanNombre?: string; 
}

const ParticipantPanel = () => {
  const { eventoId, adminId, participanteId } = useParams<{ eventoId: string; adminId: string; participanteId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState<DiaEvento[]>([]);
  const [participantes, setParticipantes] = useState<ParticipanteExtendidoDb[]>([]);
  const [eventoNombre, setEventoNombre] = useState('Evento');
  
  const [misHorariosGlobales, setMisHorariosGlobales] = useState<string[]>([]);
  
  const [croquisGral, setCroquisGral] = useState<string | null>(null);
  const [croquisIndiv, setCroquisIndiv] = useState<string | null>(null);
  
  const [diaActivo, setDiaActivo] = useState(0);
  const [vistaTarjetas, setVistaTarjetas] = useState(false); 
  const [downloadModal, setDownloadModal] = useState(false);
  const [showDirectorio, setShowDirectorio] = useState(false);
  const [showCroquis, setShowCroquis] = useState(false);
  
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const { showToast } = useToast();

  // PROTECCIÓN DE RUTA Y BOTÓN "ATRÁS"
  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'participante') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!eventoId || !adminId) return;
    const docRef = doc(db, 'eventos', eventoId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.nombre) setEventoNombre(data.nombre);
        
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
                 cajasDelCapitan: cap.cajasAsignadas || []
               });
             }
          });
        });
        
        const allParts = Array.from(allPartsMap.values());
        setParticipantes(allParts);
        
        const currentUser = allParts.find(p => p.id === participanteId);
        
        const rawDias = data.diasPorAdmin?.[adminId] || [];
        const ocupadosGlobales: string[] = [];
        rawDias.forEach((d: any) => {
          d.cajas.forEach((c: any) => {
            c.turnos.forEach((t: any) => {
              if (t.participanteId === participanteId) {
                ocupadosGlobales.push(t.horario);
              }
            });
          });
        });
        setMisHorariosGlobales(ocupadosGlobales);

        let diasProcesados: DiaEvento[] = rawDias;
        const viewCapitanId = localStorage.getItem('view_capitan_id');
        let cajasVisibles: string[] | null = null;
        let nombreEquipoActual = '';

        if (viewCapitanId) {
           const capVista = capitanes.find((c: any) => c.id === viewCapitanId);
           if (capVista) {
               cajasVisibles = capVista.cajasAsignadas || [];
               nombreEquipoActual = capVista.nombre;
           }
        } else if (currentUser?.capitanId) {
           cajasVisibles = currentUser.cajasDelCapitan || [];
           nombreEquipoActual = currentUser.capitanNombre || '';
        }

        if (cajasVisibles) {
           diasProcesados = diasProcesados.map(d => ({
             ...d,
             cajas: d.cajas.filter((c: any) => cajasVisibles!.includes(c.id))
           })).filter(d => d.cajas.length > 0); // <-- Esta línea oculta los días sin cajas
        }

        if (currentUser && nombreEquipoActual) {
            currentUser.capitanNombre = nombreEquipoActual;
        }
        
        setDias(diasProcesados);
        setCroquisGral(data.croquisUrl || null);
        setCroquisIndiv(data.croquisPorAdmin?.[adminId] || null);
      } else {
        showToast('El evento no existe.', 'error');
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventoId, adminId, navigate, participanteId, showToast]);

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
      return misHorariosGlobales.some(miHor => hayChoque(miHor, horario));
  }, [misHorariosGlobales, hayChoque]);

  const handleAsignarme = async (cajaId: string, turnoId: string) => {
    if (!miUsuario || !eventoId || !adminId || !diaActual) return;
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      const rawDias = data.diasPorAdmin?.[adminId] || [];
      
      // En lugar de (d: any, i: number) y comprobar "i === diaActivo", usamos "d.id === diaActual.id"
      const nuevosDias = rawDias.map((d: any) => d.id === diaActual.id ? {
        ...d, cajas: d.cajas.map((c: any) => c.id === cajaId ? {
          ...c, turnos: c.turnos.map((t: any) => t.id === turnoId ? { ...t, participanteId: miUsuario.id } : t)
        } : c)
      } : d);
      
      await updateDoc(docRef, { [`diasPorAdmin.${adminId}`]: nuevosDias });
    } catch (error) { console.error(error); }
  };

  const handleQuitarme = async (cajaId: string, turnoId: string) => {
    if (!eventoId || !adminId || !diaActual) return;
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      const rawDias = data.diasPorAdmin?.[adminId] || [];
      
      // En lugar de (d: any, i: number) y comprobar "i === diaActivo", usamos "d.id === diaActual.id"
      const nuevosDias = rawDias.map((d: any) => d.id === diaActual.id ? {
        ...d, cajas: d.cajas.map((c: any) => c.id === cajaId ? {
          ...c, turnos: c.turnos.map((t: any) => t.id === turnoId ? { ...t, participanteId: null } : t)
        } : c)
      } : d);
      
      await updateDoc(docRef, { [`diasPorAdmin.${adminId}`]: nuevosDias });
    } catch (error) { console.error(error); }
  };

  // LOGOUT ACTUALIZADO PARA DEVOLVER AL ENLACE DEL CAPITÁN SI APLICA
  // Fragmento de ParticipantPanel.tsx
  const handleLogout = useCallback(() => {
    const savedCapitanLink = localStorage.getItem('saved_capitan_link');
    
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_admin_id');
    localStorage.removeItem('view_capitan_id');
    localStorage.removeItem('saved_capitan_link');
    localStorage.removeItem('saved_participant_url');
    
    if (eventoId && adminId) {
      if (savedCapitanLink) {
         // ACTUALIZAMOS A LA NUEVA RUTA AQUÍ:
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
    arr.push({ id: 'general', title: 'Croquis General', url: croquisGral });
    if (croquisIndiv) {
      arr.push({ id: adminId || 'admin', title: 'Croquis del Área', url: croquisIndiv });
    }
    return arr;
  }, [croquisGral, croquisIndiv, adminId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
        <ShieldCheck size={48} className="text-blue-500 animate-pulse mb-4" />
        <h2 className="text-xl font-black text-slate-700">Cargando evento...</h2>
      </div>
    );
  }

  if (!miUsuario) return null;

  return (
    <div className="h-[100dvh] w-full bg-slate-100 font-sans flex flex-col overflow-auto relative">
      
      <div className="sticky left-0 w-[100vw] max-w-[100vw] px-2 sm:px-6 pt-2 sm:pt-6 pb-2 shrink-0 z-10 box-border">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 w-full max-w-[1400px] mx-auto gap-4">
          
          <div className="flex items-center gap-3 w-full sm:w-auto border-b border-slate-100 pb-3 sm:border-none sm:pb-0">
            <button 
              onClick={() => setShowLogoutConfirm(true)} 
              className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 p-2 sm:px-3 rounded-xl text-[11px] font-bold shadow-sm transition flex items-center justify-center gap-1.5 shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut size={16} className="w-4 h-4" /> <span className="hidden sm:inline">Salir</span>
            </button>

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <div className="min-w-0 flex flex-col items-start">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight mb-1 truncate">
                Hola, <span className="text-blue-600">{miUsuario.nombre}</span>
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-0.5">
                <p className="text-sm sm:text-base font-black text-slate-800 truncate">{eventoNombre}</p>
                {miUsuario.capitanNombre && (
                  <span className="inline-flex items-center text-[11px] sm:text-sm font-black bg-amber-100 text-amber-700 border border-amber-300 px-2.5 py-1 rounded-lg w-fit uppercase tracking-wider shadow-sm">
                    Equipo de {miUsuario.capitanNombre}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
            <button onClick={() => setShowCroquis(true)} className="bg-slate-50 border border-slate-200 text-slate-700 p-2 sm:px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm hover:bg-slate-100">
              📍 <span className="hidden sm:inline">Croquis</span>
            </button>
            
            <button onClick={() => setShowDirectorio(true)} className="bg-blue-50 border border-blue-200 text-blue-700 p-2 sm:px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition shadow-sm">
              <Users size={16} className="w-4 h-4" /> <span className="hidden sm:inline">Directorio ({participantesDirectorio.length})</span>
            </button>

            <button onClick={() => setIsUsuarioModalOpen(true)} className="bg-indigo-50 text-indigo-700 p-2 sm:px-3 border border-indigo-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-100 transition shadow-sm">
               <Settings size={16} className="w-4 h-4" /> Mi Perfil
            </button>
          </div>
        </header>
      </div>

      <div className="sticky top-0 left-0 z-50 w-[100vw] max-w-[100vw] bg-slate-100 h-[60px] flex items-center shadow-sm border-b border-slate-200 px-2 sm:px-6 shrink-0 box-border">
        <div className="w-full max-w-[1400px] mx-auto flex gap-2 overflow-x-auto no-scrollbar items-center h-full px-1">
          {dias.map((dia, idx) => (
            <button key={dia.id} onClick={() => setDiaActivo(idx)} className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 ${diaActivo === idx ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 text-[10px]'}`}>
              <Calendar size={14} /> {dia.nombreDia}
            </button>
          ))}
        </div>
      </div>

      <div className={`px-2 sm:px-6 pb-10 flex flex-col z-0 mx-auto ${vistaTarjetas ? 'w-full max-w-[1400px]' : 'w-max min-w-[100vw]'}`}>
        
        <div className="w-full max-w-[1400px] mt-2 mb-4 flex justify-start">
          <div className="bg-slate-200/70 p-1 rounded-xl flex items-center">
            <button 
              onClick={() => setVistaTarjetas(false)} 
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${!vistaTarjetas ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutList size={16} /> Tabla
            </button>
            <button 
              onClick={() => setVistaTarjetas(true)} 
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${vistaTarjetas ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={16} /> Tarjetas
            </button>
          </div>
        </div>

        {diaActual ? (
          vistaTarjetas ? (
            <VistaTarjetasCajas 
              diaActual={diaActual} 
              getParticipante={(id) => participantes.find(p => p.id === id)}
              miUsuarioId={miUsuario.id} 
              isBusy={isBusy}
              onAsignar={(c, _cn, t, _h) => handleAsignarme(c, t)} 
              onQuitar={handleQuitarme} 
              onCrearCaja={() => {}} onDeleteCaja={() => {}} onDeleteHorario={() => {}} onEditCaja={() => {}} onEditHorario={() => {}} onDeleteTurnoEspecial={() => {}} onEditTurnoEspecial={() => {}}
              adminPerms={{ cajas: false, horarios: false, especiales: false }}
            />
          ) : (
            <MatrizTurnosParticipante 
              diaActual={diaActual} 
              getParticipante={(id) => participantes.find(p => p.id === id)} 
              miUsuarioId={miUsuario.id} 
              onAsignarme={handleAsignarme} 
              onQuitarme={handleQuitarme} 
            />
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 mt-10 w-full">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p className="font-bold">Aún no hay días configurados para ti.</p>
          </div>
        )}
      </div>

      <ParticipantDrawer 
        isOpen={showDirectorio} 
        onClose={() => setShowDirectorio(false)} 
        participantes={participantesDirectorio} 
        currentUserId={miUsuario.id} 
        currentUserRole="Participante" 
        onEditParticipante={(id) => { if (id === miUsuario.id) setIsUsuarioModalOpen(true); }}
        onDeleteParticipante={() => {}} 
        eventoId={eventoId} adminId={adminId}
        turnosLibresCount={turnosLibresCount} turnosOcupadosCount={turnosOcupadosCount}
      />

      <ModalInfoUsuario 
        isOpen={isUsuarioModalOpen} 
        onClose={() => setIsUsuarioModalOpen(false)} 
        data={datosParaModal} 
        isViewingSelf={true} 
        currentUserRole="Participante" 
        onSave={handleGuardarPerfilAjustado} 
        onDownloadImage={() => setDownloadModal(true)} 
      />

      <DownloadScheduleModal 
        isOpen={downloadModal} onClose={() => setDownloadModal(false)} type="personal" 
        seccionName="Mis Accesos" dias={dias} diaActivo={diaActivo} participantes={participantes} targetUserId={miUsuario.id} 
      />

      <CroquisModal isOpen={showCroquis} onClose={() => setShowCroquis(false)} canEdit={false} croquis={croquisDataParaMostrar} onSaveCroquis={async () => Promise.resolve()}/>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-inner border border-red-100">
              <LogOut size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">¿Cerrar Sesión?</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Estás a punto de salir de tu cuenta. Tendrás que volver a ingresar con tu fecha de nacimiento.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition">Cancelar</button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black shadow-md hover:bg-red-600 transition">Sí, salir</button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ParticipantPanel;
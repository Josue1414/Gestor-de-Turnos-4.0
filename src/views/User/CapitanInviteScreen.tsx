// src/views/User/CapitanInviteScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ParticipanteSchema } from '../../utils/schemas';

import EventoFinalizadoScreen from '../../components/EventoFinalizadoScreen';
import { limpiarSesionLocal } from '../../utils/sessionCleanup';

interface ParticipanteEnDB {
  id: string;
  nombre?: string;
  fechaNacimiento?: string;
  estado?: string;
  linkUnico?: string;
}

interface EventoDB {
  participantesPorCapitan?: Record<string, ParticipanteEnDB[]>;
  participantesPorAdmin?: Record<string, ParticipanteEnDB[]>; 
  capitanesPorAdmin?: Record<string, any[]>;
  nombre?: string;
  finalizado?: boolean;
  estado?: string;
}

const MESES = [
  { valor: '01', nombre: 'Enero' },
  { valor: '02', nombre: 'Febrero' },
  { valor: '03', nombre: 'Marzo' },
  { valor: '04', nombre: 'Abril' },
  { valor: '05', nombre: 'Mayo' },
  { valor: '06', nombre: 'Junio' },
  { valor: '07', nombre: 'Julio' },
  { valor: '08', nombre: 'Agosto' },
  { valor: '09', nombre: 'Septiembre' },
  { valor: '10', nombre: 'Octubre' },
  { valor: '11', nombre: 'Noviembre' },
  { valor: '12', nombre: 'Diciembre' },
];

const CapitanInviteScreen = () => {
  const { eventoId, adminId, capitanLink, participanteId } = useParams<{ eventoId: string; adminId: string; capitanLink: string; participanteId?: string }>();
  const navigate = useNavigate(); 
  const location = useLocation();
  
  const [nombre, setNombre] = useState('');
  const [isPreFilled, setIsPreFilled] = useState(false); 
  
  const [anioNacimiento, setAnioNacimiento] = useState('');
  const [mesNacimiento, setMesNacimiento] = useState('');
  const [diaNacimiento, setDiaNacimiento] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [eventoNombre, setEventoNombre] = useState('Cargando...');
  const [eventoFinalizado, setEventoFinalizado] = useState(false);
  const [capitanNombre, setCapitanNombre] = useState('');
  const [capitanId, setCapitanId] = useState('');

  const listaAnios = useMemo(() => {
    const anioMaximo = new Date().getFullYear() - 18;
    const anios: number[] = [];
    for (let a = anioMaximo; a >= 1900; a--) {
      anios.push(a);
    }
    return anios;
  }, []);

  const cantidadDiasEnMes = useMemo(() => {
    if (!anioNacimiento || !mesNacimiento) return 31;
    const a = parseInt(anioNacimiento, 10);
    const m = parseInt(mesNacimiento, 10);
    return new Date(a, m, 0).getDate();
  }, [anioNacimiento, mesNacimiento]);

  const listaDias = useMemo(() => {
    const dias: string[] = [];
    for (let d = 1; d <= cantidadDiasEnMes; d++) {
      dias.push(d.toString().padStart(2, '0'));
    }
    return dias;
  }, [cantidadDiasEnMes]);

  useEffect(() => {
    localStorage.setItem('last_invite_url', location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const fetchEventoInfo = async () => {
      if (!eventoId || !adminId || !capitanLink) return;
      try {
        const docRef = doc(db, 'eventos', eventoId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          limpiarSesionLocal();
          setEventoFinalizado(true);
          return;
        }
        {
          const data = docSnap.data() as EventoDB;
          setEventoNombre(data.nombre || 'Evento');

          if (data.finalizado === true || data.estado === 'finalizado') {
            limpiarSesionLocal();
            setEventoFinalizado(true);
            return;
          }
          
          const capitanes = data.capitanesPorAdmin?.[adminId] || [];
          const capitanEncontrado = capitanes.find((c: any) => c.linkUnico === capitanLink);
          
          if (capitanEncontrado) {
            setCapitanNombre(capitanEncontrado.nombre);
            setCapitanId(capitanEncontrado.id);

            if (participanteId) {
              const capitanParts = data.participantesPorCapitan?.[capitanEncontrado.id] || [];
              let p = capitanParts.find((part: any) => part.id === participanteId);
              
              if (!p) {
                const adminParts = data.participantesPorAdmin?.[adminId] || [];
                p = adminParts.find((part: any) => part.id === participanteId);
              }

              if (p && p.nombre) {
                setNombre(p.nombre);
                setIsPreFilled(true);
              } else {
                setError("El enlace único es inválido o el participante ya no existe.");
              }
            }

          } else {
            setError("Enlace de capitán inválido o eliminado.");
          }
        }
      } catch (err) { console.error(err); }
    };
    fetchEventoInfo();
  }, [eventoId, adminId, capitanLink, participanteId]);

  if (eventoFinalizado) {
    return <EventoFinalizadoScreen motivo="finalizado" />;
  }

  if (!eventoId || !adminId || !capitanLink) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center text-red-500 font-bold max-w-sm">
          URL Inválida. Faltan datos del evento o del capitán.
        </div>
      </div>
    );
  }

  const handleEntrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !diaNacimiento || !mesNacimiento || !anioNacimiento || !eventoId || !adminId || !capitanId) return;

    setLoading(true);
    setError('');

    const a = parseInt(anioNacimiento, 10);
    const m = parseInt(mesNacimiento, 10);
    const d = parseInt(diaNacimiento, 10);

    const fechaNac = new Date(a, m - 1, d);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const diferenciaMeses = hoy.getMonth() - fechaNac.getMonth();
    
    if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }

    if (edad < 18) {
      setError('Debes tener al menos 18 años cumplidos para continuar.');
      setLoading(false);
      return;
    }

    const fechaFinal = `${anioNacimiento}-${mesNacimiento}-${diaNacimiento}`;

    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        limpiarSesionLocal();
        setEventoFinalizado(true);
        setLoading(false);
        return;
      }

      const eventoData = docSnap.data() as EventoDB;
      const capitanParts: ParticipanteEnDB[] = eventoData.participantesPorCapitan?.[capitanId] || [];
      const adminParts: ParticipanteEnDB[] = eventoData.participantesPorAdmin?.[adminId] || [];

      let participanteExistente;
      let vieneDeAdmin = false;
      let wasInCapitanParts = false;

      if (participanteId && isPreFilled) {
        participanteExistente = capitanParts.find(p => p.id === participanteId);
        if (participanteExistente) {
          wasInCapitanParts = true;
        } else {
          participanteExistente = adminParts.find(p => p.id === participanteId);
          vieneDeAdmin = !!participanteExistente;
        }

        if (!participanteExistente) {
          setError("Participante no encontrado en la base de datos.");
          setLoading(false);
          return;
        }
      } else {
        const nombreBuscado = nombre.trim().toLowerCase();
        participanteExistente = capitanParts.find(p => p.nombre?.trim().toLowerCase() === nombreBuscado);
        if (participanteExistente) {
          wasInCapitanParts = true;
        } else {
          participanteExistente = adminParts.find(p => p.nombre?.trim().toLowerCase() === nombreBuscado);
          vieneDeAdmin = !!participanteExistente;
        }
      }

      let miId = '';
      const updates: Record<string, any> = {};

      if (participanteExistente) {
        miId = participanteExistente.id;

        if (participanteExistente.fechaNacimiento) {
          if (participanteExistente.fechaNacimiento !== fechaFinal) {
            setError("La fecha de nacimiento no coincide.");
            setLoading(false);
            return;
          }
          if (vieneDeAdmin && !wasInCapitanParts) {
            updates[`participantesPorCapitan.${capitanId}`] = [...capitanParts, participanteExistente];
          }
        } else {
          const updatedParticipant = { ...participanteExistente, fechaNacimiento: fechaFinal };

          if (wasInCapitanParts) {
            updates[`participantesPorCapitan.${capitanId}`] = capitanParts.map(p => p.id === miId ? updatedParticipant : p);
            if (adminParts.some(p => p.id === miId)) {
              updates[`participantesPorAdmin.${adminId}`] = adminParts.map(p => p.id === miId ? updatedParticipant : p);
            }
          } else if (vieneDeAdmin) {
            updates[`participantesPorAdmin.${adminId}`] = adminParts.map(p => p.id === miId ? updatedParticipant : p);
            updates[`participantesPorCapitan.${capitanId}`] = [...capitanParts, updatedParticipant];
          }
        }
      } else {
        miId = `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const nuevoParticipante: ParticipanteEnDB = {
          id: miId,
          nombre: nombre.trim(),
          estado: 'Libre',
          linkUnico: `inv-${miId}`,
          fechaNacimiento: fechaFinal
        };

        const validation = ParticipanteSchema.safeParse(nuevoParticipante);
        if (!validation.success) {
          setError('Datos inválidos en el participante.');
          setLoading(false);
          return;
        }

        updates[`participantesPorCapitan.${capitanId}`] = [...capitanParts, validation.data];
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(docRef, updates);
      }

      localStorage.setItem('user_role', 'participante');
      localStorage.setItem('current_admin_id', adminId);
      localStorage.setItem('view_capitan_id', capitanId);
      localStorage.setItem('saved_capitan_link', capitanLink);
      
      const participantUrl = `/p/${eventoId}/${adminId}/${miId}`;
      localStorage.setItem('saved_participant_url', participantUrl);

      setTimeout(() => {
        navigate(participantUrl, { replace: true });
      }, 300);

    } catch (err) {
      console.error("Error en login de participante:", err);
      setError("Error de conexión. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in zoom-in-95 duration-500 max-h-[95vh] flex flex-col">
        <div className="bg-amber-100 p-4 sm:p-5 text-center flex flex-col items-center border-b border-amber-200 shrink-0">
          <img src="/logo-gestor-de-turnos.png" alt="Logo Gestor de Turnos" className="w-14 h-14 sm:w-16 sm:h-16 object-cover mx-auto mb-2 sm:mb-3 rounded-2xl shadow-sm border border-amber-200 bg-white" />
          <h1 className="text-lg sm:text-xl font-black text-amber-950 mb-0.5 tracking-tight uppercase">Acceso a Turnos</h1>
          <div className="mt-1">
             <span className="text-[10px] sm:text-xs font-black px-2 py-1 rounded-md tracking-wider uppercase inline-block bg-amber-500 text-white shadow-sm">
               {capitanNombre ? `Equipo de ${capitanNombre}` : 'Cargando equipo...'}
             </span>
             <p className="text-[10px] text-amber-700 font-bold mt-1.5 opacity-80 uppercase tracking-widest">{eventoNombre}</p>
          </div>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold mb-4 border border-red-200 text-center">
              {error}
            </div>
          )}

          {capitanId ? (
            <>
              <form onSubmit={handleEntrar}>
                <div className="text-left space-y-4 mb-6 sm:mb-8">
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1">Nombre y Apellido</label>
                    <div className="relative mt-1">
                      <input 
                        type="text" 
                        placeholder="Ej. Rut Hernández" 
                        value={nombre} 
                        onChange={(e) => setNombre(e.target.value)} 
                        readOnly={isPreFilled}
                        className={`w-full text-sm font-bold rounded-xl p-3 sm:p-3.5 pl-10 sm:pl-11 transition shadow-sm border ${
                          isPreFilled 
                            ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed focus:outline-none' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white'
                        }`} 
                        required 
                      />
                      {isPreFilled ? (
                        <Lock size={16} className="absolute left-3.5 sm:left-4 top-[12px] sm:top-[14px] text-amber-500" />
                      ) : (
                        <User size={16} className="absolute left-3.5 sm:left-4 top-[12px] sm:top-[14px] text-slate-400" />
                      )}
                    </div>
                    {isPreFilled && (
                      <p className="text-[9px] font-bold text-amber-600 mt-1 ml-1 uppercase">✓ Identidad Verificada</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1">Fecha de Nacimiento</label>
                    <div className="flex gap-2 mt-1">
                      
                      <div className="w-1/3">
                        <span className="text-[9px] font-bold text-slate-400 block text-center mb-1 uppercase">Año</span>
                        <select 
                          value={anioNacimiento} 
                          onChange={(e) => setAnioNacimiento(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-center text-xs font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:bg-white transition shadow-sm cursor-pointer"
                          required
                        >
                          <option value="">Año</option>
                          {listaAnios.map(a => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-1/3">
                        <span className="text-[9px] font-bold text-slate-400 block text-center mb-1 uppercase">Mes</span>
                        <select 
                          value={mesNacimiento} 
                          onChange={(e) => setMesNacimiento(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-center text-xs font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:bg-white transition shadow-sm cursor-pointer"
                          required
                        >
                          <option value="">Mes</option>
                          {MESES.map(m => (
                            <option key={m.valor} value={m.valor}>{m.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-1/3">
                        <span className="text-[9px] font-bold text-slate-400 block text-center mb-1 uppercase">Día</span>
                        <select 
                          value={diaNacimiento} 
                          onChange={(e) => setDiaNacimiento(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-center text-xs font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:bg-white transition shadow-sm cursor-pointer"
                          required
                        >
                          <option value="">Día</option>
                          {listaDias.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading || !nombre.trim() || !diaNacimiento || !mesNacimiento || !anioNacimiento} className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black text-sm p-3.5 sm:p-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide disabled:shadow-none">
                  {loading ? 'Conectando...' : 'Entrar al Equipo'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button 
                  type="button"
                  onClick={() => {
                    // AQUÍ ESTÁ EL CAMBIO: Guardamos la ruta antes de salir
                    sessionStorage.setItem('return_to_invite', location.pathname);
                    localStorage.removeItem('last_invite_url');
                    navigate('/', { replace: true });
                  }} 
                  className="text-[10px] font-bold text-slate-400 hover:text-amber-500 transition-colors uppercase tracking-wider"
                >
                  ¿Acceso Administrativo?
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-slate-500 font-bold">Verificando enlace...</p>
          )}

        </div>
      </div>
    </div>
  );
};

export default CapitanInviteScreen;
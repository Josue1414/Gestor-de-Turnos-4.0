// src/views/User/CapitanInviteScreen.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { User, Calendar } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ParticipanteSchema } from '../../utils/schemas';

interface ParticipanteEnDB {
  id: string;
  nombre?: string;
  fechaNacimiento?: string;
  estado?: string;
  linkUnico?: string;
}

interface EventoDB {
  participantesPorCapitan?: Record<string, ParticipanteEnDB[]>;
  capitanesPorAdmin?: Record<string, any[]>;
  nombre?: string;
}

const CapitanInviteScreen = () => {
  const { eventoId, adminId, capitanLink } = useParams<{ eventoId: string; adminId: string; capitanLink: string }>();
  const navigate = useNavigate(); // <-- 2. INICIALIZAR navigate
  const location = useLocation();
  
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [eventoNombre, setEventoNombre] = useState('Cargando...');
  const [capitanNombre, setCapitanNombre] = useState('');
  const [capitanId, setCapitanId] = useState('');

  useEffect(() => {
    localStorage.setItem('last_invite_url', location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const fetchEventoInfo = async () => {
      if (!eventoId || !adminId || !capitanLink) return;
      try {
        const docRef = doc(db, 'eventos', eventoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as EventoDB;
          setEventoNombre(data.nombre || 'Evento');
          
          const capitanes = data.capitanesPorAdmin?.[adminId] || [];
          const capitanEncontrado = capitanes.find((c: any) => c.linkUnico === capitanLink);
          if (capitanEncontrado) {
            setCapitanNombre(capitanEncontrado.nombre);
            setCapitanId(capitanEncontrado.id);
          } else {
            setError("Enlace de capitán inválido o eliminado.");
          }
        }
      } catch (err) { console.error(err); }
    };
    fetchEventoInfo();
  }, [eventoId, adminId, capitanLink]);

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
    if (!nombre.trim() || !fechaNacimiento || !eventoId || !adminId || !capitanId) return;

    setLoading(true);
    setError('');

    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError("El evento no existe.");
        setLoading(false);
        return;
      }

      const eventoData = docSnap.data() as EventoDB;
      const participantesDelTarget: ParticipanteEnDB[] = eventoData.participantesPorCapitan?.[capitanId] || [];

      const nombreBuscado = nombre.trim().toLowerCase();
      const participanteExistente = participantesDelTarget.find(
        (p) => p.nombre?.trim().toLowerCase() === nombreBuscado
      );

      let miId = '';

      if (participanteExistente) {
        if (participanteExistente.fechaNacimiento) {
          if (participanteExistente.fechaNacimiento !== fechaNacimiento) {
            setError("La fecha de nacimiento no coincide.");
            setLoading(false);
            return;
          }
          miId = participanteExistente.id;
        } else {
          miId = participanteExistente.id;
          const actualizados = participantesDelTarget.map((p) => 
            p.id === miId ? { ...p, fechaNacimiento } : p
          );
          await updateDoc(docRef, { [`participantesPorCapitan.${capitanId}`]: actualizados });
        }
      } else {
        miId = `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const nuevoParticipante: ParticipanteEnDB = {
          id: miId,
          nombre: nombre.trim(),
          estado: 'Libre',
          linkUnico: `inv-${miId}`,
          fechaNacimiento
        };

        const validation = ParticipanteSchema.safeParse(nuevoParticipante);
        if (!validation.success) {
          setError('Datos inválidos en el participante.');
          setLoading(false);
          return;
        }

        const actualizados = [...participantesDelTarget, validation.data];
        await updateDoc(docRef, { [`participantesPorCapitan.${capitanId}`]: actualizados });
      }

      localStorage.setItem('user_role', 'participante');
      localStorage.setItem('current_admin_id', adminId);
      
      // Guardamos contexto de capitán
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
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold mb-4 border border-red-200 animate-pulse text-center">
              {error}
            </div>
          )}

          {capitanId ? (
            <form onSubmit={handleEntrar}>
              <div className="text-left space-y-4 mb-6 sm:mb-8">
                <div>
                  <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1">Nombre y Apellido</label>
                  <div className="relative mt-1">
                    <input type="text" placeholder="Ej. Rut Hernández" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl p-3 sm:p-3.5 pl-10 sm:pl-11 focus:outline-none focus:border-amber-500 focus:bg-white transition shadow-sm" required />
                    <User size={16} className="absolute left-3.5 sm:left-4 top-[12px] sm:top-[14px] text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1">Fecha de Nacimiento</label>
                  <div className="relative mt-1">
                    <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl p-3 sm:p-3.5 pl-10 sm:pl-11 focus:outline-none focus:border-amber-500 focus:bg-white transition shadow-sm" required />
                    <Calendar size={16} className="absolute left-3.5 sm:left-4 top-[12px] sm:top-[14px] text-slate-400" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading || !nombre.trim() || !fechaNacimiento} className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black text-sm p-3.5 sm:p-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide disabled:shadow-none">
                {loading ? 'Conectando...' : 'Entrar al Equipo'}
              </button>
            </form>
          ) : (
            <p className="text-center text-slate-500 font-bold">Verificando enlace...</p>
          )}

          
          
        </div>
      </div>
    </div>
  );
};

export default CapitanInviteScreen;
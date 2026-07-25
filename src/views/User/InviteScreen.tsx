import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { User, Calendar } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ParticipanteSchema } from '../../utils/schemas';

// Interfaz 100% estricta sin 'any'
interface ParticipanteEnDB {
  id: string;
  nombre?: string;
  fechaNacimiento?: string;
  estado?: string;
  linkUnico?: string;
}

interface EventoDB {
  participantesPorAdmin?: Record<string, ParticipanteEnDB[]>;
}

const InviteScreen = () => {
  const { eventoId, adminId } = useParams<{ eventoId: string; adminId: string }>();
  
  // Ya no usamos useNavigate porque necesitamos forzar la recarga de permisos en App.tsx
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!eventoId || !adminId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center text-red-500 font-bold max-w-sm">
          URL Inválida. Faltan datos del evento. Revisa tu enlace.
        </div>
      </div>
    );
  }

  const handleEntrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !fechaNacimiento || !eventoId || !adminId) return;

    setLoading(true);
    setError('');

    try {
      const docRef = doc(db, 'eventos', eventoId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError("El evento no existe o fue eliminado.");
        setLoading(false);
        return;
      }

      const eventoData = docSnap.data() as EventoDB;
      const participantesDelAdmin: ParticipanteEnDB[] = eventoData?.participantesPorAdmin?.[adminId] || [];

      const nombreBuscado = nombre.trim().toLowerCase();
      
      const participanteExistente = participantesDelAdmin.find(
        (p) => p.nombre?.trim().toLowerCase() === nombreBuscado
      );

      let miId = '';

      if (participanteExistente) {
        if (participanteExistente.fechaNacimiento) {
          if (participanteExistente.fechaNacimiento !== fechaNacimiento) {
            setError("La fecha de nacimiento no coincide. Si eres otra persona, agrega tus apellidos.");
            setLoading(false);
            return;
          }
          miId = participanteExistente.id;
        } else {
          miId = participanteExistente.id;
          const actualizados = participantesDelAdmin.map((p) => 
            p.id === miId ? { ...p, fechaNacimiento } : p
          );
          await updateDoc(docRef, { [`participantesPorAdmin.${adminId}`]: actualizados });
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

        // Validar con Zod antes de escribir en Firestore
        const validation = ParticipanteSchema.safeParse(nuevoParticipante);
        if (!validation.success) {
          console.error('Participante inválido, no se guardará:', validation.error);
          setError('Datos inválidos en el participante. Contacta al organizador.');
          setLoading(false);
          return;
        }

        const actualizados = [...participantesDelAdmin, validation.data];
        await updateDoc(docRef, { [`participantesPorAdmin.${adminId}`]: actualizados });
      }

      // Guardamos los permisos
      localStorage.setItem('user_role', 'participante');
      localStorage.setItem('current_admin_id', adminId);
      
      // SOLUCIÓN AL ERROR DE RUTAS BLANCAS: 
      // Redirección nativa que obliga a App.tsx a leer el localStorage actualizado
      setTimeout(() => {
        window.location.href = `/p/${eventoId}/${adminId}/${miId}`;
      }, 300); // 300ms permite que el botón muestre un bonito "Entrando..." antes de cambiar

    } catch (err) {
      console.error("Error en login de participante:", err);
      setError("Error de conexión. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in zoom-in-95 duration-500 max-h-[95vh] flex flex-col">
        
        {/* CABECERA REDUCIDA: Padding más pequeño, logo más pequeño, textos ajustados */}
        <div className="bg-blue-100 p-4 sm:p-5 text-center flex flex-col items-center border-b border-blue-200 shrink-0">
          <img 
            src="/logo-gestor-de-turnos.png" 
            alt="Logo Gestor de Turnos" 
            className="w-14 h-14 sm:w-16 sm:h-16 object-cover mx-auto mb-2 sm:mb-3 rounded-2xl shadow-sm border border-blue-200 bg-white" 
          />
          <h1 className="text-lg sm:text-xl font-black text-blue-950 mb-0.5 tracking-tight uppercase">Acceso a Turnos</h1>
          <p className="text-blue-700 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">Participantes</p>
        </div>

        {/* CONTENEDOR DEL FORMULARIO: padding ligeramente reducido y clase flex-1 */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          <p className="text-slate-500 text-xs sm:text-sm font-medium mb-4 sm:mb-5 leading-relaxed text-center">
            Ingresa tu nombre y fecha de nacimiento. La fecha servirá como tu clave de acceso personal.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold mb-4 border border-red-200 animate-pulse text-center">
              {error}
            </div>
          )}

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
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl p-3 sm:p-3.5 pl-10 sm:pl-11 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-sm"
                    required
                  />
                  <User size={16} className="absolute left-3.5 sm:left-4 top-[12px] sm:top-[14px] text-slate-400" />
                </div>
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1">Fecha de Nacimiento</label>
                <div className="relative mt-1">
                  <input 
                    type="date" 
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl p-3 sm:p-3.5 pl-10 sm:pl-11 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-sm"
                    required
                  />
                  <Calendar size={16} className="absolute left-3.5 sm:left-4 top-[12px] sm:top-[14px] text-slate-400" />
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1.5 sm:mt-2 font-medium ml-1 leading-tight">
                  Usaremos tu fecha para validar que eres tú y evitar que otros tomen tus turnos.
                </p>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !nombre.trim() || !fechaNacimiento}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black text-sm p-3.5 sm:p-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide disabled:shadow-none"
            >
              {loading ? (
                 <span className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> 
                   Conectando...
                 </span>
              ) : 'Entrar a la Tabla'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteScreen;
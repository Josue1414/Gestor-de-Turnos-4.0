import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, User, Calendar } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center text-red-500 font-bold">
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
        const actualizados = [...participantesDelAdmin, nuevoParticipante];
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center border border-slate-200">
        
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-inner">
          <ShieldCheck size={40} />
        </div>

        <h1 className="text-2xl font-black text-slate-800 mb-2">Acceso a Turnos</h1>
        <p className="text-slate-500 text-sm font-medium mb-8">
          Ingresa tu nombre y fecha de nacimiento. La fecha servirá como tu clave de acceso personal.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold mb-4 border border-red-200 animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleEntrar}>
          <div className="text-left space-y-4 mb-8">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Nombre y Apellido</label>
              <div className="relative mt-1">
                <input 
                  type="text" 
                  placeholder="Ej. Juan Pérez" 
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl p-3.5 pl-10 focus:outline-none focus:border-blue-400 focus:bg-white transition"
                  required
                />
                <User size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Fecha de Nacimiento</label>
              <div className="relative mt-1">
                <input 
                  type="date" 
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl p-3.5 pl-10 focus:outline-none focus:border-blue-400 focus:bg-white transition"
                  required
                />
                <Calendar size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium ml-1">Usaremos tu fecha para validar que eres tú y nadie tome tus turnos.</p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !nombre.trim() || !fechaNacimiento}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black text-sm p-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            {loading ? (
               <span className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
                 Conectando...
               </span>
            ) : 'Entrar a la Tabla'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InviteScreen;
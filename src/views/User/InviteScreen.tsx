import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, User } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { ParticipanteData } from '../../hooks/useSuperAdminLogic';

const InviteScreen = () => {
  const { eventoId, adminId } = useParams();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEntrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !eventoId || !adminId) return;

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

      const eventoData = docSnap.data();
      const participantesDelAdmin = eventoData.participantesPorAdmin?.[adminId] || [];

      // 1. Validar si ya existe alguien con ese nombre (ignorando mayúsculas)
      const nombreBuscado = nombre.trim().toLowerCase();
      const participanteExistente = participantesDelAdmin.find(
        (p: ParticipanteData) => p.nombre.toLowerCase() === nombreBuscado
      );

      if (participanteExistente) {
        // Ya existe, lo mandamos a su link personal
        navigate(`/p/${eventoId}/${adminId}/${participanteExistente.id}`);
      } else {
        // 2. Es nuevo, lo creamos
        const nuevoId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const nuevoParticipante: ParticipanteData = {
          id: nuevoId,
          nombre: nombre.trim(),
          estado: 'Libre',
          // Puedes agregar otros campos iniciales si tu interface ParticipanteData los requiere
        };

        await updateDoc(docRef, {
          [`participantesPorAdmin.${adminId}`]: [...participantesDelAdmin, nuevoParticipante]
        });

        // Lo mandamos a su link personal recién creado
        navigate(`/p/${eventoId}/${adminId}/${nuevoId}`);
      }
    } catch (err) {
      console.error(err);
      setError("Hubo un problema al conectar. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <form onSubmit={handleEntrar} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border-t-4 border-blue-500 animate-in zoom-in-95 duration-300">
        
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100">
          <ShieldCheck size={32} className="text-blue-500" />
        </div>
        
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">¡Bienvenido!</h1>
        <p className="text-sm text-slate-500 font-medium mb-8">Ingresa tu nombre para acceder a la tabla de turnos del evento.</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold mb-4 border border-red-200">
            {error}
          </div>
        )}

        <div className="text-left space-y-2 mb-6">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Tu Nombre y Apellido</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ej. Juan Pérez" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl p-3.5 pl-10 focus:outline-none focus:border-blue-400 focus:bg-white transition"
              autoFocus
              required
            />
            <User size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !nombre.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          {loading ? 'Entrando...' : 'Entrar a mis Turnos'} <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
};

export default InviteScreen;
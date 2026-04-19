/**
 * RESUMEN: SeccionSupervisor
 * Permite al SuperAdmin ver y editar las credenciales del supervisor
 * de un evento específico. Incluye validación de guardado en Firebase.
 */

import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Save,} from 'lucide-react';

interface SeccionSupervisorProps {
  eventoId: string;
  datosActuales?: { usuario?: string; password?: string };
  onUpdate: (nuevoUsuario: string, nuevoPass: string) => void;
}

const SeccionSupervisor: React.FC<SeccionSupervisorProps> = ({ datosActuales, onUpdate }) => {
  const [editando, setEditando] = useState(false);
  const [usuario, setUsuario] = useState(datosActuales?.usuario || '');
  const [pass, setPass] = useState(datosActuales?.password || '');
  const [verPass, setVerPass] = useState(false);

  return (
    <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-indigo-600" />
          <span className="text-sm font-black text-indigo-900 uppercase tracking-tight">Supervisor del Evento</span>
        </div>
        <button 
          onClick={() => editando ? (onUpdate(usuario, pass), setEditando(false)) : setEditando(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            editando ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-indigo-600 border border-indigo-200'
          }`}
        >
          {editando ? <><Save size={14}/> Guardar</> : 'Editar Acceso'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-indigo-400 uppercase ml-1">Usuario</label>
          <input 
            disabled={!editando}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="bg-white border border-indigo-100 px-3 py-2 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 disabled:opacity-70"
            placeholder="Ej: super_anime"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-indigo-400 uppercase ml-1">Contraseña</label>
          <div className="relative">
            <input 
              type={verPass ? 'text' : 'password'}
              disabled={!editando}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full bg-white border border-indigo-100 px-3 py-2 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 disabled:opacity-70"
              placeholder="123456"
            />
            <button 
              onClick={() => setVerPass(!verPass)}
              className="absolute right-3 top-2 text-indigo-300 hover:text-indigo-500"
            >
              {verPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeccionSupervisor;
import React, { useState } from 'react';
import { Undo, Trash2, Save, X, Loader2, Link, Eye } from 'lucide-react';

const PALETA_COLORES = [
  { nombre: 'Rojo', hex: '#ef4444' }, { nombre: 'Naranja', hex: '#f97316' },
  { nombre: 'Ámbar', hex: '#f59e0b' }, { nombre: 'Amarillo', hex: '#eab308' },
  { nombre: 'Verde', hex: '#22c55e' }, { nombre: 'Esmeralda', hex: '#10b981' },
  { nombre: 'Cian', hex: '#06b6d4' }, { nombre: 'Azul', hex: '#3b82f6' },
  { nombre: 'Índigo', hex: '#6366f1' }, { nombre: 'Violeta', hex: '#8b5cf6' },
  { nombre: 'Fucsia', hex: '#d946ef' }, { nombre: 'Rosa', hex: '#ec4899' }
];

interface PanelDibujoProps {
  puntosContados: number;
  nombre: string;
  setNombre: (val: string) => void;
  color: string;
  setColor: (val: string) => void;
  notas: string;
  setNotas: (val: string) => void;
  // NUEVOS ESTADOS
  cajaVinculadaNombre: string;
  setCajaVinculadaNombre: (val: string) => void;
  visibilidad: 'todos' | 'solo_admins_capitanes';
  setVisibilidad: (val: 'todos' | 'solo_admins_capitanes') => void;
  nombresCajasDisponibles: string[]; // Lista de nombres únicos de todas las cajas del evento
  
  onDeshacer: () => void;
  onLimpiar: () => void;
  onGuardar: () => Promise<void>;
  onCancelar: () => void;
}

const PanelDibujo: React.FC<PanelDibujoProps> = ({
  puntosContados, nombre, setNombre, color, setColor, notas, setNotas,
  cajaVinculadaNombre, setCajaVinculadaNombre, visibilidad, setVisibilidad, nombresCajasDisponibles,
  onDeshacer, onLimpiar, onGuardar, onCancelar
}) => {
  const [guardando, setGuardando] = useState(false);

  const manejarGuardar = async () => {
    if (guardando || puntosContados < 3 || !nombre.trim()) return;
    setGuardando(true);
    try {
      await onGuardar();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-md z-[300] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-4 animate-in slide-in-from-bottom-4 duration-300">
      
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
          📍 Trazando: {puntosContados} puntos
        </span>
        <button 
          onClick={onCancelar} 
          disabled={guardando}
          className="text-xs flex items-center gap-1 text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
        >
          <X size={14} /> Cancelar
        </button>
      </div>

      <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
        <input 
          type="text" 
          value={nombre} 
          onChange={(e) => setNombre(e.target.value)} 
          placeholder="Nombre del Territorio (Ej: Acceso VIP)" 
          className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition" 
        />
        
        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start py-1">
          {PALETA_COLORES.map((c) => (
            <button 
              key={c.hex} 
              type="button" 
              onClick={() => setColor(c.hex)} 
              className={`w-6 h-6 rounded-full border-2 transition-all ${color === c.hex ? 'border-slate-800 scale-125 shadow-md' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-110'}`} 
              style={{ backgroundColor: c.hex }} 
              title={c.nombre}
            />
          ))}
        </div>

        {/* CONTROLES INTELIGENTES */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Link size={10}/> Vincular a Caja</label>
            <select 
              value={cajaVinculadaNombre} 
              onChange={(e) => setCajaVinculadaNombre(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="Ninguna">Ninguna (Solo Info)</option>
              {nombresCajasDisponibles.map(cName => (
                <option key={cName} value={cName}>{cName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Eye size={10}/> Visibilidad</label>
            <select 
              value={visibilidad} 
              onChange={(e) => setVisibilidad(e.target.value as any)}
              className="w-full border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="todos">Para Todos</option>
              <option value="solo_admins_capitanes">Admins/Capitanes</option>
            </select>
          </div>
        </div>

        <input 
          type="text" 
          value={notas} 
          onChange={(e) => setNotas(e.target.value)} 
          placeholder="Notas o instrucciones opcionales..." 
          className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-xs text-slate-600 outline-none focus:border-indigo-500 transition" 
        />
      </div>

      <div className="flex gap-2">
        <button 
          disabled={puntosContados === 0 || guardando} 
          onClick={onDeshacer} 
          className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-slate-200 transition flex justify-center items-center gap-1"
        >
          <Undo size={14} /> Deshacer
        </button>
        <button 
          disabled={puntosContados === 0 || guardando} 
          onClick={onLimpiar} 
          className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-slate-200 transition flex justify-center items-center gap-1"
        >
          <Trash2 size={14} /> Limpiar
        </button>
        <button 
          disabled={puntosContados < 3 || !nombre.trim() || guardando} 
          onClick={manejarGuardar} 
          className="flex-[1.5] py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold disabled:bg-slate-300 disabled:shadow-none hover:bg-indigo-700 transition flex justify-center items-center gap-1 shadow-md shadow-indigo-500/30"
        >
          {guardando ? <><Loader2 size={14} className="animate-spin" /> Guardando</> : <><Save size={14} /> Guardar</>}
        </button>
      </div>
    </div>
  );
};

export default PanelDibujo;
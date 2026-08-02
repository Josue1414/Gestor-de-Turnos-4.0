// src/components/CroquisInteractivo/PanelDibujo.tsx
import React, { useState } from 'react';
import { Undo, Trash2, Save, X, Loader2, Link, Eye, PenTool } from 'lucide-react';

const PALETA_COLORES = [
  { nombre: 'Rojo', hex: '#ef4444' }, { nombre: 'Naranja', hex: '#f97316' },
  { nombre: 'Ámbar', hex: '#f59e0b' }, { nombre: 'Amarillo', hex: '#eab308' },
  { nombre: 'Verde', hex: '#22c55e' }, { nombre: 'Esmeralda', hex: '#10b981' },
  { nombre: 'Cian', hex: '#06b6d4' }, { nombre: 'Azul', hex: '#3b82f6' },
  { nombre: 'Índigo', hex: '#6366f1' }, { nombre: 'Violeta', hex: '#8b5cf6' },
  { nombre: 'Fucsia', hex: '#d946ef' }, { nombre: 'Rosa', hex: '#ec4899' }
];

interface PanelDibujoProps {
  etapa: 'config' | 'trazando'; // <-- Control de los 2 pasos
  onIniciarTrazo: () => void;   // <-- Avanzar al paso 2
  
  puntosContados: number;
  nombre: string;
  setNombre: (val: string) => void;
  color: string;
  setColor: (val: string) => void;
  notas: string;
  setNotas: (val: string) => void;
  cajaVinculadaNombre: string;
  setCajaVinculadaNombre: (val: string) => void;
  visibilidad: 'todos' | 'solo_admins_capitanes';
  setVisibilidad: (val: 'todos' | 'solo_admins_capitanes') => void;
  nombresCajasDisponibles: string[];
  
  onDeshacer: () => void;
  onLimpiar: () => void;
  onGuardar: () => Promise<void>;
  onCancelar: () => void;
}

const PanelDibujo: React.FC<PanelDibujoProps> = ({
  etapa, onIniciarTrazo,
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

  // ==========================================
  // PASO 1: MODAL DE CONFIGURACIÓN PREVIA
  // ==========================================
  if (etapa === 'config') {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md z-[300] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl p-5 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <PenTool size={18} className="text-indigo-600" /> Nuevo Territorio
          </h3>
          <button onClick={onCancelar} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Nombre del Territorio</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              placeholder="Ej: Acceso VIP" 
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition" 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Color de Marcador</label>
            <div className="flex flex-wrap gap-2 justify-start py-1">
              {PALETA_COLORES.map((c) => (
                <button 
                  key={c.hex} 
                  type="button" 
                  onClick={() => setColor(c.hex)} 
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c.hex ? 'border-slate-800 scale-125 shadow-md' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-110'}`} 
                  style={{ backgroundColor: c.hex }} 
                  title={c.nombre}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Link size={10}/> Vincular a Caja</label>
              <select 
                value={cajaVinculadaNombre} 
                onChange={(e) => setCajaVinculadaNombre(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="Ninguna">Ninguna (Solo Info)</option>
                {nombresCajasDisponibles.map(cName => (
                  <option key={cName} value={cName}>{cName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Eye size={10}/> Visibilidad</label>
              <select 
                value={visibilidad} 
                onChange={(e) => setVisibilidad(e.target.value as any)}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="todos">Para Todos</option>
                <option value="solo_admins_capitanes">Admins/Capitanes</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Instrucciones (Opcional)</label>
            <input 
              type="text" 
              value={notas} 
              onChange={(e) => setNotas(e.target.value)} 
              placeholder="Notas o detalles para esta área..." 
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs text-slate-600 outline-none focus:border-indigo-500 transition" 
            />
          </div>

          <div className="pt-2">
            <button 
              onClick={onIniciarTrazo}
              disabled={!nombre.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none text-white py-3.5 rounded-xl font-black shadow-md shadow-indigo-500/30 transition flex justify-center items-center gap-2"
            >
              Comenzar a Trazar <PenTool size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PASO 2: BARRA INFERIOR DURANTE EL TRAZADO
  // ==========================================
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-max min-w-[300px] z-[300] bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-full p-2 flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300">
      
      <div className="px-4 text-xs font-black text-slate-300 border-r border-slate-700">
        PUNTOS: <span className={puntosContados >= 3 ? "text-emerald-400" : "text-amber-400"}>{puntosContados}</span>
      </div>

      <button 
        disabled={puntosContados === 0 || guardando} 
        onClick={onDeshacer} 
        className="px-3 py-2 bg-slate-800 text-slate-300 rounded-full text-xs font-bold disabled:opacity-50 hover:bg-slate-700 transition flex items-center gap-1.5"
      >
        <Undo size={14} /> <span className="hidden sm:inline">Deshacer</span>
      </button>

      <button 
        disabled={puntosContados === 0 || guardando} 
        onClick={onLimpiar} 
        className="px-3 py-2 bg-slate-800 text-slate-300 rounded-full text-xs font-bold disabled:opacity-50 hover:bg-slate-700 transition flex items-center gap-1.5"
      >
        <Trash2 size={14} /> <span className="hidden sm:inline">Limpiar</span>
      </button>

      <button 
        onClick={onCancelar} 
        disabled={guardando}
        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-full text-xs font-bold hover:bg-red-500/40 transition flex items-center gap-1.5"
      >
        <X size={14} />
      </button>

      <button 
        disabled={puntosContados < 3 || guardando} 
        onClick={manejarGuardar} 
        className="px-5 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold disabled:bg-slate-600 transition flex items-center gap-1.5 ml-1"
      >
        {guardando ? <><Loader2 size={14} className="animate-spin" /></> : <><Save size={14} /> Guardar</>}
      </button>
    </div>
  );
};

export default PanelDibujo;
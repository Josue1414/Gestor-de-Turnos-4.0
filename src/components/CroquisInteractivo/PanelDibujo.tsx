// src/components/CroquisInteractivo/PanelDibujo.tsx
import React, { useState } from 'react';
import { Undo, Trash2, Save, X, Loader2, Eye, PenTool, Type, User, Phone, Calendar, Clock, Plus } from 'lucide-react';

const PALETA_COLORES = [
  { nombre: 'Rojo', hex: '#ef4444' }, { nombre: 'Naranja', hex: '#f97316' },
  { nombre: 'Ámbar', hex: '#f59e0b' }, { nombre: 'Amarillo', hex: '#eab308' },
  { nombre: 'Verde', hex: '#22c55e' }, { nombre: 'Esmeralda', hex: '#10b981' },
  { nombre: 'Cian', hex: '#06b6d4' }, { nombre: 'Azul', hex: '#3b82f6' },
  { nombre: 'Índigo', hex: '#6366f1' }, { nombre: 'Violeta', hex: '#8b5cf6' },
  { nombre: 'Fucsia', hex: '#d946ef' }, { nombre: 'Rosa', hex: '#ec4899' },
  { nombre: 'Invisible / Transparente', hex: 'transparent' } // NUEVA OPCIÓN
];

interface PanelDibujoProps {
  etapa: 'config' | 'trazando';
  onIniciarTrazo: () => void;
  puntosContados: number;
  nombre: string;
  setNombre: (val: string) => void;
  color: string;
  setColor: (val: string) => void;
  notas: string;
  setNotas: (val: string) => void;
  
  encargadoNombre: string;
  setEncargadoNombre: (val: string) => void;
  encargadoTelefono: string;
  setEncargadoTelefono: (val: string) => void;
  diasDisponibles: string[];
  diasSeleccionados: string[];
  setDiasSeleccionados: (val: string[]) => void;
  horarios: string[];
  setHorarios: (val: string[]) => void;

  visibilidad: 'todos' | 'solo_admins_capitanes';
  setVisibilidad: (val: 'todos' | 'solo_admins_capitanes') => void;
  mostrarTexto: boolean;
  setMostrarTexto: (val: boolean) => void;
  
  onDeshacer: () => void;
  onLimpiar: () => void;
  onGuardar: () => Promise<void>;
  onCancelar: () => void;
}

const PanelDibujo: React.FC<PanelDibujoProps> = ({
  etapa, onIniciarTrazo, puntosContados, nombre, setNombre, color, setColor, notas, setNotas,
  encargadoNombre, setEncargadoNombre, encargadoTelefono, setEncargadoTelefono,
  diasDisponibles, diasSeleccionados, setDiasSeleccionados, horarios, setHorarios,
  visibilidad, setVisibilidad, mostrarTexto, setMostrarTexto,
  onDeshacer, onLimpiar, onGuardar, onCancelar
}) => {
  const [guardando, setGuardando] = useState(false);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');

  const manejarGuardar = async () => {
    if (guardando || puntosContados < 3 || !nombre.trim()) return;
    setGuardando(true);
    try {
      await onGuardar();
    } finally {
      setGuardando(false);
    }
  };

  const toggleDia = (dia: string) => {
    if (diasSeleccionados.includes(dia)) {
      setDiasSeleccionados(diasSeleccionados.filter(d => d !== dia));
    } else {
      setDiasSeleccionados([...diasSeleccionados, dia]);
    }
  };

  const agregarHorario = () => {
    if (horaInicio && horaFin) {
      const nuevoHorario = `${horaInicio} - ${horaFin}`;
      if (!horarios.includes(nuevoHorario)) {
        setHorarios([...horarios, nuevoHorario]);
        setHoraInicio('');
        setHoraFin('');
      }
    }
  };

  const eliminarHorario = (horarioAEliminar: string) => {
    setHorarios(horarios.filter(h => h !== horarioAEliminar));
  };

  return etapa === 'config' ? (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md max-h-[85vh] overflow-y-auto z-[300] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl p-5 custom-scrollbar">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white/90 pb-2 z-10">
        <h3 className="font-black text-slate-800 flex items-center gap-2">
          <PenTool size={18} className="text-indigo-600" /> Territorio
        </h3>
        <button onClick={onCancelar} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Nombre (Requerido)</label>
            <input 
              type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} 
              placeholder="Ej: Acceso VIP" 
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Eye size={10}/> Visibilidad</label>
            <select 
              value={visibilidad} onChange={(e) => setVisibilidad(e.target.value as any)}
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="todos">Para Todos</option>
              <option value="solo_admins_capitanes">Admins/Capitanes</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-xl">
           <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <Type size={16} /> Mostrar nombre en el mapa
           </div>
           <input type="checkbox" checked={mostrarTexto} onChange={(e) => setMostrarTexto(e.target.checked)} className="w-5 h-5 accent-indigo-600 cursor-pointer" />
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><User size={12}/> Información del Encargado (Opcional)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input 
              type="text" value={encargadoNombre} onChange={(e) => setEncargadoNombre(e.target.value)} 
              placeholder="Nombre completo" 
              className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500" 
            />
            <div className="relative">
              <Phone size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input 
                type="tel" 
                maxLength={10}
                value={encargadoTelefono} 
                // Restricción para números únicamente y hasta 10 dígitos.
                onChange={(e) => setEncargadoTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                placeholder="Teléfono (10 dígitos)" 
                className="w-full border border-slate-200 rounded-lg p-2 pl-7 text-xs outline-none focus:border-indigo-500" 
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          {diasDisponibles.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Calendar size={12}/> Días del Evento (Opcional)</label>
              <div className="flex flex-wrap gap-2">
                {diasDisponibles.map(dia => (
                  <button
                    key={dia} onClick={() => toggleDia(dia)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      diasSeleccionados.includes(dia) 
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {dia}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Clock size={12}/> Horarios a mostrar (Opcional)</label>
            <div className="flex items-center gap-2">
              <input 
                type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} 
                className="flex-1 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500" 
              />
              <span className="text-slate-400 font-bold">-</span>
              <input 
                type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} 
                className="flex-1 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500" 
              />
              <button 
                onClick={agregarHorario} 
                disabled={!horaInicio || !horaFin} 
                className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition shrink-0"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              {horarios.map(h => (
                <div key={h} className="flex justify-between items-center bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-700">
                  <span>{h}</span>
                  <button onClick={() => eliminarHorario(h)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Color de Marcador</label>
          <div className="flex flex-wrap gap-2 justify-start py-1">
            {PALETA_COLORES.map((c) => (
              <button 
                key={c.hex} type="button" onClick={() => setColor(c.hex)} 
                className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${color === c.hex ? 'border-slate-800 scale-125 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100 hover:scale-110'}`} 
                style={{ 
                  backgroundColor: c.hex === 'transparent' ? 'transparent' : c.hex,
                  backgroundImage: c.hex === 'transparent' ? 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 2px, #ffffff 2px, #ffffff 4px)' : 'none'
                }} 
                title={c.nombre}
              >
                {c.hex === 'transparent' && <Eye size={12} className="text-slate-500 opacity-50" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Información General / Notas</label>
          <textarea 
            value={notas} onChange={(e) => setNotas(e.target.value)} 
            placeholder="Notas, reglas o detalles de esta área..." 
            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs text-slate-600 outline-none focus:border-indigo-500 transition resize-none h-20" 
          />
        </div>

        <div className="pt-2 sticky bottom-0 bg-white/90 pt-2 z-10">
          <button 
            onClick={onIniciarTrazo} disabled={!nombre.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none text-white py-3 rounded-xl font-black shadow-md shadow-indigo-500/30 transition flex justify-center items-center gap-2"
          >
            Comenzar a Trazar <PenTool size={16} />
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-max min-w-[300px] z-[300] bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-full p-2 flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300">
      <div className="px-4 text-xs font-black text-slate-300 border-r border-slate-700">
        PUNTOS: <span className={puntosContados >= 3 ? "text-emerald-400" : "text-amber-400"}>{puntosContados}</span>
      </div>
      <button disabled={puntosContados === 0 || guardando} onClick={onDeshacer} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-full text-xs font-bold disabled:opacity-50 hover:bg-slate-700 transition flex items-center gap-1.5"><Undo size={14} /> <span className="hidden sm:inline">Deshacer</span></button>
      <button disabled={puntosContados === 0 || guardando} onClick={onLimpiar} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-full text-xs font-bold disabled:opacity-50 hover:bg-slate-700 transition flex items-center gap-1.5"><Trash2 size={14} /> <span className="hidden sm:inline">Limpiar</span></button>
      <button onClick={onCancelar} disabled={guardando} className="px-3 py-2 bg-red-500/20 text-red-400 rounded-full text-xs font-bold hover:bg-red-500/40 transition flex items-center gap-1.5"><X size={14} /></button>
      <button disabled={puntosContados < 3 || guardando} onClick={manejarGuardar} className="px-5 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold disabled:bg-slate-600 transition flex items-center gap-1.5 ml-1">
        {guardando ? <><Loader2 size={14} className="animate-spin" /></> : <><Save size={14} /> Guardar</>}
      </button>
    </div>
  );
};

export default PanelDibujo;
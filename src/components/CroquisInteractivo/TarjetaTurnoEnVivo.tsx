// src/components/CroquisInteractivo/TarjetaTurnoEnVivo.tsx
import React, { useState } from 'react';
import { X, MapPin, Info, Lock, Trash2, MessageCircle, Calendar, CheckSquare, Square, Clock, Edit2 } from 'lucide-react';
import type { Coordenada } from '../../types';

export interface PoligonoCroquisExt {
  id: string;
  nombre: string;
  color: string;
  puntos: Coordenada[];
  notas?: string;
  encargadoNombre?: string;
  encargadoTelefono?: string;
  diasAplicables?: string[];
  horarios?: string[];
  visibilidad?: 'todos' | 'solo_admins_capitanes';
  estado: string;
  mostrarTexto?: boolean;
  cajaId?: string;
}

interface TarjetaTurnoEnVivoProps {
  poligono: PoligonoCroquisExt;
  rolUsuario: 'SuperAdmin' | 'Supervisor' | 'Administrador' | 'Capitan' | 'Participante';
  onClose: () => void;
  onEdit?: (poligono: PoligonoCroquisExt) => void;
  onDelete?: (id: string) => void;
}

const TarjetaTurnoEnVivo: React.FC<TarjetaTurnoEnVivoProps> = ({ poligono, rolUsuario, onClose, onEdit, onDelete }) => {
  const [horariosOcultos, setHorariosOcultos] = useState<Set<number>>(new Set());

  const bloqueadoParaUsuario = poligono.visibilidad === 'solo_admins_capitanes' && rolUsuario === 'Participante';
  const esEditor = rolUsuario !== 'Participante';

  const toggleHorario = (index: number) => {
    setHorariosOcultos(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const polyColorSeguro = poligono.color === 'transparent' ? '#94a3b8' : poligono.color;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 z-[400] overflow-hidden animate-in slide-in-from-top-4 duration-300">
      
      <div className="p-3 sm:p-4 border-b border-slate-100 flex items-start justify-between relative" style={{ backgroundColor: `${polyColorSeguro}15` }}>
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden flex-1 pr-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: polyColorSeguro, color: 'white' }}>
            <MapPin size={20} />
          </div>
          
          <div className="flex flex-col shrink-0">
            <h3 className="font-black text-slate-800 text-lg leading-none mb-1">{poligono.nombre}</h3>
          </div>

          {poligono.encargadoNombre && (
            <div className="ml-1 pl-3 sm:pl-4 border-l-2 border-slate-300/60 flex flex-col justify-center truncate">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase leading-none mb-1.5 tracking-wide truncate">
                Encargado: <span className="text-slate-700">{poligono.encargadoNombre}</span>
              </span>
              {poligono.encargadoTelefono && (
                <a
                  href={`https://wa.me/${poligono.encargadoTelefono.replace(/\D/g, '')}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 w-fit bg-[#25D366] text-white px-2 py-1 rounded-md text-[10px] font-bold hover:scale-105 transition shadow-sm"
                >
                  <MessageCircle size={12} /> Contactar
                </a>
              )}
            </div>
          )}
        </div>

        {/* CONTENEDOR DE BOTONES */}
        <div className="flex items-center shrink-0 ml-2">
          {esEditor && onEdit && (
             <button onClick={() => onEdit(poligono)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition shadow-sm border border-blue-100 mr-4" title="Editar Territorio">
               <Edit2 size={16} />
             </button>
          )}
          {esEditor && onDelete && (
             <button onClick={() => { if(confirm('¿Eliminar este territorio?')) onDelete(poligono.id); }} className="p-1.5 bg-white hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition shadow-sm border border-red-100 mr-1" title="Eliminar Territorio">
               <Trash2 size={16} />
             </button>
          )}
          <button onClick={onClose} className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 rounded-lg transition shadow-sm border border-slate-100" title="Cerrar Tarjeta">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {bloqueadoParaUsuario ? (
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
            <Lock size={24} className="text-slate-400" />
            <p className="text-sm font-bold text-slate-600">Área Restringida</p>
            <p className="text-xs text-slate-400">Información exclusiva para organizadores.</p>
          </div>
        ) : (
          <>
            {poligono.diasAplicables && poligono.diasAplicables.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <Calendar size={16} className="shrink-0" />
                <span><span className="text-indigo-400 uppercase tracking-wider text-[10px] block mb-0.5">Días de actividad</span>{poligono.diasAplicables.join(', ')}</span>
              </div>
            )}

            {poligono.notas && (
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-2 items-start text-amber-800 text-xs font-medium leading-relaxed shadow-inner">
                <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <p>{poligono.notas}</p>
              </div>
            )}
            
            {poligono.horarios && poligono.horarios.length > 0 ? (
              <div className="space-y-2 mt-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Clock size={12}/> Horarios</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {poligono.horarios.map((horario, index) => {
                    const estaOculto = horariosOcultos.has(index);
                    return (
                      <div 
                        key={index} onClick={() => toggleHorario(index)}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer hover:bg-slate-100 ${
                          estaOculto ? 'bg-slate-50 border-slate-200 opacity-50 grayscale' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <button className={`shrink-0 ${estaOculto ? 'text-slate-300' : 'text-indigo-500'}`}>
                          {estaOculto ? <Square size={16} /> : <CheckSquare size={16} />}
                        </button>
                        <span className={`text-sm font-black text-slate-700 ${estaOculto ? 'line-through' : ''}`}>
                          {horario}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <p className="text-xs font-bold text-slate-500">Esta área no tiene horarios específicos configurados.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TarjetaTurnoEnVivo;
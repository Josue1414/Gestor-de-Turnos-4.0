// src/components/CroquisInteractivo/TarjetaTurnoEnVivo.tsx
import React, { useState, useMemo } from 'react';
import { X, MapPin, Info, Lock, Trash2, MessageCircle, Calendar, CheckSquare, Square, Clock, Edit2, AlertTriangle, LifeBuoy, User, ShieldCheck } from 'lucide-react';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dias?: any[];
  diaActivo?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participantes?: any[];
}

const TarjetaTurnoEnVivo: React.FC<TarjetaTurnoEnVivoProps> = ({ poligono, rolUsuario, onClose, onEdit, onDelete, dias, participantes }) => {
  const [horariosOcultos, setHorariosOcultos] = useState<Set<number>>(new Set());

  const bloqueadoParaUsuario = poligono.visibilidad === 'solo_admins_capitanes' && rolUsuario === 'Participante';
  const esEditor = rolUsuario !== 'Participante';

  const infoAlerta = useMemo(() => {
    if (poligono.cajaId && dias) {
      let foundPeligro = null;
      let foundAsistencia = null;
      
      for (const dia of dias) {
        const caja = dia.cajas?.find((c: any) => c.id === poligono.cajaId || String(c.nombre).trim().toLowerCase() === String(poligono.nombre).trim().toLowerCase());
        if (caja) {
          const turnosArr = Array.isArray(caja.turnos) ? caja.turnos : Object.values(caja.turnos || {});
          
          const turnoPeligro = turnosArr.find((t: any) => t.solicitaAsistencia && String(t.tipoAsistencia).toLowerCase() === 'peligro');
          const turnoAsistencia = turnosArr.find((t: any) => t.solicitaAsistencia && String(t.tipoAsistencia).toLowerCase() !== 'peligro');

          if (turnoPeligro && !foundPeligro) foundPeligro = turnoPeligro;
          if (turnoAsistencia && !foundAsistencia) foundAsistencia = turnoAsistencia;
        }
      }

      const turnoAlerta = foundPeligro || foundAsistencia;
      if (turnoAlerta) {
        const participante = participantes?.find(p => p.id === turnoAlerta.participanteId);
        return {
          tipo: String(turnoAlerta.tipoAsistencia).toLowerCase() === 'peligro' ? 'peligro' : 'asistencia',
          horario: turnoAlerta.horario,
          participanteNombre: participante?.nombre || 'Participante Desconocido',
          encargadoNombre: participante?.capitanNombre || participante?.creador || poligono.encargadoNombre || 'Administrador',
          telefonoEncargado: participante?.capitanTelefono || poligono.encargadoTelefono || ''
        };
      }
    }
    return null;
  }, [poligono.cajaId, poligono.nombre, dias, participantes]);

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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 z-[400] overflow-hidden animate-in slide-in-from-top-4 duration-300 flex flex-col max-h-[85vh]">
      
      {infoAlerta && (
        <div className={`p-4 shrink-0 shadow-sm border-b ${infoAlerta.tipo === 'peligro' ? 'bg-red-600 border-red-700' : 'bg-blue-500 border-blue-600'}`}>
          <div className="flex items-start gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-xl animate-pulse shrink-0">
               {infoAlerta.tipo === 'peligro' ? <AlertTriangle size={24} /> : <LifeBuoy size={24} />}
            </div>
            <div className="flex-1">
              <h4 className="font-black text-lg uppercase tracking-wide leading-tight">
                {infoAlerta.tipo === 'peligro' ? 'Emergencia Reportada' : 'Asistencia Solicitada'}
              </h4>
              <div className="mt-2 space-y-1 bg-white/10 p-2.5 rounded-xl text-sm border border-white/20">
                 <p className="flex items-center gap-1.5"><User size={14}/> <b>{infoAlerta.participanteNombre}</b></p>
                 <p className="flex items-center gap-1.5 opacity-90"><Clock size={14}/> {infoAlerta.horario}</p>
                 <p className="flex items-center gap-1.5 opacity-90"><ShieldCheck size={14}/> A cargo: {infoAlerta.encargadoNombre}</p>
              </div>
            </div>
          </div>
          {infoAlerta.telefonoEncargado && (
             <a
               href={`https://wa.me/${infoAlerta.telefonoEncargado.replace(/\D/g, '')}`}
               target="_blank" rel="noreferrer"
               className="mt-3 w-full bg-white text-slate-800 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-slate-100 transition shadow-sm"
             >
               <MessageCircle size={18} className="text-[#25D366]" /> Contactar al Encargado
             </a>
          )}
        </div>
      )}

      <div className="p-3 sm:p-4 border-b border-slate-100 flex items-start justify-between relative shrink-0" style={{ backgroundColor: `${polyColorSeguro}15` }}>
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden flex-1 pr-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: polyColorSeguro, color: 'white' }}>
            <MapPin size={20} />
          </div>
          
          <div className="flex flex-col shrink-0">
            <h3 className="font-black text-slate-800 text-lg leading-none mb-1">{poligono.nombre}</h3>
          </div>

          {poligono.encargadoNombre && !infoAlerta && (
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

      <div className="p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1">
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
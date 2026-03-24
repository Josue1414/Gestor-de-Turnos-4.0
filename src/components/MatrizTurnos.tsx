import React from 'react';
import { Plus, User, X, Lock, Star, Clock } from 'lucide-react';
import ActionMenu from './ActionMenu';
import type { DiaEvento, Participante } from '../types';

interface MatrizTurnosProps {
  diaActual: DiaEvento;
  getParticipante: (id: string | null) => Participante | undefined;
  onAsignar: (cajaId: string, cajaNombre: string, turnoId: string, horario: string) => void;
  onQuitar: (cajaId: string, turnoId: string, participanteId: string) => void;
  onCrearCaja: () => void;
  onCrearHorario: () => void;
  onDeleteCaja: (cajaId: string) => void;
  onDeleteHorario: (horario: string) => void;
  onEditCaja: (cajaId: string) => void;
  onEditHorario: (horario: string) => void;
}

const MatrizTurnos: React.FC<MatrizTurnosProps> = ({ 
  diaActual, getParticipante, onAsignar, onQuitar, onCrearHorario,
  onDeleteCaja, onDeleteHorario, onEditCaja, onEditHorario
}) => {
  return (
    <div className="overflow-x-auto overflow-y-auto flex-1 bg-slate-50 font-sans">
      <table className="w-full min-w-max border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="sticky left-0 z-30 bg-slate-700 text-white p-3 text-left w-36 border-b-2 border-slate-800">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase opacity-50 tracking-widest">Horarios</span>
                <button 
                  onClick={onCrearHorario}
                  className="w-full bg-slate-600 hover:bg-slate-500 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition shadow-sm"
                >
                  <Plus size={14} /> Nuevo
                </button>
              </div>
            </th>

            {diaActual.cajas.map(caja => {
              const esEspecial = caja.esEspecial;
              return (
                <th 
                  key={caja.id} 
                  className={`sticky top-0 z-20 p-3 min-w-[220px] border-b-2 border-slate-800 border-l transition-colors ${
                    esEspecial ? 'bg-indigo-700 text-white border-l-indigo-500' : 'bg-slate-600 text-white border-l-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-center min-h-[32px]">
                    <div className="flex items-center gap-2">
                      {esEspecial && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                      <span className="font-bold uppercase text-sm tracking-tight">{caja.nombre}</span>
                    </div>
                    <ActionMenu 
                      onEdit={() => onEditCaja(caja.id)} 
                      onDelete={() => onDeleteCaja(caja.id)} 
                      tituloEliminar={`¿Eliminar ${caja.nombre}?`}
                      mensajeEliminar="Se borrarán todos los turnos y asignaciones de esta caja."
                    />
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {diaActual.horariosMaestros.map((horario, rowIdx) => (
            <tr key={rowIdx}>
              {/* COLUMNA DE HORARIO */}
              <td className="sticky left-0 z-40 bg-slate-600 text-white p-3 border-b border-slate-500 shadow-xl">
                <div className="flex justify-between items-center min-h-[32px] group relative"> 
                    <span className="font-bold text-sm font-mono tracking-tighter">
                    {horario}
                    </span>
                    <ActionMenu 
                    onEdit={() => onEditHorario(horario)} 
                    onDelete={() => onDeleteHorario(horario)}
                    tituloEliminar="¿Eliminar franja?"
                    mensajeEliminar="Esto quitará este horario de todas las cajas normales."
                    direccion="derecha" 
                    />
                </div>
                </td>
              
              {diaActual.cajas.map(caja => {
                const esEspecial = caja.esEspecial;
                const turno = caja.turnos.find(t => t.horario === horario);

                // --- NUEVA LÓGICA PARA CAJAS ESPECIALES (Misma que Participante) ---
                if (esEspecial) {
                  // Solo dibujamos la caja especial en la PRIMERA fila
                  if (rowIdx === 0) {
                    return (
                      <td 
                        key={caja.id} 
                        className="p-3 border-l border-indigo-100 bg-indigo-50/20 align-top"
                      >
                        <div className="flex flex-col gap-4">
                          {caja.turnos.map((tSpec) => {
                            const participante = getParticipante(tSpec.participanteId);
                            return (
                              <div key={tSpec.id} className="relative group">
                                <div className={`border-2 rounded-2xl p-4 shadow-sm transition-all ${
                                  participante ? 'bg-white border-indigo-400' : 'bg-indigo-50/50 border-dashed border-indigo-300'
                                }`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Clock size={10} /> {tSpec.horario}
                                    </span>
                                    {participante && (
                                      <button 
                                        onClick={() => onQuitar(caja.id, tSpec.id, participante.id)} 
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                      >
                                        <X size={14} />
                                      </button>
                                    )}
                                  </div>

                                  {participante ? (
                                    <div className="flex items-center gap-3">
                                      <div className="bg-indigo-100 p-2 rounded-full text-indigo-600"><User size={20} /></div>
                                      <div>
                                        <p className="font-bold text-slate-800 text-sm leading-none mb-1">{participante.nombre}</p>
                                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">Turno Especial</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => onAsignar(caja.id, caja.nombre, tSpec.id, tSpec.horario)}
                                      className="w-full py-4 flex flex-col items-center justify-center gap-1 text-indigo-500 hover:text-indigo-700 transition-colors"
                                    >
                                      <Plus size={20} />
                                      <span className="text-xs font-bold tracking-tight">Asignar Personal</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  } else {
                    // Para el resto de filas debajo de una caja especial, dibujamos el "CERRADO"
                    return (
                      <td key={caja.id} className="p-2 border-b border-l border-slate-200 bg-slate-50/50">
                        <div className="h-16 bg-red-50/80 border-2 border-dashed border-red-100 rounded-xl flex flex-col items-center justify-center text-red-300">
                          <Lock size={16} className="mb-1" />
                          <span className="text-[10px] font-black uppercase tracking-widest">No Aplica</span>
                        </div>
                      </td>
                    );
                  }
                }

                // --- LÓGICA PARA CAJAS NORMALES ---
                const participanteNorm = getParticipante(turno?.participanteId || null);
                
                return (
                  <td key={caja.id} className="p-2 border-b border-l border-slate-200 bg-white">
                    {participanteNorm ? (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 relative group transition-transform hover:scale-[1.02]">
                        <button 
                          onClick={() => onQuitar(caja.id, turno!.id, participanteNorm.id)} 
                          className="absolute top-2 right-2 text-blue-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                        <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                          <User size={14} /> {participanteNorm.nombre}
                        </div>
                        <span className="text-[10px] text-blue-500 font-bold uppercase">Confirmado</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => onAsignar(caja.id, caja.nombre, turno!.id, horario)} 
                        className="w-full h-16 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-600 flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                      >
                        <Plus size={18} /> <span className="text-xs font-bold">Asignar</span>
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MatrizTurnos;
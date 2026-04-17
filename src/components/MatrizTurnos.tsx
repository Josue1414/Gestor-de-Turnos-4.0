import React from 'react';
import { Plus, User, X, Star, Clock, Lock } from 'lucide-react';
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

interface CajaCheck { isEspecial?: unknown; especial?: unknown; tipo?: unknown; nombre?: unknown; }

const MatrizTurnos: React.FC<MatrizTurnosProps> = ({ 
  diaActual, getParticipante, onAsignar, onQuitar, onCrearHorario,
  onDeleteCaja, onDeleteHorario, onEditCaja, onEditHorario
}) => {

  // Detective tipado sin "any"
  const checkIsEspecial = (c: unknown): boolean => {
    if (!c || typeof c !== 'object') return false;
    const box = c as CajaCheck;
    if (box.isEspecial === true || box.especial === true || box.tipo === 'especial') return true;
    if (typeof box.nombre === 'string') {
      const lowerName = box.nombre.toLowerCase();
      return lowerName.includes('especial') || lowerName.includes('vip');
    }
    return false;
  };

  const cajasNormales = diaActual.cajas.filter(c => !checkIsEspecial(c));
  const cajasEspeciales = diaActual.cajas.filter(c => checkIsEspecial(c));

  const horariosUnicos = Array.from(new Set(cajasNormales.flatMap(caja => caja.turnos.map(t => t.horario))))
    .sort((a, b) => (parseInt(a.split(':')[0]) || 0) - (parseInt(b.split(':')[0]) || 0));

  return (
    <div className="flex-1 bg-slate-50 font-sans h-full overflow-y-auto p-4 sm:p-6">
      
      {/* SECCIÓN 1: CAJAS ESPECIALES (INDEPENDIENTES Y MORADAS) */}
      {cajasEspeciales.length > 0 && (
        <div className="mb-8 bg-purple-50 p-4 sm:p-6 rounded-3xl border border-purple-200 shadow-sm">
          <h2 className="text-xl font-black text-purple-800 mb-4 flex items-center gap-2">
            <Star className="text-purple-500" /> Kioscos Especiales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cajasEspeciales.map(caja => (
              <div key={caja.id} className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 relative">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-black text-slate-800 uppercase tracking-tight">{caja.nombre}</h3>
                  <ActionMenu onEdit={() => onEditCaja(caja.id)} onDelete={() => onDeleteCaja(caja.id)} direccion="abajo" />
                </div>
                <div className="space-y-2">
                  {caja.turnos.map(turno => {
                    const participanteNorm = getParticipante(turno.participanteId);
                    return (
                      <div key={turno.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-black text-purple-600 mb-1 flex items-center gap-1">
                            <Clock size={12}/> {turno.horario}
                          </div>
                          {participanteNorm ? (
                            <div className="font-bold text-slate-700 text-sm flex items-center gap-1">
                              <User size={14}/> {participanteNorm.nombre}
                            </div>
                          ) : (
                            <div className="text-slate-400 text-xs font-bold flex items-center gap-1">
                              <Lock size={12}/> Disponible
                            </div>
                          )}
                        </div>
                        <div>
                          {participanteNorm ? (
                             <button onClick={() => onQuitar(caja.id, turno.id, participanteNorm.id)} className="p-2 bg-white text-red-500 hover:bg-red-50 border border-slate-200 rounded-lg shadow-sm transition">
                               <X size={16} />
                             </button>
                          ) : (
                             <button onClick={() => onAsignar(caja.id, caja.nombre, turno.id, turno.horario)} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1">
                               <Plus size={14} /> Asignar
                             </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: TABLA NORMAL */}
      {cajasNormales.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full pb-4">
            <table className="w-full table-fixed border-separate border-spacing-0 min-w-max">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-slate-100 border-b border-slate-200 p-3 w-[100px] sm:w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <button onClick={onCrearHorario} className="mx-auto w-full max-w-[80px] h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center gap-1 hover:bg-blue-200 transition-colors shadow-sm mb-2">
                      <Plus size={14} /> <span className="text-[10px] font-black uppercase">Turno</span>
                    </button>
                    <div className="flex items-center justify-center gap-1.5 text-slate-500 font-black text-xs uppercase tracking-wider">
                      <Clock size={14} /> Horario
                    </div>
                  </th>
                  {cajasNormales.map(caja => (
                    <th key={caja.id} className="border-b border-slate-200 bg-white p-3 w-[160px] sm:w-[200px] border-l">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-black text-slate-700 text-xs sm:text-sm uppercase tracking-wide leading-tight break-words">{caja.nombre}</span>
                        <ActionMenu onEdit={() => onEditCaja(caja.id)} onDelete={() => onDeleteCaja(caja.id)} direccion="derecha" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horariosUnicos.map((horario, rowIndex) => (
                  <tr key={horario} className={rowIndex % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                    <td className="sticky left-0 z-10 bg-slate-50 border-b border-slate-100 p-3 w-[100px] sm:w-[120px] text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-top">
                      <span className="font-black text-slate-700 text-sm sm:text-base block mb-2">{horario}</span>
                      <ActionMenu onEdit={() => onEditHorario(horario)} onDelete={() => onDeleteHorario(horario)} direccion="derecha" />
                    </td>
                    {cajasNormales.map(caja => {
                      const turnosEnEsteHorario = caja.turnos.filter(t => t.horario === horario);
                      return (
                        <td key={`${caja.id}-${horario}`} className="border-b border-slate-100 border-l p-2 align-top w-[160px] sm:w-[200px]">
                          <div className="space-y-2">
                            {turnosEnEsteHorario.map((turno) => {
                              const participanteNorm = getParticipante(turno.participanteId);
                              return (
                                <div key={turno.id} className="w-full relative group">
                                  {participanteNorm ? (
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 relative pr-7 shadow-sm">
                                      <button onClick={() => onQuitar(caja.id, turno.id, participanteNorm.id)} className="absolute top-1.5 right-1.5 text-red-400 hover:text-red-600 bg-white rounded-md transition-colors p-0.5 shadow-sm">
                                        <X size={14} />
                                      </button>
                                      <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs sm:text-sm leading-tight break-words">
                                        <User size={12} className="shrink-0" /> {participanteNorm.nombre}
                                      </div>
                                      <span className="text-[9px] text-indigo-500 font-bold uppercase block mt-1">Confirmado</span>
                                    </div>
                                  ) : (
                                    <button onClick={() => onAsignar(caja.id, caja.nombre, turno.id, turno.horario)} className="w-full h-12 bg-white border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 flex items-center justify-center gap-1 hover:bg-indigo-50 transition-colors shadow-sm">
                                      <Plus size={14} /> <span className="text-xs font-bold">Asignar</span>
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                            {turnosEnEsteHorario.length === 0 && (
                               <div className="h-12 bg-slate-100/50 border-2 border-slate-200 border-dashed rounded-lg flex items-center justify-center opacity-50">
                                 <Lock size={14} className="text-slate-400" />
                               </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center p-10 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl">Crea tu primera caja normal arriba.</div>
      )}
    </div>
  );
};

export default MatrizTurnos;
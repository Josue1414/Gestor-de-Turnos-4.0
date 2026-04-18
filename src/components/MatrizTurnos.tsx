import React from 'react';
import { Plus, User, X, Clock, Lock } from 'lucide-react';
import ActionMenu from './ActionMenu';
import type { DiaEvento, Participante } from '../types';
import CajasEspeciales from './CajasEspeciales';

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
      <CajasEspeciales 
        cajas={cajasEspeciales as never} // *Nota: Si te marca error de tipos aquí, es porque DiaEvento usa un tipo ligeramente distinto, pero internamente CajasEspeciales ya es estricto.
        getParticipante={getParticipante}
        rol="admin"
        onEditCaja={onEditCaja}
        onDeleteCaja={onDeleteCaja}
        onAsignar={onAsignar}
        onQuitar={onQuitar}
        // onDeleteTurnoEspecial={onDeleteTurnoEspecial} <- Cuando crees esta función, descoméntala
      />

      {/* SECCIÓN 2: TABLA NORMAL */}
      {cajasNormales.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full pb-4">
            <table className="w-full table-fixed border-separate border-spacing-0 min-w-max">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-slate-100 border-b border-slate-200 p-3 w-[80px] sm:w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <button onClick={onCrearHorario} className="mx-auto w-full max-w-[80px] h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center gap-1 hover:bg-blue-200 transition-colors shadow-sm mb-2">
                      <Plus size={14} /> <span className="text-[10px] font-black uppercase">Turno</span>
                    </button>
                    <div className="flex items-center justify-center gap-1.5 text-slate-500 font-black text-xs uppercase tracking-wider">
                      <Clock size={14} /> Horario
                    </div>
                  </th>
                  {cajasNormales.map(caja => (
                    <th key={caja.id} className="border-b border-slate-200 bg-white p-1.5 sm:p-3 w-[110px] sm:w-[200px] border-l">
                      <div className="flex justify-between items-start gap-1 sm:gap-2">
                        <span className="font-black text-slate-700 text-[10px] sm:text-sm uppercase tracking-wide leading-tight break-words">{caja.nombre}</span>
                        <ActionMenu onEdit={() => onEditCaja(caja.id)} onDelete={() => onDeleteCaja(caja.id)} direccion="derecha" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horariosUnicos.map((horario, rowIndex) => (
                  <tr key={horario} className={rowIndex % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                    <td className="sticky left-0 z-10 bg-slate-50 border-b border-slate-100 p-3 w-[80px] sm:w-[120px] text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-top">
                      <span className="font-black text-slate-700 text-xs sm:text-base block mb-2">{horario}</span>
                      <ActionMenu onEdit={() => onEditHorario(horario)} onDelete={() => onDeleteHorario(horario)} direccion="derecha" />
                    </td>
                    {cajasNormales.map(caja => {
                      const turnosEnEsteHorario = caja.turnos.filter(t => t.horario === horario);
                      return (
                        <td key={`${caja.id}-${horario}`} className="border-b border-slate-100 border-l p-1 sm:p-2 align-top w-[110px] sm:w-[200px]">
                          <div className="space-y-2">
                            {turnosEnEsteHorario.map((turno) => {
                              const participanteNorm = getParticipante(turno.participanteId);
                              return (
                                <div key={turno.id} className="w-full relative group">
                                  {participanteNorm ? (
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-1.5 sm:p-2 relative pr-6 sm:pr-7 shadow-sm overflow-hidden">
                                      <button onClick={() => onQuitar(caja.id, turno.id, participanteNorm.id)} className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 text-red-400 hover:text-red-600 bg-white rounded-md transition-colors p-0.5 shadow-sm z-10">
                                        <X size={12} className="sm:w-3.5 sm:h-3.5" />
                                      </button>
                                      <div className="flex items-center gap-1 font-bold text-indigo-900 text-[10px] sm:text-sm leading-tight break-words">
                                        <User size={10} className="shrink-0 sm:w-3 sm:h-3" /> <span className="truncate">{participanteNorm.nombre}</span>
                                      </div>
                                      <span className="text-[8px] sm:text-[9px] text-indigo-500 font-bold uppercase block mt-0.5 sm:mt-1">Confirmado</span>
                                    </div>
                                  ) : (
                                    <button onClick={() => onAsignar(caja.id, caja.nombre, turno.id, turno.horario)} className="w-full h-8 sm:h-12 bg-white border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 flex items-center justify-center gap-1 hover:bg-indigo-50 transition-colors shadow-sm overflow-hidden">
                                      <Plus size={12} className="sm:w-3.5 sm:h-3.5" /> <span className="text-[10px] sm:text-xs font-bold">Asignar</span>
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                            {turnosEnEsteHorario.length === 0 && (
                               <div className="h-8 sm:h-12 bg-slate-100/50 border-2 border-slate-200 border-dashed rounded-lg flex items-center justify-center opacity-50">
                                 <Lock size={12} className="text-slate-400 sm:w-3.5 sm:h-3.5" />
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
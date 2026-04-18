import React, { useMemo } from 'react';
import { Plus, User, Lock, Clock } from 'lucide-react';
import type { DiaEvento, Participante } from '../types';
import CajasEspeciales from './CajasEspeciales';

interface MatrizTurnosParticipanteProps {
  diaActual: DiaEvento;
  getParticipante: (id: string | null) => Participante | undefined;
  miUsuarioId: string;
  onAsignarme: (cajaId: string, turnoId: string) => void;
  onQuitarme: (cajaId: string, turnoId: string) => void;
}

interface CajaCheck { isEspecial?: unknown; especial?: unknown; tipo?: unknown; nombre?: unknown; }

const MatrizTurnosParticipante: React.FC<MatrizTurnosParticipanteProps> = ({ 
  diaActual, getParticipante, miUsuarioId, onAsignarme, onQuitarme
}) => {

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

  // --- LÓGICA DE OVERLAP INTERNA ---
  const hayChoque = (h1: string, h2: string) => {
    try {
      const parse = (t: string) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };
      const r1 = h1.split('-'), r2 = h2.split('-');
      const i1 = parse(r1[0].trim()), f1 = r1.length > 1 ? parse(r1[1].trim()) : i1 + 59;
      const i2 = parse(r2[0].trim()), f2 = r2.length > 1 ? parse(r2[1].trim()) : i2 + 59;
      return i1 < f2 && i2 < f1;
    } catch { return false; }
  };

  const misHorariosOcupados = useMemo(() => {
    const ocupados: string[] = [];
    diaActual.cajas.forEach(c => c.turnos.forEach(t => {
      if (t.participanteId === miUsuarioId) ocupados.push(t.horario);
    }));
    return ocupados;
  }, [diaActual, miUsuarioId]);

  const isBusy = (horario: string) => misHorariosOcupados.some(miHor => hayChoque(miHor, horario));

  

  return (
    <div className="flex-1 bg-slate-50 font-sans h-full overflow-y-auto p-4 sm:p-6">
      
      {/* SECCIÓN CAJAS ESPECIALES */}
      
      <CajasEspeciales 
        cajas={cajasEspeciales as never}
        getParticipante={getParticipante}
        rol="participante"
        miUsuarioId={miUsuarioId}
        isBusy={isBusy}
        onAsignarme={onAsignarme}
        onQuitarme={onQuitarme}
      />

      {/* SECCIÓN TABLA NORMAL */}
      {cajasNormales.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full pb-4">
            <table className="w-full table-fixed border-separate border-spacing-0 min-w-max">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-slate-100 border-b border-slate-200 p-3 w-[80px] sm:w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-center gap-1.5 text-slate-500 font-black text-xs uppercase tracking-wider mt-4">
                      <Clock size={14} /> Horario
                    </div>
                  </th>
                  {cajasNormales.map(caja => (
                    <th key={caja.id} className="border-b border-slate-200 bg-white p-1.5 sm:p-3 w-[110px] sm:w-[200px] border-l">
                       <span className="font-black text-slate-700 text-[10px] sm:text-sm uppercase tracking-wide leading-tight break-words">{caja.nombre}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horariosUnicos.map((horario, rowIndex) => (
                  <tr key={horario} className={rowIndex % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                    <td className="sticky left-0 z-10 bg-slate-50 border-b border-slate-100 p-3 w-[80px] sm:w-[120px] text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-top">
                      <span className="font-black text-slate-700 text-xs sm:text-base block">{horario}</span>
                    </td>
                    {cajasNormales.map(caja => {
                      const turnosEnEsteHorario = caja.turnos.filter(t => t.horario === horario);
                      return (
                        <td key={`${caja.id}-${horario}`} className="border-b border-slate-100 border-l p-1 sm:p-2 align-top w-[110px] sm:w-[200px]">
                          <div className="space-y-2">
                            {turnosEnEsteHorario.map((turno) => {
                              const participanteTurno = getParticipante(turno.participanteId);
                              const isMiTurno = turno.participanteId === miUsuarioId;
                              const estaOcupadoEnOtroLado = isBusy(turno.horario) && !isMiTurno;
                              
                              return (
                                <div key={turno.id} className="w-full">
                                  {isMiTurno ? (
                                    <button onClick={() => onQuitarme(caja.id, turno.id)} className="w-full text-left bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-1.5 sm:p-2 transition-colors shadow-md relative group overflow-hidden">
                                      <div className="flex justify-between items-center">
                                        <span className="font-black text-[9px] sm:text-sm truncate">TÚ ESTÁS AQUÍ</span>
                                        <Lock size={10} className="group-hover:hidden sm:w-3 sm:h-3 shrink-0" />
                                        <span className="text-[8px] sm:text-[10px] bg-red-500 text-white px-1 sm:px-1.5 py-0.5 rounded font-bold hidden group-hover:block absolute right-1">Quitar</span>
                                      </div>
                                    </button>
                                  ) : participanteTurno ? (
                                    <div className="bg-slate-100 border border-slate-200 rounded-lg p-1.5 sm:p-2 opacity-60 overflow-hidden">
                                      <div className="flex items-center gap-1 font-bold text-slate-600 text-[10px] sm:text-sm break-words">
                                        <User size={10} className="shrink-0 sm:w-3 sm:h-3" /> <span className="truncate">{participanteTurno.nombre}</span>
                                      </div>
                                    </div>
                                  ) : estaOcupadoEnOtroLado ? (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-1.5 sm:p-2 opacity-80 cursor-not-allowed overflow-hidden">
                                      <div className="flex items-center gap-1 font-bold text-red-700 text-[10px] sm:text-sm">
                                        <Lock size={10} className="shrink-0 sm:w-3 sm:h-3" /> <span className="truncate">Bloqueado</span>
                                      </div>
                                      <span className="text-[8px] sm:text-[9px] text-red-500 font-bold block mt-0.5 truncate">Ya tienes turno</span>
                                    </div>
                                  ) : (
                                    <button onClick={() => onAsignarme(caja.id, turno.id)} className="w-full h-8 sm:h-12 bg-white border border-dashed border-emerald-400 rounded-lg text-emerald-600 flex items-center justify-center gap-1 hover:bg-emerald-50 transition-colors shadow-sm overflow-hidden">
                                      <Plus size={12} className="sm:w-3.5 sm:h-3.5" /> <span className="text-[10px] sm:text-xs font-bold">Asignarme</span>
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                            {turnosEnEsteHorario.length === 0 && (
                               <div className="h-8 sm:h-12 bg-red-50 border-2 border-red-200 rounded-lg flex flex-col justify-center items-center opacity-70">
                                 <Lock size={10} className="text-red-700 mb-0.5 sm:w-3 sm:h-3" />
                                 <span className="text-[8px] sm:text-[9px] text-red-500 font-bold uppercase hidden sm:inline-block">No Aplica</span>
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
      )}
    </div>
  );
};

export default MatrizTurnosParticipante;
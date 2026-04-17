import React, { useMemo } from 'react';
import { Plus, User, Lock, Star, Clock } from 'lucide-react';
import type { DiaEvento, Participante } from '../types';

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
      {cajasEspeciales.length > 0 && (
        <div className="mb-8 bg-purple-50 p-4 sm:p-6 rounded-3xl border border-purple-200 shadow-sm">
          <h2 className="text-xl font-black text-purple-800 mb-4 flex items-center gap-2">
            <Star className="text-purple-500" /> Kioscos Especiales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cajasEspeciales.map(caja => (
              <div key={caja.id} className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
                <h3 className="font-black text-slate-800 uppercase tracking-tight mb-4">{caja.nombre}</h3>
                <div className="space-y-2">
                  {caja.turnos.map(turno => {
                    const p = getParticipante(turno.participanteId);
                    const isMiTurno = turno.participanteId === miUsuarioId;
                    const estaOcupadoEnOtroLado = isBusy(turno.horario) && !isMiTurno;

                    return (
                      <div key={turno.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="text-xs font-black text-purple-600 mb-2 flex items-center gap-1">
                          <Clock size={12}/> {turno.horario}
                        </div>

                        {isMiTurno ? (
                          <button onClick={() => onQuitarme(caja.id, turno.id)} className="w-full text-left bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl text-sm font-bold flex justify-between items-center group transition shadow-md">
                            <span>TÚ ESTÁS AQUÍ</span>
                            <span className="hidden group-hover:block bg-red-500 px-2 py-1 rounded text-xs">Quitar</span>
                          </button>
                        ) : turno.participanteId ? (
                          <div className="bg-white border border-slate-200 rounded-xl p-2.5 opacity-60">
                            <span className="font-bold text-slate-600 text-sm flex items-center gap-1.5"><User size={14}/> {p?.nombre}</span>
                          </div>
                        ) : estaOcupadoEnOtroLado ? (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 opacity-80 cursor-not-allowed">
                            <span className="font-bold text-red-600 text-xs flex items-center gap-1.5"><Lock size={14}/> Tienes otro turno a esta hora</span>
                          </div>
                        ) : (
                          <button onClick={() => onAsignarme(caja.id, turno.id)} className="w-full bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white p-2.5 rounded-xl text-sm font-bold border border-purple-200 shadow-sm transition flex items-center justify-center gap-1">
                            <Plus size={16} /> Asignarme
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN TABLA NORMAL */}
      {cajasNormales.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full pb-4">
            <table className="w-full table-fixed border-separate border-spacing-0 min-w-max">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-slate-100 border-b border-slate-200 p-3 w-[100px] sm:w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-center gap-1.5 text-slate-500 font-black text-xs uppercase tracking-wider mt-4">
                      <Clock size={14} /> Horario
                    </div>
                  </th>
                  {cajasNormales.map(caja => (
                    <th key={caja.id} className="border-b border-slate-200 bg-white p-3 w-[160px] sm:w-[200px] border-l">
                       <span className="font-black text-slate-700 text-xs sm:text-sm uppercase tracking-wide leading-tight break-words">{caja.nombre}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horariosUnicos.map((horario, rowIndex) => (
                  <tr key={horario} className={rowIndex % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                    <td className="sticky left-0 z-10 bg-slate-50 border-b border-slate-100 p-3 w-[100px] sm:w-[120px] text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-top">
                      <span className="font-black text-slate-700 text-sm sm:text-base block">{horario}</span>
                    </td>
                    {cajasNormales.map(caja => {
                      const turnosEnEsteHorario = caja.turnos.filter(t => t.horario === horario);
                      return (
                        <td key={`${caja.id}-${horario}`} className="border-b border-slate-100 border-l p-2 align-top w-[160px] sm:w-[200px]">
                          <div className="space-y-2">
                            {turnosEnEsteHorario.map((turno) => {
                              const participanteTurno = getParticipante(turno.participanteId);
                              const isMiTurno = turno.participanteId === miUsuarioId;
                              const estaOcupadoEnOtroLado = isBusy(turno.horario) && !isMiTurno;
                              
                              return (
                                <div key={turno.id} className="w-full">
                                  {isMiTurno ? (
                                    <button onClick={() => onQuitarme(caja.id, turno.id)} className="w-full text-left bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 transition-colors shadow-md relative group">
                                      <div className="flex justify-between items-center">
                                        <span className="font-black text-xs sm:text-sm">TÚ ESTÁS AQUÍ</span>
                                        <Lock size={12} className="group-hover:hidden" />
                                        <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold hidden group-hover:block">Quitar</span>
                                      </div>
                                    </button>
                                  ) : participanteTurno ? (
                                    <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 opacity-60">
                                      <div className="flex items-center gap-1.5 font-bold text-slate-600 text-xs sm:text-sm break-words">
                                        <User size={12} className="shrink-0" /> {participanteTurno.nombre}
                                      </div>
                                    </div>
                                  ) : estaOcupadoEnOtroLado ? (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 opacity-80 cursor-not-allowed">
                                      <div className="flex items-center gap-1.5 font-bold text-red-700 text-xs sm:text-sm">
                                        <Lock size={12} /> Bloqueado
                                      </div>
                                      <span className="text-[9px] text-red-500 font-bold block mt-0.5">Ya tienes turno a esta hora</span>
                                    </div>
                                  ) : (
                                    <button onClick={() => onAsignarme(caja.id, turno.id)} className="w-full h-12 bg-white border border-dashed border-emerald-400 rounded-lg text-emerald-600 flex items-center justify-center gap-1 hover:bg-emerald-50 transition-colors shadow-sm">
                                      <Plus size={14} /> <span className="text-xs font-bold">Asignarme</span>
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                            {turnosEnEsteHorario.length === 0 && (
                               <div className="h-12 bg-red-50 border-2 border-red-200 rounded-lg flex flex-col justify-center items-center opacity-70">
                                 <Lock size={12} className="text-red-700 mb-0.5" />
                                 <span className="text-[9px] text-red-500 font-bold uppercase">No Aplica</span>
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
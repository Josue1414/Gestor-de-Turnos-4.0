import React, { useMemo } from 'react';
import { Plus, User, Lock, X } from 'lucide-react';
import type { DiaEvento, Participante } from '../types';

interface MatrizTurnosParticipanteProps {
  diaActual: DiaEvento;
  getParticipante: (id: string | null) => Participante | undefined;
  miUsuarioId: string;
  onAsignarme: (cajaId: string, turnoId: string) => void;
  onQuitarme: (cajaId: string, turnoId: string) => void;
}

const MatrizTurnosParticipante: React.FC<MatrizTurnosParticipanteProps> = ({ 
  diaActual, getParticipante, miUsuarioId, onAsignarme, onQuitarme
}) => {

  // Extraemos todos los horarios únicos (Corregido de rangoHorario a horario)
  const horariosUnicos = Array.from(new Set(
    diaActual.cajas.flatMap(caja => caja.turnos.map(t => t.horario))
  )).sort((a, b) => {
    const horaA = parseInt(a.split(':')[0], 10);
    const horaB = parseInt(b.split(':')[0], 10);
    return horaA - horaB;
  });

  // Calculamos en qué horarios el participante YA tiene un turno asignado hoy
  const misHorariosOcupados = useMemo(() => {
    const ocupados = new Set<string>();
    diaActual.cajas.forEach(caja => {
      caja.turnos.forEach(turno => {
        if (turno.participanteId === miUsuarioId) {
          ocupados.add(turno.horario);
        }
      });
    });
    return ocupados;
  }, [diaActual, miUsuarioId]);

  return (
    <div className="overflow-x-auto overflow-y-auto flex-1 bg-slate-50 font-sans">
      <table className="w-full min-w-max border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="sticky left-0 z-30 bg-slate-700 text-white p-3 text-left w-36 border-b-2 border-slate-800">
              <span className="text-[10px] font-black uppercase opacity-50 tracking-widest">Horarios</span>
            </th>
            {diaActual.cajas.map(caja => (
              <th key={caja.id} className="bg-slate-700 text-white p-3 text-left min-w-[160px] border-b-2 border-slate-800 border-l border-slate-600">
                <div className="font-black text-sm">{caja.nombre}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horariosUnicos.map((horario, index) => (
            <tr key={index} className="hover:bg-slate-100/50 transition-colors">
              <td className="sticky left-0 z-20 bg-slate-50 p-3 border-b border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                <span className="text-xs font-black text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm whitespace-nowrap">
                  {horario}
                </span>
              </td>
              {diaActual.cajas.map(caja => {
                // Corregido de rangoHorario a horario
                const turno = caja.turnos.find(t => t.horario === horario);
                const participanteTurno = getParticipante(turno?.participanteId || null);
                
                const esMiTurno = turno?.participanteId === miUsuarioId;
                const estoyOcupadoEnEsteHorario = !esMiTurno && turno && misHorariosOcupados.has(turno.horario);

                return (
                  <td key={caja.id} className="p-2 min-w-[160px] border-b border-l border-slate-200">
                    {!turno ? (
                      <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-xl h-full min-h-[60px] flex flex-col items-center justify-center text-slate-400 opacity-50">
                        <span className="text-xs font-bold">Sin turno</span>
                      </div>
                    ) : estoyOcupadoEnEsteHorario ? (
                      // =====================================
                      // TARJETA ROJA CON CANDADO (NO APLICA)
                      // =====================================
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 opacity-80 cursor-not-allowed">
                        <div className="flex items-center gap-2 font-bold text-red-700 text-sm">
                          <Lock size={14} /> Bloqueado
                        </div>
                        <span className="text-[10px] text-red-500 font-bold uppercase">No Aplica</span>
                      </div>
                    ) : esMiTurno ? (
                      <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-3 relative transform shadow-sm">
                        <button 
                          onClick={() => onQuitarme(caja.id, turno!.id)} 
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md p-0.5 transition-colors"
                          title="Quitarme de este turno"
                        >
                          <X size={16} />
                        </button>
                        <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                          <User size={14} /> {participanteTurno?.nombre} (Tú)
                        </div>
                        <span className="text-[10px] text-blue-600 font-black uppercase">Confirmado</span>
                      </div>
                    ) : turno.participanteId ? (
                      <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 opacity-75 cursor-not-allowed">
                        <div className="flex items-center gap-2 font-bold text-slate-600 text-sm">
                          <User size={14} /> {participanteTurno?.nombre}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Ocupado</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => onAsignarme(caja.id, turno.id)} 
                        className="w-full h-full min-h-[60px] bg-white border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl p-3 text-left transition-all group flex flex-col justify-center shadow-sm"
                      >
                        <div className="flex items-center gap-2 font-bold text-emerald-600 text-sm">
                          <Plus size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" /> Asignarme
                        </div>
                        <span className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Libre</span>
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

export default MatrizTurnosParticipante;
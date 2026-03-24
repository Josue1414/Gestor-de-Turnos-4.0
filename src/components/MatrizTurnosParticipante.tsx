import React from 'react';
import { Plus, User, Lock, Star, X } from 'lucide-react';
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
  return (
    <div className="overflow-x-auto overflow-y-auto flex-1 bg-slate-50 font-sans">
      <table className="w-full min-w-max border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="sticky left-0 z-30 bg-slate-700 text-white p-3 text-left w-36 border-b-2 border-slate-800">
              <span className="text-[10px] font-black uppercase opacity-50 tracking-widest">Horarios</span>
            </th>

            {diaActual.cajas.map(caja => (
              <th 
                key={caja.id} 
                className={`sticky top-0 z-20 p-3 min-w-[220px] border-b-2 border-slate-800 border-l transition-colors ${
                  caja.esEspecial ? 'bg-indigo-700 text-white border-l-indigo-500' : 'bg-slate-600 text-white border-l-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 min-h-[32px]">
                  {caja.esEspecial && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                  <span className="font-bold uppercase text-sm tracking-tight">{caja.nombre}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {diaActual.horariosMaestros.map((horario, rowIdx) => (
            <tr key={rowIdx}>
              <td className="sticky left-0 z-10 bg-slate-600 text-white p-3 border-b border-slate-500 shadow-xl">
                <span className="font-bold text-sm font-mono tracking-tighter">{horario}</span>
              </td>
              
              {diaActual.cajas.map(caja => {
                const esEspecial = caja.esEspecial;
                const turno = caja.turnos.find(t => t.horario === horario);

                // --- NUEVA LÓGICA PARA CAJAS ESPECIALES ---
                if (esEspecial) {
                  // Solo dibujamos la caja especial en la PRIMERA fila
                  if (rowIdx === 0) {
                    return (
                      <td key={caja.id} className="p-3 border-b border-l border-indigo-100 bg-indigo-50/20 align-top h-full">
                        <div className="text-center p-4 bg-indigo-100 text-indigo-500 rounded-xl text-xs font-bold border-2 border-dashed border-indigo-200">
                          Área gestionada por el Administrador
                          <br />
                          <span className="text-[10px] opacity-70 mt-1 block">(Horario: {caja.turnos[0]?.horario})</span>
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
                const participanteTurno = getParticipante(turno?.participanteId || null);
                const esMiTurno = turno?.participanteId === miUsuarioId;

                return (
                  <td key={caja.id} className="p-2 border-b border-l border-slate-200 bg-white">
                    {/* Quitamos la evaluación manual de 'CERRADO' porque ahora es dinámico según esEspecial */}
                    {turno?.participanteId === null ? (
                      <button 
                        onClick={() => onAsignarme(caja.id, turno!.id)} 
                        className="w-full h-16 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 flex flex-col items-center justify-center gap-1 hover:bg-emerald-100 hover:border-emerald-400 transition-all shadow-sm"
                      >
                        <Plus size={20} /> <span className="text-[10px] font-bold uppercase tracking-wide">Asignarme</span>
                      </button>
                    ) : esMiTurno ? (
                      <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-3 relative group transition-transform shadow-sm">
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
                    ) : (
                      <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 opacity-75 cursor-not-allowed">
                        <div className="flex items-center gap-2 font-bold text-slate-600 text-sm">
                          <User size={14} /> {participanteTurno?.nombre}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Ocupado</span>
                      </div>
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
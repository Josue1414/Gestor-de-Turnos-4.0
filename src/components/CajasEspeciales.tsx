import React, { useState } from 'react';
import { Plus, User, X, Star, Clock, Lock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import ActionMenu from './ActionMenu';
import type { Participante } from '../types';

interface Turno {
  id: string;
  horario: string;
  participanteId: string | null;
}

interface CajaEspecial {
  id: string;
  nombre: string;
  turnos: Turno[];
}

interface CajasEspecialesProps {
  cajas: CajaEspecial[];
  getParticipante: (id: string | null) => Participante | undefined;
  rol: 'admin' | 'participante';
  
  onEditCaja?: (cajaId: string) => void;
  onDeleteCaja?: (cajaId: string) => void;
  onAsignar?: (cajaId: string, cajaNombre: string, turnoId: string, horario: string) => void;
  onQuitar?: (cajaId: string, turnoId: string, participanteId: string) => void;
  
  onEditTurnoEspecial?: (cajaId: string, turnoId: string) => void;
  onDeleteTurnoEspecial?: (cajaId: string, turnoId: string) => void;
  
  miUsuarioId?: string;
  isBusy?: (horario: string) => boolean;
  onAsignarme?: (cajaId: string, turnoId: string) => void;
  onQuitarme?: (cajaId: string, turnoId: string) => void;
}

const CajasEspeciales: React.FC<CajasEspecialesProps> = ({
  cajas, getParticipante, rol,
  onEditCaja, onDeleteCaja, onAsignar, onQuitar, 
  onDeleteTurnoEspecial,
  miUsuarioId, isBusy, onAsignarme, onQuitarme
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (cajas.length === 0) return null;

  return (
    <div className="mb-6 bg-purple-50 rounded-3xl border border-purple-200 shadow-sm overflow-hidden">
      
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between bg-purple-100/70 hover:bg-purple-200 transition-colors"
      >
        <h2 className="text-sm font-black text-purple-800 flex items-center gap-2">
          <Star className="text-purple-500" size={16} /> Caja Especiales ({cajas.length})
        </h2>
        {isExpanded ? <ChevronUp className="text-purple-600" size={16} /> : <ChevronDown className="text-purple-600" size={16} />}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 mt-4">
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x custom-scrollbar">
            {cajas.map(caja => (
              <div key={caja.id} className="bg-white rounded-2xl p-3 shadow-sm border border-purple-100 flex-shrink-0 w-[200px] sm:w-[240px] snap-start flex flex-col">
                
                {/* CABECERA DE LA CAJA ESPECIAL (Aquí se conservan Editar/Eliminar caja) */}
                <div className="flex justify-between items-start mb-3 shrink-0">
                  <h3 className="font-black text-slate-800 uppercase tracking-tight text-[11px] truncate pr-2">{caja.nombre}</h3>
                  {rol === 'admin' && onEditCaja && onDeleteCaja && (
                    <ActionMenu onEdit={() => onEditCaja(caja.id)} onDelete={() => onDeleteCaja(caja.id)} direccion="abajo" />
                  )}
                </div>

                {/* CONTENEDOR DE HORARIOS */}
                <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 max-h-[155px] custom-scrollbar">
                  {caja.turnos.map((turno) => {
                    const participanteNorm = getParticipante(turno.participanteId);
                    const isMiTurno = rol === 'participante' && turno.participanteId === miUsuarioId;
                    const estaOcupadoEnOtroLado = rol === 'participante' && isBusy ? (isBusy(turno.horario) && !isMiTurno) : false;

                    return (
                      <div key={turno.id} className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-between group gap-2">
                        
                        {/* LADO IZQUIERDO: Botón Eliminar + Info del Turno */}
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          
                          {/* Botón Eliminar Horario (Solo visible para Admin) */}
                          {rol === 'admin' && onDeleteTurnoEspecial && (
                            <button 
                              onClick={() => onDeleteTurnoEspecial(caja.id, turno.id)} 
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                              title="Eliminar este horario"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          {/* Info del Horario y Status */}
                          <div className="overflow-hidden flex-1 flex flex-col justify-center">
                            <div className="text-[10px] font-black text-purple-600 mb-0.5 flex items-center gap-1">
                              <Clock size={10}/> {turno.horario}
                            </div>

                            {participanteNorm ? (
                              <div className="font-bold text-slate-700 text-[10px] flex items-center gap-1 truncate pr-1">
                                <User size={10} className="shrink-0"/> <span className="truncate">{participanteNorm.nombre}</span>
                              </div>
                            ) : rol === 'participante' && estaOcupadoEnOtroLado ? (
                              <div className="text-red-500 text-[9px] font-bold flex items-center gap-1">
                                <Lock size={10}/> Ocupado
                              </div>
                            ) : (
                              <div className="text-slate-400 text-[9px] font-bold flex items-center gap-1">
                                <Lock size={10}/> Disponible
                              </div>
                            )}
                          </div>
                        </div>

                        {/* LADO DERECHO: Exclusivo para el botón de Asignar / Quitar */}
                        <div className="flex items-center shrink-0">
                          {rol === 'admin' && (
                            <>
                              {participanteNorm && onQuitar ? (
                                <button 
                                  onClick={() => onQuitar(caja.id, turno.id, participanteNorm.id)} 
                                  className="p-2 bg-white text-red-500 hover:bg-red-50 border border-slate-200 rounded-lg shadow-sm transition"
                                  title="Quitar participante"
                                >
                                  <X size={14} />
                                </button>
                              ) : onAsignar && !participanteNorm && (
                                <button 
                                  onClick={() => onAsignar(caja.id, caja.nombre, turno.id, turno.horario)} 
                                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition"
                                  title="Asignar participante"
                                >
                                  <Plus size={14} />
                                </button>
                              )}
                            </>
                          )}

                          {rol === 'participante' && (
                            <>
                              {isMiTurno && onQuitarme ? (
                                <button 
                                  onClick={() => onQuitarme(caja.id, turno.id)} 
                                  className="px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[9px] font-bold shadow-sm transition"
                                >
                                  Liberar
                                </button>
                              ) : !participanteNorm && !estaOcupadoEnOtroLado && onAsignarme ? (
                                <button 
                                  onClick={() => onAsignarme(caja.id, turno.id)} 
                                  className="px-2 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white rounded-lg text-[9px] font-bold border border-purple-200 shadow-sm transition"
                                >
                                  Asignarme
                                </button>
                              ) : null}
                            </>
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
    </div>
  );
};

export default CajasEspeciales;
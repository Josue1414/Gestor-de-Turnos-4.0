// src/components/CajasEspeciales.tsx
import React, { useState } from 'react';
import { Plus, User, Star, Clock, Lock, ChevronDown, ChevronUp, Trash2, UserMinus } from 'lucide-react';
import ActionMenu from './ActionMenu';
import type { Participante } from '../types';
import { useTurnoModal } from '../hooks/useTurnoModal';
import { useTiempoReal } from '../hooks/useTiempoReal'; // <-- AÑADIDO
import ModalInfoTurno from './ModalInfoTurno';

interface Turno {
  id: string;
  horario: string;
  participanteId: string | null;
  entregada?: boolean; 
  devuelta?: boolean;  
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
  
  onActualizarEstadoTurno?: (cajaId: string, turnoId: string, entregada: boolean, devuelta: boolean) => void;
  
  // NUEVO: Para validar que el "En curso" coincida con el día actual
  fechaDia?: string; 
}

const CajasEspeciales: React.FC<CajasEspecialesProps> = ({
  cajas, getParticipante, rol,
  onEditCaja, onDeleteCaja, onAsignar, onQuitar, 
  onDeleteTurnoEspecial,
  miUsuarioId, isBusy, onAsignarme, onQuitarme,
  onActualizarEstadoTurno, fechaDia
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { 
    isOpen, openModal, closeModal, turnoData, countdown, 
    cajaEntregada, setCajaEntregada, cajaDevuelta, setCajaDevuelta 
  } = useTurnoModal();

  const horaActual = useTiempoReal(); // <-- AÑADIDO

  if (cajas.length === 0) return null;

  return (
    <div className="mb-6 bg-purple-50 rounded-3xl border border-purple-200 shadow-sm overflow-hidden">
      
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between bg-purple-100/70 hover:bg-purple-200 transition-colors"
      >
        <h2 className="text-sm font-black text-purple-800 flex items-center gap-2">
          <Star className="text-purple-500" size={16} /> Cajas Especiales ({cajas.length})
        </h2>
        {isExpanded ? <ChevronUp className="text-purple-600" size={16} /> : <ChevronDown className="text-purple-600" size={16} />}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 mt-4">
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x custom-scrollbar">
            {cajas.map(caja => (
              <div key={caja.id} className="bg-white rounded-2xl p-3 shadow-sm border border-purple-100 flex-shrink-0 w-[200px] sm:w-[240px] snap-start flex flex-col">
                
                <div className="flex justify-between items-start mb-3 shrink-0">
                  <h3 className="font-black text-slate-800 uppercase tracking-tight text-[11px] truncate pr-2">{caja.nombre}</h3>
                  {rol === 'admin' && onEditCaja && onDeleteCaja && (
                    <ActionMenu onEdit={() => onEditCaja(caja.id)} onDelete={() => onDeleteCaja(caja.id)} direccion="abajo" />
                  )}
                </div>

                <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 max-h-[155px] custom-scrollbar">
                  {caja.turnos.map((turno) => {
                    const participanteNorm = getParticipante(turno.participanteId);
                    const isMiTurno = rol === 'participante' && turno.participanteId === miUsuarioId;
                    const estaOcupadoEnOtroLado = rol === 'participante' && isBusy ? (isBusy(turno.horario) && !isMiTurno) : false;
                    const isOccupied = !!participanteNorm;
                    const isAdmin = rol === 'admin';

                    // --- LÓGICA DE TIEMPO REAL INTEGRADA ---
                    let isActivo = false;
                    if (turno.horario && horaActual) {
                      const hoyStr = `${horaActual.getFullYear()}-${String(horaActual.getMonth() + 1).padStart(2, '0')}-${String(horaActual.getDate()).padStart(2, '0')}`;
                      // Si proporcionan fechaDia, validamos; si no, asumimos true por defecto.
                      const aplicaHoy = fechaDia ? fechaDia.includes(hoyStr) : true;

                      if (aplicaHoy) {
                        const [inicioStr, finStr] = turno.horario.split('-').map(s => s.trim());
                        const obtenerMinutos = (horaStr: string) => {
                          if (!horaStr) return 0;
                          const [h, m] = horaStr.split(':').map(Number);
                          return (h * 60) + m;
                        };
                        const minActual = horaActual.getHours() * 60 + horaActual.getMinutes();
                        const minInicio = obtenerMinutos(inicioStr);
                        const minFin = obtenerMinutos(finStr || inicioStr);

                        isActivo = minActual >= minInicio && minActual <= minFin;
                      }
                    }

                    const handleClickTurno = () => {
                      if (isAdmin && isOccupied) {
                        openModal(caja.id, turno.id, turno.horario, caja.nombre, participanteNorm, turno);
                      }
                    };

                    return (
                      <div 
                        key={turno.id} 
                        onClick={handleClickTurno}
                        className={`rounded-xl p-2 border flex items-center justify-between group gap-2 transition-all 
                          ${isActivo ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200' : 'bg-slate-50 border-slate-100'}
                          ${isAdmin && isOccupied ? 'cursor-pointer hover:shadow-sm' : ''}
                        `}
                      >
                        
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          
                          {/* Botón Eliminar Horario (Izquierda - Borra el bloque) */}
                          {isAdmin && onDeleteTurnoEspecial && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDeleteTurnoEspecial(caja.id, turno.id); }} 
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                              title="Eliminar este horario"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          {/* Info del Horario y Status */}
                          <div className="overflow-hidden flex-1 flex flex-col justify-center">
                            <div className={`text-[10px] font-black mb-0.5 flex items-center gap-1 ${isActivo ? 'text-emerald-700' : 'text-purple-600'}`}>
                              <Clock size={10}/> {turno.horario}
                              {isActivo && <span className="ml-1 text-[7px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase animate-pulse shrink-0">En curso</span>}
                            </div>

                            {isOccupied ? (
                              <div className="flex flex-col">
                                <div className={`font-bold text-[10px] flex items-center gap-1 truncate pr-1 ${isActivo ? 'text-emerald-900' : 'text-slate-700'}`}>
                                  <User size={10} className="shrink-0"/> <span className="truncate">{participanteNorm.nombre}</span>
                                </div>
                                {isAdmin && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className={`text-[8px] font-bold uppercase ${isActivo ? 'text-emerald-600' : 'text-purple-500'}`}>Ver detalles</span>
                                    {turno.entregada && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Entregada" />}
                                    {turno.devuelta && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Devuelta" />}
                                  </div>
                                )}
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

                        {/* LADO DERECHO: Acciones */}
                        <div className="flex items-center shrink-0">
                          {isAdmin ? (
                            isOccupied ? (
                              /* Botón para Quitar Participante (Derecha - Solo quita al usuario) */
                              onQuitar && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onQuitar(caja.id, turno.id, turno.participanteId!); }}
                                  className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors ml-1"
                                  title="Quitar participante"
                                >
                                  <UserMinus size={14} />
                                </button>
                              )
                            ) : (
                              onAsignar && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onAsignar(caja.id, caja.nombre, turno.id, turno.horario); }} 
                                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition"
                                  title="Asignar participante"
                                >
                                  <Plus size={14} />
                                </button>
                              )
                            )
                          ) : (
                            <>
                              {isMiTurno && onQuitarme ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onQuitarme(caja.id, turno.id); }} 
                                  className="px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[9px] font-bold shadow-sm transition"
                                >
                                  Liberar
                                </button>
                              ) : !isOccupied && !estaOcupadoEnOtroLado && onAsignarme ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onAsignarme(caja.id, turno.id); }} 
                                  className={`px-2 py-1.5 rounded-lg text-[9px] font-bold border shadow-sm transition ${
                                    isActivo ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600' : 'bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border-purple-200'
                                  }`}
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

      <ModalInfoTurno
        isOpen={isOpen}
        onClose={closeModal}
        turnoData={turnoData}
        countdown={countdown}
        cajaEntregada={cajaEntregada}
        setCajaEntregada={setCajaEntregada}
        cajaDevuelta={cajaDevuelta}
        setCajaDevuelta={setCajaDevuelta}
        onRemove={() => {
          if (turnoData?.participante && onQuitar) {
            onQuitar(turnoData.cajaId, turnoData.turnoId, turnoData.participante.id);
          }
          closeModal();
        }}
        onSave={() => {
          if (turnoData && onActualizarEstadoTurno) {
            onActualizarEstadoTurno(turnoData.cajaId, turnoData.turnoId, cajaEntregada, cajaDevuelta);
          }
          closeModal();
        }}
      />

    </div>
  );
};

export default CajasEspeciales;
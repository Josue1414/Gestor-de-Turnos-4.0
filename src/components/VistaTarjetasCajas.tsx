// src/components/VistaTarjetasCajas.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Clock, Edit2, Trash2, User, UserPlus, Box, Star, Users, CheckCircle2 } from 'lucide-react';
import { useTurnoModal } from '../hooks/useTurnoModal';
import { useTiempoReal } from '../hooks/useTiempoReal';
import ModalInfoTurno from './ModalInfoTurno';

interface ContactoWA {
  nombre: string;
  telefono: string;
  rol: string;
}

interface VistaTarjetasCajasProps {
  diaActual: any;
  capitanes?: any[]; 
  getParticipante: (id: string | null) => any;
  onAsignar: (cajaId: string, cajaNombre: string, turnoId: string, horario: string) => void;
  onQuitar: (cajaId: string, turnoId: string, participanteId?: string) => void;
  onCrearCaja: () => void;
  onDeleteCaja: (id: string) => void;
  onDeleteHorario: (horario: string) => void;
  onEditCaja: (id: string) => void;
  onEditHorario: (horario: string) => void;
  onDeleteTurnoEspecial: (cajaId: string, turnoId: string) => void;
  onEditTurnoEspecial: (cajaId: string, turnoId: string) => void;
  onActualizarEstadoTurno: (cajaId: string, turnoId: string, entregada: boolean, devuelta: boolean) => void;
  adminPerms: { cajas: boolean; horarios: boolean; especiales: boolean };
  miUsuarioId?: string;
  isBusy?: (horario: string) => boolean; 
  contactosWhatsApp?: ContactoWA[];
  onResolveAlert?: (cajaId: string, turnoId: string) => void; 
}

const VistaTarjetasCajas: React.FC<VistaTarjetasCajasProps> = ({
  diaActual, capitanes, getParticipante, onAsignar, onQuitar, 
  onDeleteCaja, onEditCaja, onDeleteTurnoEspecial, adminPerms, miUsuarioId, isBusy, onActualizarEstadoTurno, contactosWhatsApp,
  onResolveAlert 
}) => {

  const { isOpen, openModal, closeModal, turnoData, countdown, cajaEntregada, setCajaEntregada, cajaDevuelta, setCajaDevuelta } = useTurnoModal();
  const horaActual = useTiempoReal(); 

  if (!diaActual || !diaActual.cajas) return null;

  const isCajaEspecial = (c: any): boolean => {
    if (!c || typeof c !== 'object') return false;
    if (c.isEspecial === true || c.esEspecial === true || c.especial === true) return true;
    if (c.tipo === 'especial') return true;
    if (typeof c.nombre === 'string') {
      const ln = c.nombre.toLowerCase();
      if (ln.includes('especial') || ln.includes('vip') || ln.includes('kiosco')) return true;
    }
    return false;
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-8 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {diaActual.cajas.map((caja: any) => {
          const especial = isCajaEspecial(caja);
          const totalTurnos = caja.turnos.length;
          const turnosOcupados = caja.turnos.filter((t: any) => t.participanteId).length;
          const turnosLibres = totalTurnos - turnosOcupados;
          
          const capitanDeCaja = capitanes?.find((cap: any) => 
            (cap.cajasAsignadas || []).includes(caja.id) && 
            (cap.diasAsignados || []).includes(diaActual.id)
          );

          return (
            <div key={caja.id} className={`flex flex-col rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 ${especial ? 'border-amber-300 bg-gradient-to-b from-amber-50 to-white' : 'border-slate-200 bg-white'}`}>
              
              <div className={`p-3 flex items-start justify-between border-b ${especial ? 'bg-amber-100/50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-start gap-2">
                  <div className={`p-1.5 mt-0.5 rounded-lg ${especial ? 'bg-amber-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    {especial ? <Star size={14} /> : <Box size={14} />}
                  </div>
                  <div className="flex flex-col">
                    <h3 className={`font-black text-sm uppercase tracking-tight ${especial ? 'text-amber-900' : 'text-slate-800'}`}>
                      {caja.nombre}
                    </h3>
                    {capitanDeCaja && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded w-fit mt-0.5 uppercase tracking-wider ${especial ? 'bg-amber-200 text-amber-800' : 'bg-indigo-100 text-indigo-700'}`}>
                        Capitan: {capitanDeCaja.nombre}
                      </span>
                    )}
                  </div>
                </div>
                {adminPerms.cajas && (
                  <div className="flex items-center gap-1 shrink-0">
                    {!especial && (
                      <button onClick={() => onEditCaja(caja.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition" title="Editar Nombre">
                        <Edit2 size={14} />
                      </button>
                    )}
                    <button onClick={() => onDeleteCaja(caja.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Eliminar Caja">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-white">
                 <div className="py-2 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Horarios</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><Clock size={10}/> {totalTurnos}</span>
                 </div>
                 <div className="py-2 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Libres</span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10}/> {turnosLibres}</span>
                 </div>
                 <div className="py-2 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Asignados</span>
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1"><Users size={10}/> {turnosOcupados}</span>
                 </div>
              </div>

              <div className="flex-1 p-3 space-y-2">
                {caja.turnos.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold text-center py-4">No hay turnos creados.</p>
                ) : (
                  caja.turnos.map((turno: any) => {
                    const participante = getParticipante(turno.participanteId);
                    const estaOcupado = !!participante;
                    const isMiTurno = miUsuarioId && turno.participanteId === miUsuarioId;
                    const estaOcupadoEnOtroLado = miUsuarioId && isBusy && isBusy(turno.horario) && !isMiTurno;
                    
                    const pideAsistencia = !!turno.solicitaAsistencia;
                    const tipoAlerta = turno.tipoAsistencia || 'asistencia';
                    const tieneAlerta = pideAsistencia && !miUsuarioId;

                    let estadoTurno: 'normal' | 'activo' | 'atrasado' = 'normal';

                    if (diaActual.fecha && turno.horario && horaActual) {
                      const hoyStr = `${horaActual.getFullYear()}-${String(horaActual.getMonth() + 1).padStart(2, '0')}-${String(horaActual.getDate()).padStart(2, '0')}`;
                      
                      if (diaActual.fecha.includes(hoyStr)) {
                        const [inicioStr, finStr] = turno.horario.split('-').map((s: string) => s.trim());
                        const obtenerMinutos = (horaStr: string) => {
                          if (!horaStr) return 0;
                          const [h, m] = horaStr.split(':').map(Number);
                          return (h * 60) + m;
                        };
                        const minActual = horaActual.getHours() * 60 + horaActual.getMinutes();
                        const minInicio = obtenerMinutos(inicioStr);
                        const minFin = obtenerMinutos(finStr || inicioStr);

                        const isActivo = minActual >= minInicio && minActual <= minFin;
                        const isAtrasado = minActual > minFin && !(turno.entregada && turno.devuelta);

                        if (isActivo) estadoTurno = 'activo';
                        else if (isAtrasado) estadoTurno = 'atrasado';
                      }
                    }

                    // CLASES DINÁMICAS Basadas en colores correspondientes
                    let cardClass = `flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl border transition-all `;
                    
                    if (tieneAlerta) {
                      cardClass += tipoAlerta === 'peligro' 
                        ? 'bg-red-50 border-red-400 shadow-sm ring-1 ring-red-200'
                        : 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-200';
                    } else if (estadoTurno === 'activo') {
                      cardClass += 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300 shadow-sm';
                    } else if (estaOcupado) {
                      cardClass += especial ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200';
                    } else {
                      cardClass += 'bg-white border-slate-200';
                    }

                    if (!miUsuarioId && estaOcupado) cardClass += ' cursor-pointer hover:shadow-md hover:border-blue-400';

                    const clockColor = tieneAlerta ? (tipoAlerta === 'peligro' ? 'text-red-500' : 'text-blue-500') : estadoTurno === 'activo' ? 'text-emerald-500' : estadoTurno === 'atrasado' ? 'text-slate-400' : estaOcupado ? (especial ? 'text-amber-500' : 'text-slate-400') : 'text-slate-300';
                    const timeColor = tieneAlerta ? (tipoAlerta === 'peligro' ? 'text-red-900' : 'text-blue-900') : estadoTurno === 'activo' ? 'text-emerald-900' : estadoTurno === 'atrasado' ? 'text-slate-500' : estaOcupado ? (especial ? 'text-amber-900' : 'text-slate-700') : 'text-slate-500';

                    const handleClickCard = () => {
                      if (estaOcupado && !miUsuarioId) {
                        openModal(caja.id, turno.id, turno.horario, caja.nombre, participante, turno);
                      }
                    };

                    return (
                      <div key={turno.id} onClick={handleClickCard} className={cardClass}>
                        <div className="flex items-center gap-1.5 mb-1.5 sm:mb-0 flex-wrap">
                          <Clock size={12} className={clockColor} />
                          <span className={`text-[11px] font-black ${timeColor}`}>
                            {turno.horario}
                          </span>
                          
                          {estadoTurno === 'activo' && <span className="ml-1 text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase animate-pulse">En curso</span>}
                          {/* ETIQUETA FALTANTE EN AMARILLO TENUE */}
                          {estadoTurno === 'atrasado' && <span className="ml-1 text-[8px] bg-amber-50 border border-amber-200 text-amber-600 px-1.5 py-0.5 rounded font-black uppercase">Faltante</span>}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
                          {isMiTurno ? (
                             <button 
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 openModal(caja.id, turno.id, turno.horario, caja.nombre, getParticipante(miUsuarioId), turno); 
                               }} 
                               className={`w-full sm:w-auto text-left text-white rounded-lg p-1.5 transition-colors shadow-sm relative group overflow-hidden ${pideAsistencia ? (tipoAlerta === 'peligro' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600') : 'bg-indigo-600 hover:bg-indigo-700'}`}
                             >
                                <div className="flex justify-between items-center gap-2">
                                  <span className="font-black text-[9px] truncate flex items-center gap-1">
                                    {pideAsistencia && tipoAlerta === 'peligro' && <span className="animate-pulse text-[10px]">🚨</span>}
                                    {pideAsistencia && tipoAlerta === 'asistencia' && <span className="animate-pulse text-[10px]">✋</span>}
                                    TÚ ESTÁS AQUÍ
                                  </span>
                                  <span className={`text-[8px] bg-white px-1.5 py-0.5 rounded font-bold hidden group-hover:block absolute right-1 ${pideAsistencia ? (tipoAlerta === 'peligro' ? 'text-red-700' : 'text-blue-700') : 'text-indigo-700'}`}>Ver</span>
                                </div>
                             </button>
                          ) : estaOcupado ? (
                            <>
                              <div className="flex items-center gap-1 truncate opacity-80">
                                <User size={12} className={tieneAlerta ? (tipoAlerta === 'peligro' ? 'text-red-600' : 'text-blue-600') : especial ? 'text-amber-600' : 'text-slate-400'} />
                                <span className={`text-[10px] font-bold truncate max-w-[100px] ${tieneAlerta ? (tipoAlerta === 'peligro' ? 'text-red-800' : 'text-blue-800') : 'text-slate-600'}`} title={participante.nombre}>
                                  {participante.nombre}
                                </span>
                                {tieneAlerta && tipoAlerta === 'peligro' && <span className="animate-bounce shrink-0 ml-0.5 text-xs">🚨</span>}
                                {tieneAlerta && tipoAlerta === 'asistencia' && <span className="animate-bounce shrink-0 ml-0.5 text-xs">✋</span>}
                              </div>
                              <div className="flex gap-0.5">
                                {turno.entregada && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Entregada" />}
                                {turno.devuelta && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Devuelta" />}
                              </div>
                            </>
                          ) : estaOcupadoEnOtroLado ? (
                             <div className="bg-red-50 border border-red-200 rounded-lg p-1.5 opacity-80 cursor-not-allowed overflow-hidden w-full sm:w-auto text-center">
                                <span className="font-bold text-red-700 text-[9px] truncate">Ya tienes turno</span>
                             </div>
                          ) : (
                            <>
                              <span className="text-[10px] font-bold text-slate-400 italic sm:hidden">Libre</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); onAsignar(caja.id, caja.nombre, turno.id, turno.horario); }} 
                                className={`text-[10px] font-black px-2.5 py-1 rounded-md transition flex items-center justify-center gap-1 shadow-sm ${
                                  miUsuarioId ? 'bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto text-white' 
                                  : estadoTurno === 'atrasado' ? 'bg-slate-500 hover:bg-slate-600 text-white' 
                                  : especial ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                                  : 'bg-slate-800 hover:bg-slate-900 text-white'
                                }`}
                              >
                                <UserPlus size={12} /> {miUsuarioId ? 'Asignarme' : estadoTurno === 'atrasado' ? 'Faltó Asignar' : 'Asignar'}
                              </button>
                            </>
                          )}
                          
                          {especial && !estaOcupado && adminPerms.especiales && !miUsuarioId && (
                            <button onClick={(e) => { e.stopPropagation(); onDeleteTurnoEspecial(caja.id, turno.id); }} className="p-1 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded transition ml-1" title="Borrar horario">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ModalInfoTurno
        isOpen={isOpen} onClose={closeModal} turnoData={turnoData} countdown={countdown}
        cajaEntregada={cajaEntregada} setCajaEntregada={setCajaEntregada}
        cajaDevuelta={cajaDevuelta} setCajaDevuelta={setCajaDevuelta}
        isParticipantView={!!miUsuarioId} 
        contactosWhatsApp={contactosWhatsApp} 
        onRemove={() => {
          if (turnoData?.participante) {
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
        onResolveAlert={() => { 
          if (turnoData && onResolveAlert) {
            onResolveAlert(turnoData.cajaId, turnoData.turnoId);
            closeModal();
          }
        }}
      />
    </div>
  );
};

export default VistaTarjetasCajas;
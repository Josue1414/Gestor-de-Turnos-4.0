// src/components/MatrizTurnos.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { Clock, Lock } from 'lucide-react';
import ActionMenu from './ActionMenu';
import type { DiaEvento, Participante } from '../types';
import CajasEspeciales from './CajasEspeciales';
import { useTurnoModal } from '../hooks/useTurnoModal';
import { useTiempoReal } from '../hooks/useTiempoReal';
import TurnoCell from './TurnoCell';
import ModalInfoTurno from './ModalInfoTurno';

interface AdminPermissions {
  cajas: boolean;
  horarios: boolean;
  especiales: boolean;
}

interface MatrizTurnosProps {
  diaActual: DiaEvento;
  capitanes?: any[]; // <-- RECIBIMOS LA LISTA DE CAPITANES
  getParticipante: (id: string | null) => Participante | undefined;
  onAsignar: (cajaId: string, cajaNombre: string, turnoId: string, horario: string) => void;
  onQuitar: (cajaId: string, turnoId: string, participanteId: string) => void;
  onCrearCaja: () => void;
  onDeleteCaja: (cajaId: string) => void;
  onDeleteHorario: (horario: string) => void;
  onEditCaja: (cajaId: string) => void;
  onEditHorario: (horario: string) => void;
  onDeleteTurnoEspecial?: (cajaId: string, turnoId: string) => void;
  onEditTurnoEspecial?: (cajaId: string, turnoId: string) => void;
  onActualizarEstadoTurno?: (cajaId: string, turnoId: string, entregada: boolean, devuelta: boolean) => void;
  adminPerms?: AdminPermissions;
  onResolveAlert?: (cajaId: string, turnoId: string) => void; 
}

interface CajaCheck { isEspecial?: unknown; especial?: unknown; tipo?: unknown; nombre?: unknown; }

const MatrizTurnos: React.FC<MatrizTurnosProps> = ({ 
  diaActual, capitanes, getParticipante, onAsignar, onQuitar,
  onDeleteCaja, onDeleteHorario, onEditCaja, onEditHorario, onDeleteTurnoEspecial, onEditTurnoEspecial,
  onActualizarEstadoTurno, adminPerms, onResolveAlert 
}) => {

  const { 
    isOpen, openModal, closeModal, turnoData, countdown, 
    cajaEntregada, setCajaEntregada, cajaDevuelta, setCajaDevuelta 
  } = useTurnoModal();

  const horaActual = useTiempoReal();

  const checkIsEspecial = (c: unknown): boolean => {
    if (!c || typeof c !== 'object') return false;
    const box = c as CajaCheck;
    if (box.isEspecial === true || box.isEspecial === true || box.especial === true || box.tipo === 'especial') return true;
    if (typeof box.nombre === 'string') {
      const lowerName = box.nombre.toLowerCase();
      return lowerName.includes('especial') || lowerName.includes('vip');
    }
    return false;
  };

  const cajasNormales = diaActual.cajas.filter(c => !checkIsEspecial(c));
  const cajasEspeciales = diaActual.cajas.filter(c => checkIsEspecial(c));

  const getMinutos = (rango: string) => {
    const horaInicio = rango.split('-')[0].trim();
    const [h, m] = horaInicio.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const horariosUnicos = Array.from(new Set(cajasNormales.flatMap(caja => caja.turnos.map(t => t.horario))))
    .sort((a, b) => getMinutos(a) - getMinutos(b));

  const formatHorarioVisual = (rango: string) => {
    const partes = rango.split('-').map(p => p.trim());
    if (partes.length !== 2) return <span className="text-sm font-black text-slate-700">{rango}</span>;

    const formatearHora = (horaStr: string) => {
      const [hStr, mStr] = horaStr.split(':');
      let h = parseInt(hStr, 10);
      const m = mStr || '00';
      const isPM = h >= 12;
      
      if (h > 12) h -= 12;
      if (h === 0) h = 12;

      return {
        texto: `${h}:${m}`,
        colorClass: isPM ? 'text-blue-800' : 'text-cyan-500'
      };
    };

    const inicio = formatearHora(partes[0]);
    const fin = formatearHora(partes[1]);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 w-full">
        <span className={`font-black text-[12px] sm:text-sm w-full sm:w-8 text-center sm:text-right ${inicio.colorClass}`}>
          {inicio.texto}
        </span>
        <span className="text-slate-300 text-[10px] sm:text-sm leading-none">-</span>
        <span className={`font-black text-[12px] sm:text-sm w-full sm:w-10 text-center sm:text-left ${fin.colorClass}`}>
          {fin.texto}
        </span>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full max-w-none bg-slate-50 font-sans px-0 py-2 sm:px-0 sm:py-2">
      
      <CajasEspeciales 
        cajas={cajasEspeciales as never}
        getParticipante={getParticipante}
        rol="admin"
        onEditCaja={onEditCaja}
        onDeleteCaja={onDeleteCaja}
        onAsignar={onAsignar}
        onQuitar={onQuitar} 
        onDeleteTurnoEspecial={onDeleteTurnoEspecial}
        onEditTurnoEspecial={onEditTurnoEspecial}
        fechaDia={diaActual.fecha}
      />

      {cajasNormales.length > 0 ? (
        <div className="w-full max-w-full bg-white rounded-none sm:rounded-3xl shadow-sm border border-slate-200 mt-2">
          <table className="border-separate border-spacing-0 min-w-max w-full">
            <thead className="relative">
              <tr>
                <th className="sticky left-0 top-[60px] z-40 bg-slate-100 border-b border-r border-slate-200 p-1.5 sm:p-3 w-[40px] sm:w-[58px] shadow-[2px_2px_5px_-2px_rgba(0,0,0,0.1)] align-middle">
                  <div className="flex flex-col items-center justify-center gap-1 text-slate-500 font-black text-[9px] sm:text-[10px] uppercase tracking-wider h-full">
                    <div className="flex items-center gap-1"><Clock size={12} /> <span className="hidden sm:inline">HORARIO</span></div>
                    <div className="flex gap-1 sm:gap-2 mt-1">
                      <span className="text-cyan-500 bg-cyan-50 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px]">AM</span>
                      <span className="text-blue-800 bg-blue-100 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px]">PM</span>
                    </div>
                  </div>
                </th>
                
                {cajasNormales.map(caja => {
                  // BUSCAMOS SI LA CAJA TIENE UN CAPITÁN ASIGNADO
                  const capitanDeCaja = capitanes?.find((cap: any) => 
                    (cap.cajasAsignadas || []).includes(caja.id) && 
                    (cap.diasAsignados || []).includes(diaActual.id)
                  );

                  return (
                    <th key={caja.id as string} className="sticky top-[60px] z-30 group border-b border-slate-200 bg-white p-1 sm:p-2 min-w-[56px] sm:min-w-[88px] border-l align-top shadow-[0_2px_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex flex-col items-center justify-center gap-1 min-h-[40px]">
                        <span className="font-black text-slate-700 text-[10px] sm:text-sm uppercase tracking-wide leading-tight text-center break-words line-clamp-2 px-1" title={caja.nombre as string}>
                          {caja.nombre as string}
                        </span>
                        
                        {/* PASTILLA DEL CAPITÁN */}
                        {capitanDeCaja && (
                          <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 text-center truncate max-w-[90%]" title={`Equipo: ${capitanDeCaja.nombre}`}>
                            {capitanDeCaja.nombre}
                          </span>
                        )}
                        
                        {adminPerms?.cajas !== false && (
                          <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mt-1">
                            <ActionMenu onEdit={() => onEditCaja(caja.id as string)} onDelete={() => onDeleteCaja(caja.id as string)} direccion="abajo" />
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {horariosUnicos.map((horario) => (
                <tr key={horario} className="group hover:bg-slate-50/50 transition-colors">
                  
                  <td className="sticky left-0 z-20 bg-white border-b border-r border-slate-200 p-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col items-center justify-center gap-2 min-h-[50px]">
                      <div className="w-full">{formatHorarioVisual(horario)}</div>
                      
                      {adminPerms?.horarios !== false && (
                        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <ActionMenu onEdit={() => onEditHorario(horario)} onDelete={() => onDeleteHorario(horario)} direccion="derecha" />
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {cajasNormales.map(caja => {
                    const turnosEnEsteHorario = caja.turnos.filter(t => t.horario === horario);
                    return (
                      <td key={`${caja.id}-${horario}`} className="border-b border-slate-100 border-l p-1 sm:p-2 align-top min-w-[95px] sm:min-w-[140px]">
                        <div className="space-y-2">
                          {turnosEnEsteHorario.map((turno) => {
                            const participanteNorm = getParticipante(turno.participanteId);
                            return (
                              <div key={turno.id} className="w-full relative group">
                                <TurnoCell
                                  cajaId={caja.id as string}
                                  cajaNombre={caja.nombre as string}
                                  turno={turno}
                                  participante={participanteNorm}
                                  fechaDia={diaActual.fecha}
                                  horaActual={horaActual}
                                  onAsignar={() => onAsignar(caja.id as string, caja.nombre as string, turno.id, turno.horario)}
                                  onOpenInfo={() => openModal(caja.id as string, turno.id, turno.horario, caja.nombre as string, participanteNorm, turno)}
                                />
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
      ) : (
        <div className="text-center p-10 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl mt-4 bg-white">
          Sin cajas asignadas.
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

export default MatrizTurnos;
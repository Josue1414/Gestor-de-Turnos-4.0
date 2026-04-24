/**
 * RESUMEN: MatrizTurnos
 * Renderiza la tabla principal. Incluye la columna de horarios con 
 * formato AM/PM coloreado y botones de acción visibles en móviles.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo } from 'react';
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
  onDeleteCaja: (cajaId: string) => void;
  onDeleteHorario: (horario: string) => void;
  onEditCaja: (cajaId: string) => void;
  onEditHorario: (horario: string) => void;
  onDeleteTurnoEspecial?: (cajaId: string, turnoId: string) => void;
  onEditTurnoEspecial?: (cajaId: string, turnoId: string) => void;
}

interface CajaCheck { isEspecial?: unknown; especial?: unknown; tipo?: unknown; nombre?: unknown; }

const MatrizTurnos: React.FC<MatrizTurnosProps> = ({ 
  diaActual, getParticipante, onAsignar, onQuitar,
  onDeleteCaja, onDeleteHorario, onEditCaja, onEditHorario, onDeleteTurnoEspecial, onEditTurnoEspecial
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

// 1. EXTRAER Y ORDENAR HORARIOS CRONOLÓGICAMENTE (Recuperamos el nombre horariosUnicos)
  const getMinutos = (rango: string) => {
    const horaInicio = rango.split('-')[0].trim();
    const [h, m] = horaInicio.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // NUEVA LÓGICA: Extraer y ordenar estrictamente los horarios que pertenecen a ESTAS cajas NORMALES
  const horariosUnicos = useMemo(() => {
      const horariosSet = new Set<string>();
      
      // Solo iteramos sobre las cajasNormales
      cajasNormales.forEach(caja => {
          const turnos = Array.isArray(caja.turnos) 
              ? caja.turnos 
              : (caja.turnos ? Object.values(caja.turnos) : []);
              
          turnos.forEach((turno: any) => {
              if (turno.horario) horariosSet.add(turno.horario);
          });
      });
  
      // Ordenamiento nativo basado en la función de minutos existente
      return Array.from(horariosSet).sort((a, b) => getMinutos(a) - getMinutos(b));
  }, [cajasNormales]);

  // 2. FORMATEADOR VISUAL DE HORA PERFECCIONADO (Alineación rígida y responsiva)
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
      // En celular: Se apilan (flex-col) con el guion en medio. En PC: Quedan en fila (flex-row).
      <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 w-full">
        {/* El w-10 y text-right forza a que el inicio siempre ocupe el mismo espacio visual */}
        <span className={`font-black text-[12px] sm:text-sm w-full sm:w-10 text-center sm:text-right ${inicio.colorClass}`}>
          {inicio.texto}
        </span>
        
        <span className="text-slate-300 text-[10px] sm:text-sm leading-none">-</span>
        
        {/* El w-10 y text-left forza a que el fin siempre ocupe el mismo espacio visual */}
        <span className={`font-black text-[12px] sm:text-sm w-full sm:w-10 text-center sm:text-left ${fin.colorClass}`}>
          {fin.texto}
        </span>
      </div>
    );
  };

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
        onDeleteTurnoEspecial={onDeleteTurnoEspecial}
        onEditTurnoEspecial={onEditTurnoEspecial}
      />

      {/* SECCIÓN 2: TABLA NORMAL */}
      {cajasNormales.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full pb-4">
            <table className="w-full table-fixed border-separate border-spacing-0 min-w-max">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-slate-100 border-b border-slate-200 p-2 sm:p-3 w-[65px] sm:w-[90px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-middle">
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-500 font-black text-[10px] uppercase tracking-wider h-full">
                      <div className="flex items-center gap-1"><Clock size={12} /> <span className="hidden sm:inline">HORARIO</span></div>
                      {/* LEYENDA DE COLORES AM / PM */}
                      <div className="flex gap-1 sm:gap-2 mt-1">
                        <span className="text-cyan-500 bg-cyan-50 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px]">AM</span>
                        <span className="text-blue-800 bg-blue-100 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px]">PM</span>
                      </div>
                    </div>
                  </th>
                  {cajasNormales.map(caja => (
                    <th key={caja.id as string} className="group border-b border-slate-200 bg-white p-1.5 sm:p-3 w-[110px] sm:w-[200px] border-l align-top">
                      <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 min-h-[40px]">
                        <span 
                          className="font-black text-slate-700 text-[10px] sm:text-sm uppercase tracking-wide leading-tight text-center break-words line-clamp-2 px-1" 
                          title={caja.nombre as string}
                        >
                          {caja.nombre as string}
                        </span>
                        
                        {/* Botones abajo, visibles en móvil, hover en PC */}
                        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mt-1">
                          <ActionMenu onEdit={() => onEditCaja(caja.id as string)} onDelete={() => onDeleteCaja(caja.id as string)} direccion="abajo" />
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Asegúrate de mapear usando horariosUnicos */}
                {horariosUnicos.map((horario) => (
                  <tr key={horario} className="group hover:bg-slate-50/50 transition-colors">
                    
                    {/* Celda del Horario y Botones (Alineada y Visible en móvil) */}
                    <td className="sticky left-0 z-20 bg-white border-b border-r border-slate-200 p-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex flex-col items-center justify-center gap-2 min-h-[50px]">
                        {/* La Hora */}
                        <div className="w-full">{formatHorarioVisual(horario)}</div>
                        
                        {/* Botones: Visibles siempre en móvil, hover en PC */}
                        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <ActionMenu 
                            onEdit={() => onEditHorario(horario)} 
                            onDelete={() => onDeleteHorario(horario)} 
                            direccion="derecha" 
                          />
                        </div>
                      </div>
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
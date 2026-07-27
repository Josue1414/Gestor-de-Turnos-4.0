// src/components/VistaTarjetasCajas.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Clock, Edit2, Trash2, User, UserPlus, Box, Star, Users, CheckCircle2, Lock } from 'lucide-react';

interface VistaTarjetasCajasProps {
  diaActual: any;
  getParticipante: (id: string | null) => any;
  onAsignar: (cajaId: string, cajaNombre: string, turnoId: string, horario: string) => void;
  onQuitar: (cajaId: string, turnoId: string) => void;
  onCrearCaja: () => void;
  onDeleteCaja: (id: string) => void;
  onDeleteHorario: (horario: string) => void;
  onEditCaja: (id: string) => void;
  onEditHorario: (horario: string) => void;
  onDeleteTurnoEspecial: (cajaId: string, turnoId: string) => void;
  onEditTurnoEspecial: (cajaId: string, turnoId: string) => void;
  adminPerms: { cajas: boolean; horarios: boolean; especiales: boolean };
  miUsuarioId?: string; // NUEVO: Para saber si estamos en vista de participante
  isBusy?: (horario: string) => boolean; // NUEVO: Para saber si el participante tiene choque
}

const VistaTarjetasCajas: React.FC<VistaTarjetasCajasProps> = ({
  diaActual, getParticipante, onAsignar, onQuitar, 
  onDeleteCaja, onEditCaja, onDeleteTurnoEspecial, adminPerms, miUsuarioId, isBusy
}) => {

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
    <div className="w-full max-w-[1400px] mx-auto pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        
        {diaActual.cajas.map((caja: any) => {
          const especial = isCajaEspecial(caja);
          const totalTurnos = caja.turnos.length;
          const turnosOcupados = caja.turnos.filter((t: any) => t.participanteId).length;
          const turnosLibres = totalTurnos - turnosOcupados;
          
          return (
            <div key={caja.id} className={`flex flex-col rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 ${especial ? 'border-amber-300 bg-gradient-to-b from-amber-50 to-white' : 'border-slate-200 bg-white'}`}>
              
              <div className={`p-3 flex items-center justify-between border-b ${especial ? 'bg-amber-100/50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${especial ? 'bg-amber-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    {especial ? <Star size={14} /> : <Box size={14} />}
                  </div>
                  <h3 className={`font-black text-sm uppercase tracking-tight ${especial ? 'text-amber-900' : 'text-slate-800'}`}>
                    {caja.nombre}
                  </h3>
                </div>

                {adminPerms.cajas && (
                  <div className="flex items-center gap-1">
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
                    
                    // VARIABLES PARA PARTICIPANTE
                    const isMiTurno = miUsuarioId && turno.participanteId === miUsuarioId;
                    const estaOcupadoEnOtroLado = miUsuarioId && isBusy && isBusy(turno.horario) && !isMiTurno;

                    return (
                      <div key={turno.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl border transition-colors ${estaOcupado ? (especial ? 'bg-amber-50/50 border-amber-200' : 'bg-blue-50/50 border-blue-100') : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                        
                        <div className="flex items-center gap-1.5 mb-1.5 sm:mb-0">
                          <Clock size={12} className={estaOcupado ? (especial ? 'text-amber-500' : 'text-blue-500') : 'text-slate-400'} />
                          <span className={`text-[11px] font-black ${estaOcupado ? (especial ? 'text-amber-900' : 'text-blue-900') : 'text-slate-600'}`}>
                            {turno.horario}
                          </span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
                          
                          {/* LÓGICA DE RENDEREADO ADAPTADA AL PARTICIPANTE O ADMIN */}
                          {isMiTurno ? (
                             <button onClick={() => onQuitar(caja.id, turno.id)} className="w-full sm:w-auto text-left bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-1.5 transition-colors shadow-sm relative group overflow-hidden">
                                <div className="flex justify-between items-center gap-2">
                                  <span className="font-black text-[9px] truncate">TÚ ESTÁS AQUÍ</span>
                                  <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold hidden group-hover:block absolute right-1">Quitar</span>
                                </div>
                             </button>
                          ) : estaOcupado ? (
                            <>
                              <div className="flex items-center gap-1 truncate opacity-60">
                                <User size={12} className={especial ? 'text-amber-600' : 'text-blue-600'} />
                                <span className="text-[10px] font-bold text-slate-700 truncate max-w-[100px]" title={participante.nombre}>
                                  {participante.nombre}
                                </span>
                              </div>
                              {/* El botón de quitar solo lo ve el admin, NO el participante logueado */}
                              {!miUsuarioId && (
                                <button onClick={() => onQuitar(caja.id, turno.id)} className="text-[9px] uppercase font-black tracking-wider text-red-500 hover:text-white hover:bg-red-500 px-1.5 py-0.5 rounded transition border border-red-200 hover:border-red-500 ml-1">
                                  Quitar
                                </button>
                              )}
                            </>
                          ) : estaOcupadoEnOtroLado ? (
                             <div className="bg-red-50 border border-red-200 rounded-lg p-1.5 opacity-80 cursor-not-allowed overflow-hidden w-full sm:w-auto">
                                <div className="flex items-center gap-1 font-bold text-red-700 text-[9px]">
                                  <Lock size={10} className="w-3 h-3" /> <span className="truncate">Ya tienes turno</span>
                                </div>
                             </div>
                          ) : (
                            <>
                              <span className="text-[10px] font-bold text-slate-400 italic sm:hidden">Libre</span>
                              <button 
                                onClick={() => onAsignar(caja.id, caja.nombre, turno.id, turno.horario)} 
                                className={`text-[10px] font-black px-2.5 py-1 rounded-md transition flex items-center justify-center gap-1 shadow-sm ${miUsuarioId ? 'bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto text-white' : especial ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}
                              >
                                <UserPlus size={12} /> {miUsuarioId ? 'Asignarme' : 'Asignar'}
                              </button>
                            </>
                          )}
                          
                          {especial && !estaOcupado && adminPerms.especiales && !miUsuarioId && (
                            <button onClick={() => onDeleteTurnoEspecial(caja.id, turno.id)} className="p-1 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded transition ml-1" title="Borrar horario">
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
    </div>
  );
};

export default VistaTarjetasCajas;
// src/components/SeccionCapitanes.tsx
import React, { useState } from 'react';
import { Shield, Key, User, Trash2, Play, Box, CheckCircle, Users, Clock, Edit3, Eye, EyeOff, Calendar } from 'lucide-react';
import { useToast } from './ToastProvider';
import CountdownDeleteModal from './CountdownDeleteModal';
import ModalEditarCapitan from './ModalEditarCapitan';
import type { DiaDisponible, CajaDisponible } from './ModalAsignarCapitan';

export interface CapitanData {
  id: string; 
  nombre: string;
  usuario: string; 
  password?: string;
  cajasAsignadas: string[];
  diasAsignados?: string[];
  linkUnico: string;
}

interface SeccionCapitanesProps {
  capitanes: CapitanData[];
  participantes?: any[]; 
  onOpenModal: () => void;
  onDeleteCapitan: (id: string) => void;
  onSimularCapitan: (id: string) => void;
  onEditCapitan: (id: string, nombre: string, diasAsignados: string[], cajasAsignadas: string[]) => void;
  isOpen: boolean;
  dias: any[];
  diasDisponibles: DiaDisponible[];
  cajasDisponibles: CajaDisponible[];
}

const SeccionCapitanes: React.FC<SeccionCapitanesProps> = ({ 
  capitanes, participantes = [], onOpenModal, onDeleteCapitan, onSimularCapitan, onEditCapitan, isOpen, dias, diasDisponibles, cajasDisponibles
}) => {
  const { showToast } = useToast();
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', nombre: '' });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; capitan: CapitanData | null }>({ isOpen: false, capitan: null });
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const handleCopyAccess = (usuario: string, pass: string) => {
    navigator.clipboard.writeText(`Usuario: ${usuario}\nContraseña: ${pass}`);
    showToast('Credenciales copiadas.', 'success');
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getCapitanStats = (capitan: CapitanData) => {
    const nombresCajas: string[] = [];
    let totalTurnos = 0;
    let turnosDisponibles = 0;
    
    const participantesDelCapitan = new Set<string>();

    participantes.forEach(p => {
      if (p.capitanId === capitan.id || p.creador === capitan.nombre) {
        participantesDelCapitan.add(p.id);
      }
    });

    dias.forEach(dia => {
      if (!(capitan.diasAsignados || []).includes(dia.id)) return; 

      dia.cajas.forEach((caja: any) => {
        if (capitan.cajasAsignadas.includes(caja.id)) {
          if (!nombresCajas.includes(caja.nombre)) {
            nombresCajas.push(caja.nombre);
          }
          totalTurnos += caja.turnos.length;
          
          caja.turnos.forEach((turno: any) => {
            if (!turno.participanteId) {
              turnosDisponibles++;
            } else {
              const part = participantes.find(p => p.id === turno.participanteId);
              if (part && (!part.capitanId || part.capitanId === capitan.id)) {
                participantesDelCapitan.add(part.id);
              }
            }
          });
        }
      });
    });

    return { 
      nombresCajas, 
      totalTurnos, 
      turnosDisponibles, 
      cantidadParticipantes: participantesDelCapitan.size 
    };
  };

  const handleConfirmDelete = () => {
    if (deleteModal.id) {
      onDeleteCapitan(deleteModal.id);
    }
  };

  if (!isOpen) return null;

  // CORRECCIÓN: Filtramos las cajas que ya están ocupadas por OTRO capitán en EL MISMO DÍA
  const cajasParaEdicion = cajasDisponibles.filter(caja => {
    const perteneceAOtro = capitanes.some(c => {
       if (c.id === editModal.capitan?.id) return false;
       const tieneCaja = (c.cajasAsignadas || []).includes(caja.id);
       const tieneDia = (c.diasAsignados || []).includes(caja.diaId);
       return tieneCaja && tieneDia;
    });
    return !perteneceAOtro;
  });

  return (
    <>
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <Shield className="text-amber-500" size={18} />
            Equipo de Capitanes
          </h3>
          <button 
            onClick={onOpenModal}
            className="bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800 text-xs font-black px-4 py-2 rounded-xl transition shadow-sm border border-amber-200"
          >
            + Añadir Capitán
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {capitanes.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
               <Shield size={32} className="mb-2 opacity-20" />
               <p className="font-bold text-sm">Aún no has creado ningún capitán.</p>
            </div>
          ) : (
            capitanes.map(capitan => {
              const { nombresCajas, totalTurnos, turnosDisponibles, cantidadParticipantes } = getCapitanStats(capitan);
              const nombresDias = (capitan.diasAsignados || []).map(id => diasDisponibles.find(d => d.id === id)?.nombreDia).filter(Boolean);

              return (
                <div key={capitan.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative flex flex-col h-full pt-10">
                  
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      onClick={() => setEditModal({ isOpen: true, capitan })}
                      className="p-1.5 text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                      title="Editar capitán"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => setDeleteModal({ isOpen: true, id: capitan.id, nombre: capitan.nombre })}
                      className="p-1.5 text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                      title="Eliminar capitán"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h4 className="font-black text-slate-800 flex items-center gap-1.5 mb-3 pr-8">
                    <User size={16} className="text-amber-500" /> {capitan.nombre}
                  </h4>
                  
                  <div className="flex-1 space-y-4 mb-4">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide leading-none">Usr: <span className="text-slate-700 lowercase">{capitan.usuario}</span></span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide leading-none">Psw: </span>
                          <span className="text-[10px] text-slate-700 font-mono tracking-widest bg-slate-200 px-1.5 py-0.5 rounded leading-none">
                            {showPassword[capitan.id] ? capitan.password : '••••••••'}
                          </span>
                          <button 
                            onClick={() => togglePasswordVisibility(capitan.id)} 
                            className="p-1 text-slate-400 hover:text-blue-500 transition-colors bg-white rounded shadow-sm border border-slate-200"
                            title={showPassword[capitan.id] ? "Ocultar" : "Mostrar"}
                          >
                            {showPassword[capitan.id] ? <EyeOff size={10} /> : <Eye size={10} />}
                          </button>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCopyAccess(capitan.usuario, capitan.password || '')}
                        className="p-2 text-slate-400 hover:text-amber-600 bg-white border border-slate-200 rounded-lg transition shadow-sm"
                        title="Copiar credenciales"
                      >
                        <Key size={16} />
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5 block">Días Asignados</span>
                      <div className="flex flex-wrap gap-1.5">
                        {nombresDias.length > 0 ? (
                          nombresDias.map((nombre, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Calendar size={10} /> {nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">Sin días</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5 block">Cajas Asignadas</span>
                      <div className="flex flex-wrap gap-1.5">
                        {nombresCajas.length > 0 ? (
                          nombresCajas.map((nombre, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Box size={10} /> {nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">Sin cajas</span>
                        )}
                      </div>
                    </div>

                    <div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5 block">Desempeño de Horarios</span>
                       <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex flex-col items-center justify-center shadow-sm">
                             <span className="text-xs font-black text-slate-700 flex items-center gap-1"><Clock size={12}/> {totalTurnos}</span>
                             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Totales</span>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg flex flex-col items-center justify-center shadow-sm">
                             <span className="text-xs font-black text-emerald-700 flex items-center gap-1"><CheckCircle size={12}/> {turnosDisponibles}</span>
                             <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">Libres</span>
                          </div>
                          <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg flex flex-col items-center justify-center shadow-sm">
                             <span className="text-xs font-black text-blue-700 flex items-center gap-1"><Users size={12}/> {cantidadParticipantes}</span>
                             <span className="text-[8px] font-bold text-blue-500 uppercase tracking-wider mt-0.5">Participantes</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-auto">
                     <button 
                       onClick={() => onSimularCapitan(capitan.id)}
                       className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                     >
                       <Play size={12} fill="currentColor" /> Simular Vista
                     </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      <CountdownDeleteModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ isOpen: false, id: '', nombre: '' })} 
        onConfirm={handleConfirmDelete} 
        title={`Capitán: ${deleteModal.nombre}`} 
        message="Esta acción no se puede deshacer. Perderá inmediatamente el acceso a sus cajas." 
      />

      <ModalEditarCapitan
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, capitan: null })}
        capitan={editModal.capitan}
        capitanesExistentes={capitanes}
        diasDisponibles={diasDisponibles}
        cajasDisponibles={cajasParaEdicion} // <-- Pasamos el arreglo filtrado
        onSave={onEditCapitan}
      />
    </>
  );
};

export default SeccionCapitanes;
// src/components/SeccionCapitanes.tsx
import React, { useState } from 'react';
import { Shield, Key, User, Trash2, Play, Box, CheckCircle, Users, Clock } from 'lucide-react';
import { useToast } from './ToastProvider';
import CountdownDeleteModal from './CountdownDeleteModal';

export interface CapitanData {
  id: string; 
  nombre: string;
  usuario: string; 
  password?: string;
  cajasAsignadas: string[]; 
  linkUnico: string;
}

interface SeccionCapitanesProps {
  capitanes: CapitanData[];
  onOpenModal: () => void;
  onDeleteCapitan: (id: string) => void;
  onSimularCapitan: (id: string) => void;
  isOpen: boolean;
  dias: any[];
}

const SeccionCapitanes: React.FC<SeccionCapitanesProps> = ({ 
  capitanes, onOpenModal, onDeleteCapitan, onSimularCapitan, isOpen, dias
}) => {
  const { showToast } = useToast();
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', nombre: '' });

  const handleCopyAccess = (usuario: string, pass: string) => {
    navigator.clipboard.writeText(`Usuario: ${usuario}\nContraseña: ${pass}`);
    showToast('Credenciales copiadas.', 'success');
  };

  // LÓGICA CORREGIDA: Contar participantes únicos
  const getCapitanStats = (cajasAsignadasIds: string[]) => {
    const nombresCajas: string[] = [];
    let totalTurnos = 0;
    let turnosDisponibles = 0;
    const participantesUnicos = new Set<string>(); // Utilizamos un Set para evitar duplicados

    dias.forEach(dia => {
      dia.cajas.forEach((caja: any) => {
        if (cajasAsignadasIds.includes(caja.id)) {
          if (!nombresCajas.includes(caja.nombre)) {
            nombresCajas.push(caja.nombre);
          }
          totalTurnos += caja.turnos.length;
          caja.turnos.forEach((turno: any) => {
            if (turno.participanteId) {
              participantesUnicos.add(turno.participanteId); // Añadimos el ID, el Set ignora repetidos
            } else {
              turnosDisponibles++;
            }
          });
        }
      });
    });

    return { 
      nombresCajas, 
      totalTurnos, 
      turnosDisponibles, 
      turnosOcupados: participantesUnicos.size // Devolvemos el tamaño del Set (participantes únicos)
    };
  };

  const handleConfirmDelete = () => {
    if (deleteModal.id) {
      onDeleteCapitan(deleteModal.id);
    }
  };

  if (!isOpen) return null;

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
              const { nombresCajas, totalTurnos, turnosDisponibles, turnosOcupados } = getCapitanStats(capitan.cajasAsignadas);

              return (
                <div key={capitan.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative group flex flex-col h-full">
                  
                  <button 
                    onClick={() => setDeleteModal({ isOpen: true, id: capitan.id, nombre: capitan.nombre })}
                    className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar capitán"
                  >
                    <Trash2 size={16} />
                  </button>

                  <h4 className="font-black text-slate-800 flex items-center gap-1.5 mb-3 pr-8">
                    <User size={16} className="text-amber-500" /> {capitan.nombre}
                  </h4>
                  
                  <div className="flex-1 space-y-4 mb-4">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide leading-none">Usr: <span className="text-slate-700 lowercase">{capitan.usuario}</span></span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide leading-none">Psw: <span className="text-slate-700">{capitan.password}</span></span>
                      </div>
                      <button 
                        onClick={() => handleCopyAccess(capitan.usuario, capitan.password || '')}
                        className="p-1.5 text-slate-400 hover:text-amber-600 bg-white border border-slate-200 rounded-md transition"
                        title="Copiar credenciales"
                      >
                        <Key size={14} />
                      </button>
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
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">Sin cajas</span>
                        )}
                      </div>
                    </div>

                    <div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5 block">Desempeño de Horarios</span>
                       <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex flex-col items-center justify-center">
                             <span className="text-xs font-black text-slate-700 flex items-center gap-1"><Clock size={12}/> {totalTurnos}</span>
                             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Totales</span>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg flex flex-col items-center justify-center">
                             <span className="text-xs font-black text-emerald-700 flex items-center gap-1"><CheckCircle size={12}/> {turnosDisponibles}</span>
                             <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">Libres</span>
                          </div>
                          <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg flex flex-col items-center justify-center">
                             <span className="text-xs font-black text-blue-700 flex items-center gap-1"><Users size={12}/> {turnosOcupados}</span>
                             <span className="text-[8px] font-bold text-blue-500 uppercase tracking-wider mt-0.5">Participantes</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* ELIMINADO EL BOTÓN NEGRO. Solo queda el de simular vista */}
                  <div className="flex flex-col gap-2 mt-auto">
                     <button 
                       onClick={() => onSimularCapitan(capitan.id)}
                       className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
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
    </>
  );
};

export default SeccionCapitanes;
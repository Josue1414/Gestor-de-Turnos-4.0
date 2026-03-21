import React, { useState } from 'react';
import { X, Users, Plus, Settings } from 'lucide-react';
import type { Participante } from '../types';
import TextInput from './TextInput';

interface ParticipantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  participantes: Participante[];
  onEditParticipante: (id: string) => void;
  currentUserId?: string; // <-- NUEVO: ID de quien navega
  currentUserRole?: 'Administrador' | 'Participante' | 'SuperAdmin'; // <-- NUEVO: Rol de quien navega
}

const ParticipantDrawer: React.FC<ParticipantDrawerProps> = ({ 
  isOpen, onClose, participantes, onEditParticipante, currentUserId, currentUserRole = 'Administrador' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const participantesFiltrados = participantes.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const libresCount = participantes.filter(p => p.estado === 'Libre').length;
  const asignadosCount = participantes.filter(p => p.estado === 'Asignado').length;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />}

      <div className={`fixed inset-y-0 right-0 w-80 sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-5 bg-slate-800 text-white shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold flex items-center gap-2 text-lg">
              <Users size={20} className="text-blue-400" /> Directorio Local
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 p-1.5 rounded-lg transition"><X size={18} /></button>
          </div>
          
          {/* El botón de crear participante solo lo ven los Administradores */}
          {currentUserRole !== 'Participante' && (
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition mb-4 shadow-md">
              <Plus size={18} /> Nuevo Participante
            </button>
          )}

          <TextInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} placeholder="Buscar por nombre..." variant="dark" showSearchIcon={true} />
        </div>

        <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 flex justify-between shrink-0">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Libres: {libresCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Asignados: {asignadosCount}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {participantesFiltrados.length > 0 ? (
            participantesFiltrados.map(p => {
              // LÓGICA: ¿Puede ver el botón de ajustes?
              const canEdit = currentUserRole !== 'Participante' || p.id === currentUserId;

              return (
                <div key={p.id} className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${p.estado === 'Libre' ? 'bg-white border-slate-200' : 'bg-blue-50/50 border-blue-200'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.estado === 'Libre' ? 'bg-green-500' : 'bg-blue-500 shadow-sm shadow-blue-300'}`}></span>
                      {p.nombre} {p.id === currentUserId && <span className="text-xs text-blue-500 font-black">(Tú)</span>}
                    </div>
                    
                    {/* BOTÓN DE AJUSTES CONDICIONADO */}
                    {canEdit && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditParticipante(p.id); }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
                        title="Ver Info de Usuario"
                      >
                        <Settings size={16} />
                      </button>
                    )}
                  </div>
                  
                  {p.estado === 'Asignado' && p.ubicaciones && p.ubicaciones.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {p.ubicaciones.map((ubi, index) => (
                        <p key={index} className="text-xs text-blue-600 font-medium ml-4 flex items-center gap-1">📍 {ubi}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10"><p className="text-slate-400 text-sm italic">No se encontraron resultados</p></div>
          )}
        </div>
      </div>
    </>
  );
};

export default ParticipantDrawer;
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, UserPlus, User, AlertCircle, AlertTriangle } from 'lucide-react';
import type { Participante } from '../types';

interface AssignUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  horario: string;
  cajaNombre: string;
  participantes: Participante[];
  busyUserIds: string[]; // NUEVO: IDs de los que ya están trabajando a esta hora
  onAssign: (participanteId: string) => void;
  onCreateAndAssign: (nombre: string) => void;
}

const AssignUserModal: React.FC<AssignUserModalProps> = ({
  isOpen, onClose, horario, cajaNombre, participantes, busyUserIds, onAssign, onCreateAndAssign
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorConflicto, setErrorConflicto] = useState<string | null>(null);

  // 1. Buscamos en TODOS los participantes (ya no filtramos por "Libre")
  const resultadosBusqueda = participantes.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // 2. Lógica Anti-Duplicados y Anti-Pereza
  const termLimpio = searchTerm.trim().toLowerCase();
  
  // ¿Existe alguien exactamente igual?
  const usuarioYaExisteExacto = useMemo(() => {
    if (!termLimpio) return false;
    return participantes.some(p => p.nombre.trim().toLowerCase() === termLimpio);
  }, [termLimpio, participantes]);

  // ¿Hay nombres que contengan lo que escribió? (Ej: Escribió "Juan", y existe "Juan Pérez")
  const nombresSimilares = useMemo(() => {
    if (!termLimpio || termLimpio.length < 3) return []; // Solo advertir si escribió 3 letras o más
    return participantes.filter(p => 
      p.nombre.toLowerCase().includes(termLimpio) && p.nombre.toLowerCase() !== termLimpio
    );
  }, [termLimpio, participantes]);

  if (!isOpen) return null;

  // Manejador de clic al intentar asignar
  const handleAssignClick = (pId: string, isBusy: boolean, nombre: string) => {
    if (isBusy) {
      setErrorConflicto(`${nombre} ya está cubriendo una caja en el horario de ${horario}.`);
      setTimeout(() => setErrorConflicto(null), 4000); // Ocultar después de 4 seg
    } else {
      onAssign(pId);
      setSearchTerm('');
    }
  };

  const handleCreate = () => {
    const nombreLimpio = searchTerm.trim();
    if (!nombreLimpio || usuarioYaExisteExacto) return;
    
    onCreateAndAssign(nombreLimpio);
    setSearchTerm(''); 
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh]">
        
        {/* CABECERA */}
        <div className="p-5 bg-slate-800 text-white flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-lg font-bold">Asignar Participante</h2>
            <p className="text-blue-300 text-sm">{cajaNombre} • [{horario}]</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 p-1.5 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        {/* BUSCADOR */}
        <div className="p-4 border-b border-slate-200 shrink-0 bg-slate-50 relative">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" autoFocus value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar o escribir nuevo nombre..."
              className="w-full bg-white border-2 border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-700 focus:outline-none focus:border-blue-500 transition shadow-sm"
            />
          </div>
          
          {/* ALERTA DE USUARIO EXACTO */}
          {usuarioYaExisteExacto && (
             <div className="mt-2 text-xs text-orange-600 flex items-center gap-1 bg-orange-50 p-2 rounded-lg border border-orange-200">
               <AlertCircle size={14} /> El usuario "{searchTerm.trim()}" ya existe. Búscalo en la lista abajo.
             </div>
          )}

          {/* ALERTA DE CONFLICTO DE HORARIO FLOTANTE */}
          {errorConflicto && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-red-600 text-white text-xs font-bold p-3 rounded-lg shadow-lg flex items-start gap-2 z-20 animate-in slide-in-from-top-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{errorConflicto}</span>
            </div>
          )}
        </div>

        {/* LISTA DE RESULTADOS */}
        <div className="flex-1 overflow-y-auto p-3 bg-white">
          {resultadosBusqueda.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 mb-2 px-1 uppercase tracking-wider">Directorio ({resultadosBusqueda.length})</p>
              
              {resultadosBusqueda.map(p => {
                // SEMÁFORO VISUAL
                const isBusy = busyUserIds.includes(p.id);
                
                return (
                  <button
                    key={p.id}
                    onClick={() => handleAssignClick(p.id, isBusy, p.nombre)}
                    className={`w-full flex justify-between items-center p-3 rounded-xl border transition text-left group ${
                      isBusy 
                        ? 'bg-red-50/30 border-red-100 cursor-not-allowed opacity-80' 
                        : 'bg-green-50/50 border-green-200 hover:bg-green-100 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full transition ${isBusy ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}`}>
                        <User size={16} />
                      </div>
                      <span className={`font-bold text-sm ${isBusy ? 'text-red-900' : 'text-green-900'}`}>{p.nombre}</span>
                    </div>
                    {isBusy ? (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded border border-red-200 uppercase tracking-wide">Ocupado aquí</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded border border-green-300 uppercase tracking-wide">Disponible</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            searchTerm.trim() === '' && (
              <div className="p-8 text-center text-slate-400 text-sm">Comienza a escribir para buscar o crear un participante.</div>
            )
          )}

          {/* ZONA DE CREACIÓN (Radar Anti-Pereza) */}
          {searchTerm.trim() !== '' && !usuarioYaExisteExacto && (
            <div className="mt-4 border-t border-slate-100 pt-4">
               {nombresSimilares.length > 0 ? (
                 // ADVERTENCIA ANTI-PEREZA
                 <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-xl">
                   <p className="text-xs text-yellow-800 font-bold mb-2 flex items-center gap-1">
                     <AlertCircle size={14}/> Encontramos nombres parecidos:
                   </p>
                   <ul className="text-xs text-yellow-700 mb-3 list-disc pl-5 font-medium">
                     {nombresSimilares.slice(0, 3).map(n => <li key={n.id}>{n.nombre}</li>)}
                     {nombresSimilares.length > 3 && <li>...y {nombresSimilares.length - 3} más</li>}
                   </ul>
                   <p className="text-xs text-yellow-800 mb-3 text-center opacity-80">¿Te dio pereza escribir el nombre completo, o de verdad es una persona nueva?</p>
                   <button
                     onClick={handleCreate}
                     className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg text-sm font-black transition shadow-sm"
                   >
                     SÍ, CREAR A "{searchTerm.trim().toUpperCase()}"
                   </button>
                 </div>
               ) : (
                 // BOTÓN DE CREACIÓN NORMAL
                 <button
                    onClick={handleCreate}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition font-bold shadow-sm border border-blue-200"
                  >
                    <UserPlus size={18} />
                    Crear y asignar a "{searchTerm.trim()}"
                  </button>
               )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AssignUserModal;
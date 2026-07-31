// src/components/ModalEditarCapitan.tsx
import React, { useState, useEffect } from 'react';
import { X, Edit3, Box, Calendar, Save } from 'lucide-react';
import type { CapitanData } from './SeccionCapitanes';
import type { DiaDisponible, CajaDisponible } from './ModalAsignarCapitan';

interface ModalEditarCapitanProps {
  isOpen: boolean;
  onClose: () => void;
  capitan: CapitanData | null;
  capitanesExistentes: CapitanData[];
  diasDisponibles: DiaDisponible[];
  cajasDisponibles: CajaDisponible[];
  onSave: (id: string, nombre: string, diasAsignados: string[], cajasAsignadas: string[]) => void;
}

const ModalEditarCapitan: React.FC<ModalEditarCapitanProps> = ({ 
  isOpen, onClose, capitan, capitanesExistentes, diasDisponibles, cajasDisponibles, onSave 
}) => {
  const [nombre, setNombre] = useState('');
  const [cajasSeleccionadas, setCajasSeleccionadas] = useState<string[]>([]);
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [errorNombre, setErrorNombre] = useState('');

  // 1. CORRECCIÓN: El useEffect que carga los datos iniciales se queda intacto.
  useEffect(() => {
    if (isOpen && capitan) {
      setNombre(capitan.nombre);
      setCajasSeleccionadas(capitan.cajasAsignadas || []);
      setDiasSeleccionados(capitan.diasAsignados || []);
      setErrorNombre('');
    }
  }, [isOpen, capitan]);

  // Se ELIMINÓ el useEffect conflictivo que borraba los datos al abrir la ventana.

  // 2. Filtramos los días para que solo aparezcan los que SÍ tienen cajas disponibles
  const diasConCajas = diasDisponibles.filter(dia => 
    cajasDisponibles.some(caja => caja.diaId === dia.id)
  );

  if (!isOpen || !capitan) return null;

  const toggleCaja = (cajaId: string) => {
    setCajasSeleccionadas(prev => prev.includes(cajaId) ? prev.filter(id => id !== cajaId) : [...prev, cajaId]);
  };

  const toggleDia = (diaId: string) => {
    setDiasSeleccionados(prev => {
      if (prev.includes(diaId)) {
        // 3. Si se desmarca manualmente el día, borramos sus cajas
        setCajasSeleccionadas(cajasPrev => cajasPrev.filter(cajaId => {
          const caja = cajasDisponibles.find(c => c.id === cajaId);
          return caja ? caja.diaId !== diaId : true;
        }));
        return prev.filter(id => id !== diaId);
      } else {
        return [...prev, diaId];
      }
    });
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    
    const normalizeText = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const existe = capitanesExistentes.some(
      c => c.id !== capitan.id && normalizeText(c.nombre) === normalizeText(nombreLimpio)
    );

    if (existe) {
      setErrorNombre('Ya existe otro capitán con este nombre en tu equipo.');
      return;
    }

    if (!nombreLimpio || cajasSeleccionadas.length === 0 || diasSeleccionados.length === 0) return;
    
    onSave(capitan.id, nombreLimpio, diasSeleccionados, cajasSeleccionadas);
    onClose();
  };

  const cajasVisibles = cajasDisponibles.filter(caja => diasSeleccionados.includes(caja.diaId));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-blue-600 p-5 flex justify-between items-center text-white shrink-0">
          <h2 className="font-black flex items-center gap-2 text-lg">
            <Edit3 size={20}/> Editar Capitán
          </h2>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <form id="form-editar-capitan" onSubmit={handleGuardar} className="space-y-5">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1">Nombre del Capitán</label>
              <input 
                type="text" 
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setErrorNombre('');
                }}
                className={`w-full mt-1.5 bg-slate-50 border text-slate-800 text-sm font-bold rounded-xl p-3.5 focus:outline-none transition shadow-sm ${errorNombre ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`}
                required
              />
              {errorNombre && <p className="text-xs text-red-500 font-bold mt-1.5 ml-1">{errorNombre}</p>}
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1 mb-2 block">
                1. Días Asignados
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {/* Mapeamos diasConCajas en lugar de diasDisponibles */}
                {diasConCajas.map(dia => (
                  <label key={dia.id} className={`flex items-center justify-between cursor-pointer p-3 rounded-xl border transition-all ${diasSeleccionados.includes(dia.id) ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                    <span className={`text-sm font-bold flex items-center gap-2 ${diasSeleccionados.includes(dia.id) ? 'text-blue-700' : 'text-slate-700'}`}>
                      <Calendar size={16} /> {dia.nombreDia}
                    </span>
                    <input 
                      type="checkbox" 
                      checked={diasSeleccionados.includes(dia.id)} 
                      onChange={() => toggleDia(dia.id)} 
                      className="w-5 h-5 accent-blue-600 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1 mb-2 block">
                2. Cajas Asignadas
              </label>

              {diasSeleccionados.length === 0 ? (
                <p className="text-xs text-amber-600 font-bold bg-amber-50 p-3 rounded-xl border border-amber-200">
                  Primero selecciona al menos un día arriba.
                </p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {diasSeleccionados.map(diaId => {
                    const dia = diasDisponibles.find(d => d.id === diaId);
                    const cajasDelDia = cajasVisibles.filter(c => c.diaId === diaId);
                    if (!dia) return null;

                    return (
                      <div key={diaId} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block border-b border-slate-200 pb-1">
                          {dia.nombreDia}
                        </span>
                        {cajasDelDia.length === 0 ? (
                          <p className="text-[10px] text-red-400 font-bold italic mt-1">Sin cajas disponibles</p>
                        ) : (
                          <div className="space-y-1.5 mt-2">
                            {cajasDelDia.map(caja => (
                              <label key={caja.id} className={`flex items-center justify-between cursor-pointer p-2.5 rounded-lg border transition-all ${cajasSeleccionadas.includes(caja.id) ? 'bg-blue-100 border-blue-300' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                <span className={`text-sm font-bold flex items-center gap-2 ${cajasSeleccionadas.includes(caja.id) ? 'text-blue-700' : 'text-slate-600'}`}>
                                  <Box size={14} /> {caja.nombre.split('(')[0]}
                                </span>
                                <input 
                                  type="checkbox" 
                                  checked={cajasSeleccionadas.includes(caja.id)} 
                                  onChange={() => toggleCaja(caja.id)} 
                                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                                />
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 pt-0 shrink-0 bg-white">
          <button 
            type="submit" 
            form="form-editar-capitan"
            disabled={!nombre.trim() || cajasSeleccionadas.length === 0 || diasSeleccionados.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black text-sm p-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <Save size={18} /> Guardar Cambios
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalEditarCapitan;
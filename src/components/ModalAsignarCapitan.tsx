// src/components/ModalAsignarCapitan.tsx
import React, { useState, useEffect } from 'react';
import { X, Shield, Box, UserPlus, Calendar } from 'lucide-react';

export interface DiaDisponible {
  id: string;
  nombreDia: string;
}

export interface CajaDisponible {
  id: string;
  nombre: string;
  diaId: string;
}

interface ModalAsignarCapitanProps {
  isOpen: boolean;
  onClose: () => void;
  diasDisponibles: DiaDisponible[];
  cajasDisponibles: CajaDisponible[];
  onSave: (nombre: string, cajasAsignadas: string[], diasAsignados: string[], passwordGenerado: string) => void;
}

const ModalAsignarCapitan: React.FC<ModalAsignarCapitanProps> = ({ isOpen, onClose, diasDisponibles, cajasDisponibles, onSave }) => {
  const [nombre, setNombre] = useState('');
  const [cajasSeleccionadas, setCajasSeleccionadas] = useState<string[]>([]);
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);

  const generarPasswordSegura = () => {
    const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const minusculas = 'abcdefghijkmnpqrstuvwxyz';
    const numeros = '23456789';
    const simbolos = '!@#$%&*';

    let password = '';
    password += mayusculas[Math.floor(Math.random() * mayusculas.length)];
    password += minusculas[Math.floor(Math.random() * minusculas.length)];
    password += numeros[Math.floor(Math.random() * numeros.length)];
    password += simbolos[Math.floor(Math.random() * simbolos.length)];

    const todos = mayusculas + minusculas + numeros + simbolos;
    for (let i = password.length; i < 8; i++) {
      password += todos[Math.floor(Math.random() * todos.length)];
    }

    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };

  useEffect(() => {
    if (isOpen) {
      setNombre('');
      setCajasSeleccionadas([]);
      setDiasSeleccionados([]);
    }
  }, [isOpen]);

  // 1. CORRECCIÓN: Filtramos los días para que solo aparezcan los que SÍ tienen cajas disponibles
  const diasConCajas = diasDisponibles.filter(dia => 
    cajasDisponibles.some(caja => caja.diaId === dia.id)
  );

  if (!isOpen) return null;

  const toggleCaja = (cajaId: string) => {
    setCajasSeleccionadas(prev => prev.includes(cajaId) ? prev.filter(id => id !== cajaId) : [...prev, cajaId]);
  };

  const toggleDia = (diaId: string) => {
    setDiasSeleccionados(prev => {
      if (prev.includes(diaId)) {
        // 2. CORRECCIÓN: Si el usuario desmarca un día manualmente, limpiamos sus cajas asociadas aquí mismo
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
    if (!nombre.trim() || cajasSeleccionadas.length === 0 || diasSeleccionados.length === 0) return;
    
    const passwordSeguro = generarPasswordSegura();
    onSave(nombre.trim(), cajasSeleccionadas, diasSeleccionados, passwordSeguro);
    onClose();
  };

  const cajasVisibles = cajasDisponibles.filter(caja => diasSeleccionados.includes(caja.diaId));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-indigo-600 p-5 flex justify-between items-center text-white shrink-0">
          <h2 className="font-black flex items-center gap-2 text-lg">
            <Shield size={20}/> Nuevo Capitán
          </h2>
          <button onClick={onClose} className="text-indigo-200 hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            Crea un acceso limitado. Asigna los días y cajas que podrá gestionar.
          </p>

          <form id="form-capitan" onSubmit={handleGuardar} className="space-y-5">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1">Nombre del Capitán</label>
              <input 
                type="text" 
                placeholder="Ej. Pedro Gómez" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full mt-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl p-3.5 focus:outline-none focus:border-indigo-500 transition shadow-sm"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1 mb-2 block">
                1. Días a su cargo
              </label>
              {diasConCajas.length === 0 ? (
                <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100">
                  No hay días con cajas disponibles.
                </p>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {diasConCajas.map(dia => (
                    <label key={dia.id} className={`flex items-center justify-between cursor-pointer p-3 rounded-xl border transition-all ${diasSeleccionados.includes(dia.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}>
                      <span className={`text-sm font-bold flex items-center gap-2 ${diasSeleccionados.includes(dia.id) ? 'text-indigo-700' : 'text-slate-700'}`}>
                        <Calendar size={16} /> {dia.nombreDia}
                      </span>
                      <input 
                        type="checkbox" 
                        checked={diasSeleccionados.includes(dia.id)} 
                        onChange={() => toggleDia(dia.id)} 
                        className="w-5 h-5 accent-indigo-600 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1 mb-2 block">
                2. Cajas a su cargo
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
                              <label key={caja.id} className={`flex items-center justify-between cursor-pointer p-2.5 rounded-lg border transition-all ${cajasSeleccionadas.includes(caja.id) ? 'bg-indigo-100 border-indigo-300' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                                <span className={`text-sm font-bold flex items-center gap-2 ${cajasSeleccionadas.includes(caja.id) ? 'text-indigo-700' : 'text-slate-600'}`}>
                                  <Box size={14} /> {caja.nombre.split('(')[0]}
                                </span>
                                <input 
                                  type="checkbox" 
                                  checked={cajasSeleccionadas.includes(caja.id)} 
                                  onChange={() => toggleCaja(caja.id)} 
                                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
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
            form="form-capitan"
            disabled={!nombre.trim() || cajasSeleccionadas.length === 0 || diasSeleccionados.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-sm p-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <UserPlus size={18} /> Crear Capitán
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalAsignarCapitan;
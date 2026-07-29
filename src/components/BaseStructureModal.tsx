import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, Inbox, AlertCircle, LayoutGrid, ArrowRight } from 'lucide-react';

// 1. ACTUALIZAMOS LA INTERFAZ PARA QUE EXPORTE UN OBJETO CON FECHA Y NOMBREDIA
interface BaseStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (estructura: { dias: { fecha: string; nombreDia: string }[], horarios?: string[], cajas?: string[] }) => void;
  isSupervisor?: boolean;  
  existingDays?: string[]; 
}

const BaseStructureModal: React.FC<BaseStructureModalProps> = ({ isOpen, onClose, onSave, isSupervisor = false, existingDays = [] }) => {
  // 2. ACTUALIZAMOS EL ESTADO PARA QUE SEA UN ARREGLO DE OBJETOS
  const [dias, setDias] = useState<{fecha: string, nombreDia: string}[]>([]);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [cajas, setCajas] = useState<string[]>([]);

  const [nuevoDia, setNuevoDia] = useState('');
  const [nuevaCaja, setNuevaCaja] = useState('Caja 1'); 
  
  const [nuevoInicio, setNuevoInicio] = useState('08:00');
  const [nuevoFin, setNuevoFin] = useState('09:00');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (cajas.length === 0) {
      setNuevaCaja('Caja 1');
      return;
    }
    let max = 0;
    cajas.forEach(c => {
      const match = c.match(/caja\s+(\d+)/i);
      if (match) {
        const num = parseInt(match[1]);
        if (num > max) max = num;
      }
    });
    for (let i = 1; i <= max; i++) {
      const testName = `Caja ${i}`;
      if (!cajas.includes(testName)) {
        setNuevaCaja(testName);
        return;
      }
    }
    setNuevaCaja(`Caja ${max + 1}`);
  }, [cajas]);

  if (!isOpen) return null;

  const handleAddDia = () => {
    if (!nuevoDia) return setErrorMsg('Selecciona una fecha.');
    const [year, month, day] = nuevoDia.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const formateado = dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    const diaFormateado = formateado.charAt(0).toUpperCase() + formateado.slice(1);
    
    // 3. VALIDAMOS CONTRA EL NUEVO FORMATO DE OBJETO
    if (dias.some(d => d.nombreDia === diaFormateado) || existingDays.includes(diaFormateado)) {
      return setErrorMsg('El día ya está en la lista o ya existe en el evento.');
    }
    setDias([...dias, { fecha: nuevoDia, nombreDia: diaFormateado }]);
    setNuevoDia('');
  };

  const handleAddHorario = () => {
    if (!nuevoInicio || !nuevoFin) return setErrorMsg('Selecciona las horas de inicio y fin.');
    const val = `${nuevoInicio} - ${nuevoFin}`;
    if (horarios.includes(val)) return setErrorMsg('Este horario ya existe.');
    
    setHorarios([...horarios, val].sort());
    
    setNuevoInicio(nuevoFin);
    const [h, m] = nuevoFin.split(':').map(Number);
    const nextH = (h + 1 < 24 ? h + 1 : 0).toString().padStart(2, '0');
    setNuevoFin(`${nextH}:${m.toString().padStart(2, '0')}`);
  };

  const handleAddCaja = () => {
    if (!nuevaCaja.trim()) return setErrorMsg('Ingresa un nombre para la caja.');
    if (cajas.includes(nuevaCaja.trim())) return setErrorMsg('Esta caja ya existe.');
    setCajas([...cajas, nuevaCaja.trim()]);
  };

  const handleSave = () => {
    if (isSupervisor) {
      if (dias.length === 0) return setErrorMsg('Debes agregar al menos 1 Día para guardar.');
    } else {
      if (dias.length === 0 || horarios.length === 0 || cajas.length === 0) {
        return setErrorMsg('Debes agregar al menos 1 Día, 1 Horario y 1 Caja para crear la estructura.');
      }
    }
    onSave({ dias, horarios, cajas });
    setDias([]); setHorarios([]); setCajas([]);
    setNuevoInicio('08:00'); setNuevoFin('09:00');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 ${isSupervisor ? 'max-w-3xl' : 'max-w-5xl'}`}>

        <div className="bg-slate-900 p-5 flex justify-between items-center border-b border-slate-800 shrink-0">
          <h2 className="text-white font-black flex items-center gap-2 text-lg tracking-wide uppercase">
            <LayoutGrid size={20} className="text-blue-400" />
            {isSupervisor ? 'Añadir Días Globales' : 'Estructura Base del Evento'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 gap-4 sm:gap-6 ${isSupervisor ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>

          {/* COLUMNA: DÍAS NUEVOS */}
          <div className="bg-slate-50 border border-slate-100 p-4 sm:p-5 rounded-2xl flex flex-col shadow-sm">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
              <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Calendar size={18}/></div>
              Días Nuevos ({dias.length})
            </h4>
            <div className="flex gap-2 mb-4">
              <input type="date" value={nuevoDia} onChange={(e) => setNuevoDia(e.target.value)} className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer" />
              <button onClick={handleAddDia} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm hover:-translate-y-0.5"><Plus size={20} /></button>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {dias.map((d, i) => (
                <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-blue-100 text-sm text-blue-800 font-bold shadow-sm">
                  <span>{d.nombreDia}</span>
                  <button onClick={() => setDias(dias.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition"><Trash2 size={16}/></button>
                </div>
              ))}
              {dias.length === 0 && <p className="text-xs text-slate-400 font-medium text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">No hay días agregados</p>}
            </div>
          </div>

          {/* COLUMNA: DÍAS EXISTENTES */}
          {isSupervisor && (
            <div className="bg-slate-50 border border-slate-100 p-4 sm:p-5 rounded-2xl flex flex-col shadow-sm">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4 opacity-70">
                <div className="bg-slate-200 p-1.5 rounded-lg text-slate-600"><Calendar size={18}/></div>
                Ya en el evento ({existingDays.length})
              </h4>
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {existingDays.length === 0 && <p className="text-xs text-slate-400 font-medium text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">No hay días registrados aún.</p>}
                {existingDays.map((d, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 text-sm text-slate-500 font-bold shadow-sm opacity-80">{d}</div>
                ))}
              </div>
            </div>
          )}

          {/* COLUMNAS: CAJAS Y HORARIOS */}
          {!isSupervisor && (
            <>
              {/* COLUMNA CAJAS */}
              <div className="bg-slate-50 border border-slate-100 p-4 sm:p-5 rounded-2xl flex flex-col shadow-sm">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
                  <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><Inbox size={18}/></div>
                  Cajas ({cajas.length})
                </h4>
                <div className="flex gap-2 mb-4">
                  <input type="text" placeholder="Ej. Caja 1" value={nuevaCaja} onChange={(e) => setNuevaCaja(e.target.value)} className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-indigo-500 transition-all" />
                  <button onClick={handleAddCaja} className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm hover:-translate-y-0.5"><Plus size={20} /></button>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {cajas.map((c, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-indigo-100 text-sm text-indigo-800 font-bold shadow-sm">
                      <span>{c}</span>
                      <button onClick={() => setCajas(cajas.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {cajas.length === 0 && <p className="text-xs text-slate-400 font-medium text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">No hay cajas agregadas</p>}
                </div>
              </div>

              {/* COLUMNA HORARIOS */}
              <div className="bg-slate-50 border border-slate-100 p-4 sm:p-5 rounded-2xl flex flex-col shadow-sm">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
                  <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><Clock size={18}/></div>
                  Horarios ({horarios.length})
                </h4>
                
                <div className="flex flex-col gap-2 mb-4 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <input type="time" value={nuevoInicio} onChange={(e) => setNuevoInicio(e.target.value)} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs text-slate-700 outline-none focus:border-emerald-500 cursor-pointer" />
                    <ArrowRight size={14} className="text-slate-400 shrink-0"/>
                    <input type="time" value={nuevoFin} onChange={(e) => setNuevoFin(e.target.value)} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs text-slate-700 outline-none focus:border-emerald-500 cursor-pointer" />
                  </div>
                  <button onClick={handleAddHorario} className="w-full mt-1 bg-emerald-600 text-white p-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-1 shadow-sm">
                    <Plus size={14} /> Agregar
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto content-start pr-1">
                  {horarios.length === 0 && <p className="w-full text-xs text-slate-400 font-medium text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">No hay horarios agregados</p>}
                  {horarios.map((h, i) => {
                    const hourStr = h.split(/[-a]/i)[0]?.trim() || h;
                    let isPM = false;
                    const hourNum = parseInt(hourStr.split(':')[0], 10);
                    if (hourStr.toUpperCase().includes('PM')) isPM = true;
                    else if (hourStr.toUpperCase().includes('AM')) isPM = false;
                    else if (hourNum >= 12 && hourNum < 24) isPM = true;

                    return (
                      <div key={i} className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all ${isPM ? 'bg-blue-900 text-white border border-blue-800' : 'bg-blue-500 text-white border border-blue-400'}`}>
                        <span>{h}</span>
                        <button onClick={() => setHorarios(horarios.filter((_, idx) => idx !== i))} className="opacity-60 hover:opacity-100 hover:text-red-300 transition-colors p-0.5"><X size={14}/></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-sm text-sm">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-8 py-2.5 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md transition hover:-translate-y-0.5 text-sm">
            Guardar Estructura
          </button>
        </div>

        {errorMsg && (
          <div className="absolute inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center border-t-4 border-red-500 animate-in zoom-in-95 duration-200">
              <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-black text-slate-800 mb-2">Aviso de Validación</h3>
              <p className="text-sm font-medium text-slate-600 mb-6">{errorMsg}</p>
              <button onClick={() => setErrorMsg(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3 rounded-2xl transition shadow-md hover:-translate-y-0.5">
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseStructureModal;
import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Clock, Inbox, CheckCircle2, AlertCircle } from 'lucide-react';

interface BaseStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (estructura: { dias: string[], horarios: string[], cajas: string[] }) => void;
}

const BaseStructureModal: React.FC<BaseStructureModalProps> = ({ isOpen, onClose, onSave }) => {
  const [dias, setDias] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [cajas, setCajas] = useState<string[]>([]);

  const [nuevoDia, setNuevoDia] = useState('');
  const [nuevaCaja, setNuevaCaja] = useState('');
  
  // Estados para las horas libres (como texto)
  const [inicio, setInicio] = useState({ h: '', m: '', p: 'AM' });
  const [fin, setFin] = useState({ h: '', m: '', p: 'AM' });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddDia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoDia) return setErrorMsg('Por favor, selecciona una fecha en el calendario.');

    const [year, month, day] = nuevoDia.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const formateado = dateObj.toLocaleDateString('es-MX', opciones);
    const diaFinal = formateado.charAt(0).toUpperCase() + formateado.slice(1);

    if (dias.includes(diaFinal)) return setErrorMsg('Este día ya fue agregado a la lista.');
    
    setDias([...dias, diaFinal]);
    setNuevoDia('');
  };

  const handleAddHorario = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validamos que hayan escrito algo
    if (!inicio.h || !inicio.m || !fin.h || !fin.m) {
      return setErrorMsg('Por favor, completa horas y minutos de inicio y fin.');
    }

    const hIni = parseInt(inicio.h);
    const mIni = parseInt(inicio.m);
    const hFin = parseInt(fin.h);
    const mFin = parseInt(fin.m);

    // Validamos que los números sean lógicos para un reloj de 12 horas
    if (hIni < 1 || hIni > 12 || hFin < 1 || hFin > 12) return setErrorMsg('Las horas deben estar entre 01 y 12.');
    if (mIni < 0 || mIni > 59 || mFin < 0 || mFin > 59) return setErrorMsg('Los minutos deben estar entre 00 y 59.');

    // Convertimos a minutos totales para validar cuál es mayor
    const valInicio = (hIni % 12 + (inicio.p === 'PM' ? 12 : 0)) * 60 + mIni;
    const valFin = (hFin % 12 + (fin.p === 'PM' ? 12 : 0)) * 60 + mFin;

    if (valInicio >= valFin) {
      return setErrorMsg('La hora de inicio debe ser más temprana que la hora de fin.');
    }
    
    // Formateamos para que siempre tengan 2 dígitos (ej. "8" -> "08")
    const formatH = (val: number) => val.toString().padStart(2, '0');
    const nuevoRango = `${formatH(hIni)}:${formatH(mIni)} ${inicio.p} - ${formatH(hFin)}:${formatH(mFin)} ${fin.p}`;
    
    if (horarios.includes(nuevoRango)) return setErrorMsg('Este rango de horario ya existe en la lista.');

    setHorarios([...horarios, nuevoRango]);
    // Limpiamos los campos
    setInicio({ h: '', m: '', p: 'AM' });
    setFin({ h: '', m: '', p: 'AM' });
  };

  const handleAddCaja = (e: React.FormEvent) => {
    e.preventDefault();
    const cajaLimpia = nuevaCaja.trim();
    if (!cajaLimpia) return setErrorMsg('Por favor, escribe un nombre para la caja.');
    
    if (cajas.some(c => c.toLowerCase() === cajaLimpia.toLowerCase())) {
      return setErrorMsg('Ya existe una caja con este nombre.');
    }
    
    setCajas([...cajas, cajaLimpia]);
    setNuevaCaja('');
  };

  const removeDia = (index: number) => setDias(dias.filter((_, i) => i !== index));
  const removeHorario = (index: number) => setHorarios(horarios.filter((_, i) => i !== index));
  const removeCaja = (index: number) => setCajas(cajas.filter((_, i) => i !== index));

  const handleSave = () => {
    if (dias.length === 0 && horarios.length === 0 && cajas.length === 0) {
      return setErrorMsg('La estructura está completamente vacía. Agrega al menos un elemento.');
    }
    onSave({ dias, horarios, cajas });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden border-2 border-blue-100">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg uppercase tracking-tight">
              <Calendar className="text-blue-500" /> Estructura Base del Evento
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Define los días, horarios y cajas predeterminadas (Empezando desde cero).</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
            <X size={20} />
          </button>
        </div>

        {/* CUERPO - 3 COLUMNAS */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            
            {/* COLUMNA: HORARIOS (INPUTS TEXTO + SELECT AM/PM) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-[50vh] min-h-[400px]">
              <h4 className="font-black text-slate-700 flex items-center gap-2 mb-4 uppercase text-sm border-b border-slate-100 pb-2 shrink-0">
                <Clock size={16} className="text-indigo-500"/> Horarios Maestros
              </h4>
              <form onSubmit={handleAddHorario} className="flex flex-col gap-3 mb-4 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100">
                
                {/* INICIO */}
                <div>
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1 block">Hora de Inicio</label>
                  <div className="flex gap-1 items-center">
                    <input type="text" maxLength={2} placeholder="08" value={inicio.h} onChange={e => setInicio({...inicio, h: e.target.value.replace(/\D/g, '')})} className="w-12 text-center p-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-indigo-400 outline-none text-slate-700 shadow-sm" />
                    <span className="font-black text-slate-400">:</span>
                    <input type="text" maxLength={2} placeholder="00" value={inicio.m} onChange={e => setInicio({...inicio, m: e.target.value.replace(/\D/g, '')})} className="w-12 text-center p-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-indigo-400 outline-none text-slate-700 shadow-sm" />
                    <select value={inicio.p} onChange={e => setInicio({...inicio, p: e.target.value})} className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-black focus:border-indigo-400 outline-none ml-1 shadow-sm cursor-pointer">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                {/* FIN */}
                <div>
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1 block">Hora de Fin</label>
                  <div className="flex gap-1 items-center">
                    <input type="text" maxLength={2} placeholder="10" value={fin.h} onChange={e => setFin({...fin, h: e.target.value.replace(/\D/g, '')})} className="w-12 text-center p-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-indigo-400 outline-none text-slate-700 shadow-sm" />
                    <span className="font-black text-slate-400">:</span>
                    <input type="text" maxLength={2} placeholder="30" value={fin.m} onChange={e => setFin({...fin, m: e.target.value.replace(/\D/g, '')})} className="w-12 text-center p-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-indigo-400 outline-none text-slate-700 shadow-sm" />
                    <select value={fin.p} onChange={e => setFin({...fin, p: e.target.value})} className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-black focus:border-indigo-400 outline-none ml-1 shadow-sm cursor-pointer">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full mt-2 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shadow-md transition font-black text-xs flex items-center justify-center gap-1">
                  <Plus size={14} /> Añadir Horario
                </button>
              </form>
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {horarios.map((h, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-white border border-slate-200 shadow-sm rounded-lg group hover:border-indigo-300 transition">
                    <span className="text-sm font-black text-slate-700 flex items-center gap-2"><Clock size={14} className="text-indigo-400"/> {h}</span>
                    <button onClick={() => removeHorario(i)} className="text-slate-300 hover:text-red-500 transition p-1.5 rounded-md hover:bg-red-50" title="Eliminar"><Trash2 size={16} /></button>
                  </div>
                ))}
                {horarios.length === 0 && <p className="text-xs text-slate-400 text-center italic mt-4">No hay horarios creados.</p>}
              </div>
            </div>

            {/* COLUMNA: DÍAS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-[50vh] min-h-[400px]">
              <h4 className="font-black text-slate-700 flex items-center gap-2 mb-4 uppercase text-sm border-b border-slate-100 pb-2 shrink-0">
                <Calendar size={16} className="text-blue-500"/> Días del Evento
              </h4>
              <form onSubmit={handleAddDia} className="flex flex-col gap-2 mb-4 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-wider block">Seleccionar Fecha</label>
                <input type="date" value={nuevoDia} onChange={(e) => setNuevoDia(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 shadow-sm cursor-pointer rounded-lg text-sm font-bold focus:border-blue-400 outline-none text-slate-700" />
                <button type="submit" className="w-full mt-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition font-black text-xs flex items-center justify-center gap-1">
                  <Plus size={14} /> Añadir Día
                </button>
              </form>
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {dias.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-white border border-slate-200 shadow-sm rounded-lg group hover:border-blue-300 transition">
                    <span className="text-sm font-black text-slate-700 flex items-center gap-2"><Calendar size={14} className="text-blue-400"/> {d}</span>
                    <button onClick={() => removeDia(i)} className="text-slate-300 hover:text-red-500 transition p-1.5 rounded-md hover:bg-red-50" title="Eliminar"><Trash2 size={16} /></button>
                  </div>
                ))}
                {dias.length === 0 && <p className="text-xs text-slate-400 text-center italic mt-4">No hay días creados.</p>}
              </div>
            </div>

            {/* COLUMNA: CAJAS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-[50vh] min-h-[400px]">
              <h4 className="font-black text-slate-700 flex items-center gap-2 mb-4 uppercase text-sm border-b border-slate-100 pb-2 shrink-0">
                <Inbox size={16} className="text-emerald-500"/> Cajas / Áreas
              </h4>
              <form onSubmit={handleAddCaja} className="flex flex-col gap-2 mb-4 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Nombre de la ubicación</label>
                <input type="text" value={nuevaCaja} onChange={(e) => setNuevaCaja(e.target.value)} placeholder="Ej. Caja Principal" className="w-full p-2.5 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-bold focus:border-emerald-400 outline-none text-slate-700" />
                <button type="submit" className="w-full mt-2 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-md transition font-black text-xs flex items-center justify-center gap-1">
                  <Plus size={14} /> Añadir Caja
                </button>
              </form>
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {cajas.map((c, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-white border border-slate-200 shadow-sm rounded-lg group hover:border-emerald-300 transition">
                    <span className="text-sm font-black text-slate-700 flex items-center gap-2"><Inbox size={14} className="text-emerald-400"/> {c}</span>
                    <button onClick={() => removeCaja(i)} className="text-slate-300 hover:text-red-500 transition p-1.5 rounded-md hover:bg-red-50" title="Eliminar"><Trash2 size={16} /></button>
                  </div>
                ))}
                {cajas.length === 0 && <p className="text-xs text-slate-400 text-center italic mt-4">No hay cajas creadas.</p>}
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex justify-between items-center">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <CheckCircle2 size={14} className="text-emerald-500"/> Los elementos se aplicarán al evento
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition text-sm">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md transition flex items-center gap-2 text-sm">
              Guardar Estructura
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE ALERTAS / VALIDACIONES INTERNO */}
      {errorMsg && (
        <div className="absolute inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-3xl">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center border-t-4 border-red-500 animate-in zoom-in-95 duration-200">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-black text-slate-800 mb-2">Aviso de Validación</h3>
            <p className="text-sm font-medium text-slate-600 mb-6">{errorMsg}</p>
            <button onClick={() => setErrorMsg(null)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl transition">
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseStructureModal;
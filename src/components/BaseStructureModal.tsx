import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Clock, Inbox, AlertCircle, LayoutGrid } from 'lucide-react';

interface BaseStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  // TypeScript satisfecho:
  onSave: (estructura: { dias: string[], horarios?: string[], cajas?: string[] }) => void;
  isSupervisor?: boolean;  
  existingDays?: string[]; 
}

const BaseStructureModal: React.FC<BaseStructureModalProps> = ({ isOpen, onClose, onSave, isSupervisor = false, existingDays = [] }) => {
  const [dias, setDias] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [cajas, setCajas] = useState<string[]>([]);

  const [nuevoDia, setNuevoDia] = useState('');
  const [nuevaCaja, setNuevaCaja] = useState('');
  const [inicio, setInicio] = useState({ h: '', m: '', p: 'AM' });
  const [fin, setFin] = useState({ h: '', m: '', p: 'AM' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddDia = () => {
    if (!nuevoDia) return setErrorMsg('Selecciona una fecha.');
    const [year, month, day] = nuevoDia.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const formateado = dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    const diaFormateado = formateado.charAt(0).toUpperCase() + formateado.slice(1);
    
    if (dias.includes(diaFormateado) || existingDays.includes(diaFormateado)) {
      return setErrorMsg('El día ya está en la lista o ya existe en el evento.');
    }
    setDias([...dias, diaFormateado]);
    setNuevoDia('');
  };

  const handleAddHorario = () => {
    if (!inicio.h || !inicio.m || !fin.h || !fin.m) return setErrorMsg('Completa inicio y fin.');
    const formatTime = (t: {h: string, m: string, p: string}) => `${t.h.padStart(2, '0')}:${t.m.padStart(2, '0')} ${t.p}`;
    const nuevoHorario = `${formatTime(inicio)} - ${formatTime(fin)}`;
    
    if (horarios.includes(nuevoHorario)) return setErrorMsg('El horario ya existe.');
    setHorarios([...horarios, nuevoHorario]);
    setInicio({ h: '', m: '', p: 'AM' });
    setFin({ h: '', m: '', p: 'AM' });
  };

  const handleAddCaja = () => {
    if (!nuevaCaja.trim()) return setErrorMsg('Ingresa un nombre para la caja.');
    if (cajas.includes(nuevaCaja.trim())) return setErrorMsg('La caja ya existe.');
    setCajas([...cajas, nuevaCaja.trim()]);
    setNuevaCaja('');
  };

  const handleSave = () => {
    if (isSupervisor) {
      if (dias.length === 0) return setErrorMsg('Debes agregar al menos 1 Día para guardar.');
    } else {
      if (dias.length === 0 || horarios.length === 0 || cajas.length === 0) {
        return setErrorMsg('Debes agregar al menos 1 Día, 1 Horario y 1 Caja para guardar.');
      }
    }
    onSave({ dias, horarios, cajas });
    setDias([]); setHorarios([]); setCajas([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 ${isSupervisor ? 'max-w-3xl' : 'max-w-5xl'}`}>

        {/* HEADER ESTILO PREMIUM */}
        <div className="bg-slate-900 p-5 flex justify-between items-center border-b border-slate-800 shrink-0">
          <h2 className="text-white font-black flex items-center gap-2 text-lg tracking-wide uppercase">
            <LayoutGrid size={20} className="text-blue-400" />
            {isSupervisor ? 'Añadir Días Globales' : 'Estructura Base del Evento'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-xl">
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 gap-4 sm:gap-6 ${isSupervisor ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>

          {/* COLUMNA: DÍAS NUEVOS */}
          <div className="bg-slate-50 border border-slate-100 p-4 sm:p-5 rounded-2xl flex flex-col shadow-sm">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
              <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Calendar size={18}/></div>
              Días Nuevos ({dias.length})
            </h4>
            <div className="flex gap-2 mb-4">
              <input type="date" value={nuevoDia} onChange={(e) => setNuevoDia(e.target.value)} className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
              <button onClick={handleAddDia} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm hover:-translate-y-0.5"><Plus size={20} /></button>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {dias.map((d, i) => (
                <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-blue-100 text-sm text-blue-800 font-bold shadow-sm">
                  <span>{d}</span>
                  <button onClick={() => setDias(dias.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition"><Trash2 size={16}/></button>
                </div>
              ))}
              {dias.length === 0 && <p className="text-xs text-slate-400 font-medium text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">No hay días agregados</p>}
            </div>
          </div>

          {/* COLUMNA: DÍAS EXISTENTES (SÓLO SUPERVISOR) */}
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

          {/* COLUMNAS: CAJAS Y HORARIOS (NO SUPERVISOR) */}
          {!isSupervisor && (
            <>
              {/* COLUMNA CAJAS */}
              <div className="bg-slate-50 border border-slate-100 p-4 sm:p-5 rounded-2xl flex flex-col shadow-sm">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
                  <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><Inbox size={18}/></div>
                  Cajas ({cajas.length})
                </h4>
                <div className="flex gap-2 mb-4">
                  <input type="text" placeholder="Nombre de la Caja" value={nuevaCaja} onChange={(e) => setNuevaCaja(e.target.value)} className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
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
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                    <span className="text-[10px] font-black text-slate-400 w-10 text-center">INICIO</span>
                    <input type="number" placeholder="00" value={inicio.h} onChange={e => setInicio({...inicio, h: e.target.value})} className="w-10 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm font-bold outline-none focus:border-emerald-500" />:
                    <input type="number" placeholder="00" value={inicio.m} onChange={e => setInicio({...inicio, m: e.target.value})} className="w-10 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm font-bold outline-none focus:border-emerald-500" />
                    <select value={inicio.p} onChange={e => setInicio({...inicio, p: e.target.value})} className="p-1.5 border border-slate-200 rounded-lg text-sm font-bold bg-slate-50 outline-none"><option>AM</option><option>PM</option></select>
                  </div>
                  <div className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                    <span className="text-[10px] font-black text-slate-400 w-10 text-center">FIN</span>
                    <input type="number" placeholder="00" value={fin.h} onChange={e => setFin({...fin, h: e.target.value})} className="w-10 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm font-bold outline-none focus:border-emerald-500" />:
                    <input type="number" placeholder="00" value={fin.m} onChange={e => setFin({...fin, m: e.target.value})} className="w-10 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm font-bold outline-none focus:border-emerald-500" />
                    <select value={fin.p} onChange={e => setFin({...fin, p: e.target.value})} className="p-1.5 border border-slate-200 rounded-lg text-sm font-bold bg-slate-50 outline-none"><option>AM</option><option>PM</option></select>
                    <button onClick={handleAddHorario} className="ml-auto bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition shadow-sm hover:-translate-y-0.5"><Plus size={18} /></button>
                  </div>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {horarios.map((h, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-emerald-100 text-sm text-emerald-800 font-bold shadow-sm">
                      <span>{h}</span>
                      <button onClick={() => setHorarios(horarios.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {horarios.length === 0 && <p className="text-xs text-slate-400 font-medium text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">No hay horarios agregados</p>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-sm text-sm">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-8 py-2.5 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md transition hover:-translate-y-0.5 text-sm">
            Guardar Estructura
          </button>
        </div>

        {/* MODAL DE ALERTAS / VALIDACIONES INTERNO */}
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
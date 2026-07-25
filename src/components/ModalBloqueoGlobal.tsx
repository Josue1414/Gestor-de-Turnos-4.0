import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, AlertTriangle, Info } from 'lucide-react';
import type { AdminData } from '../hooks/useSuperAdminLogic';

interface GlobalPerms {
  cajas: boolean;
  horarios: boolean;
  especiales: boolean;
}

interface ModalBloqueoGlobalProps {
  isOpen: boolean;
  onClose: () => void;
  admins: AdminData[];
  currentGlobalPerms?: GlobalPerms;
  onSave: (newPerms: GlobalPerms) => Promise<void>;
}

const ModalBloqueoGlobal: React.FC<ModalBloqueoGlobalProps> = ({ 
  isOpen, onClose, admins, currentGlobalPerms, onSave 
}) => {
  const [perms, setPerms] = useState({
    cajas: currentGlobalPerms?.cajas ?? true,
    horarios: currentGlobalPerms?.horarios ?? true,
    especiales: currentGlobalPerms?.especiales ?? true
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPerms({
        cajas: currentGlobalPerms?.cajas ?? true,
        horarios: currentGlobalPerms?.horarios ?? true,
        especiales: currentGlobalPerms?.especiales ?? true
      });
    }
  }, [isOpen, currentGlobalPerms]);

  if (!isOpen) return null;

  const isBloqueoTotal = !perms.cajas && !perms.horarios && !perms.especiales;

  const handleToggleTotal = () => {
    const newState = isBloqueoTotal; 
    setPerms({ cajas: newState, horarios: newState, especiales: newState });
  };

  // 1. Tomamos los permisos globales ACTUALES de la BD (o permitidos por defecto si es nuevo)
  const currentG = currentGlobalPerms || { cajas: true, horarios: true, especiales: true };

  // 2. Buscamos SOLO a los admins que tienen una configuración individual distinta a la regla global ACTUAL
  const adminsConExcepciones = admins?.filter(a => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = (a as any).permissions;
    if (!p) return false;
    
    return p.cajas !== currentG.cajas || 
           p.horarios !== currentG.horarios || 
           p.especiales !== currentG.especiales;
  }) || [];

  // Vemos si el usuario modificó alguna regla en el modal
  const hasChanges = perms.cajas !== currentG.cajas || perms.horarios !== currentG.horarios || perms.especiales !== currentG.especiales;

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(perms);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-purple-600 p-5 flex justify-between items-center text-white shrink-0">
          <h2 className="font-black flex items-center gap-2 text-lg">
            <Lock size={20}/> Bloqueo Global
          </h2>
          <button onClick={onClose} className="text-purple-200 hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-purple-50 text-purple-800 p-3 rounded-xl flex gap-2 items-start border border-purple-100 shrink-0">
            <Info size={18} className="shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-tight">
              Esta sección define las reglas base para todo el evento. Si pueden editar, crear o eliminar. <b>Desmarcar</b> una casilla ocultará los botones de creación a nivel general para los Administradores.
            </p>
          </div>

          <button 
            onClick={handleToggleTotal}
            className={`w-full p-3.5 shrink-0 rounded-xl font-black flex items-center justify-center gap-2 transition-all border-2 shadow-sm ${
              isBloqueoTotal 
                ? 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-purple-300 hover:text-purple-600'
            }`}
          >
            {isBloqueoTotal ? <Lock size={18} /> : <Unlock size={18} />}
            {isBloqueoTotal ? "DESBLOQUEAR TODO" : "BLOQUEAR TODO EL EVENTO"}
          </button>

          <div className="h-px bg-slate-100 w-full my-1 shrink-0"></div>

          <label className={`flex shrink-0 items-center justify-between cursor-pointer p-3 rounded-xl border transition-all ${!perms.cajas ? 'bg-purple-50/50 border-purple-200' : 'bg-white border-slate-200 hover:border-purple-300'}`}>
            <span className={`text-sm font-bold ${!perms.cajas ? 'text-purple-700' : 'text-slate-700'}`}>Permitir editar Cajas</span>
            <input type="checkbox" checked={perms.cajas} onChange={(e) => setPerms({...perms, cajas: e.target.checked})} className="w-5 h-5 accent-purple-600 cursor-pointer" />
          </label>

          <label className={`flex shrink-0 items-center justify-between cursor-pointer p-3 rounded-xl border transition-all ${!perms.horarios ? 'bg-purple-50/50 border-purple-200' : 'bg-white border-slate-200 hover:border-purple-300'}`}>
            <span className={`text-sm font-bold ${!perms.horarios ? 'text-purple-700' : 'text-slate-700'}`}>Permitir editar Horarios</span>
            <input type="checkbox" checked={perms.horarios} onChange={(e) => setPerms({...perms, horarios: e.target.checked})} className="w-5 h-5 accent-purple-600 cursor-pointer" />
          </label>

          <label className={`flex shrink-0 items-center justify-between cursor-pointer p-3 rounded-xl border transition-all ${!perms.especiales ? 'bg-purple-50/50 border-purple-200' : 'bg-white border-slate-200 hover:border-purple-300'}`}>
            <span className={`text-sm font-bold ${!perms.especiales ? 'text-purple-700' : 'text-slate-700'}`}>Permitir Cajas Especiales</span>
            <input type="checkbox" checked={perms.especiales} onChange={(e) => setPerms({...perms, especiales: e.target.checked})} className="w-5 h-5 accent-purple-600 cursor-pointer" />
          </label>

          {/* ADVERTENCIA DE JERARQUÍA LÍMPIA */}
          {(hasChanges || adminsConExcepciones.length > 0) && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl mt-2 shrink-0 animate-in fade-in">
              <p className="text-[11px] text-red-800 font-bold mb-1 flex items-start gap-1">
                <AlertTriangle size={14} className="shrink-0 mt-0.5"/> 
                Atención: Regla Estricta
              </p>
              <p className="text-[10px] text-red-700 leading-tight mb-2">
                Al guardar, esta regla global se aplicará a <b>todos</b> los administradores, reiniciando los permisos.
              </p>
              
              {adminsConExcepciones.length > 0 && (
                <>
                  <p className="text-[10px] text-red-800 font-bold mb-1 mt-3">
                    Admins con permisos individuales actuales:
                  </p>
                  <ul className="text-[11px] text-red-700 list-disc pl-5 font-bold max-h-24 overflow-y-auto pr-2">
                    {adminsConExcepciones.map(a => <li key={a.id}>{a.name}</li>)}
                  </ul>
                </>
              )}
            </div>
          )}

          <button onClick={handleSave} disabled={isSaving} className="mt-2 shrink-0 w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3.5 rounded-xl transition shadow-md disabled:opacity-50">
            {isSaving ? "Aplicando Reglas..." : "Guardar Reglas Globales"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalBloqueoGlobal;
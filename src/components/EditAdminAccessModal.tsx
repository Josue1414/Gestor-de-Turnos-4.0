import React, { useState } from 'react';
import { Key, User, X } from 'lucide-react';

interface EditAdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
  adminPass: string;
  onSave: (oldId: string, newId: string, newPass: string) => Promise<boolean | void>;
}

const EditAdminAccessModal: React.FC<EditAdminAccessModalProps> = ({ isOpen, onClose, adminId, adminPass, onSave }) => {
  const [newId, setNewId] = useState(adminId);
  const [newPass, setNewPass] = useState(adminPass);
  const [isSaving, setIsSaving] = useState(false);
  
  // SOLUCIÓN VERCEL/REACT: Rastrear cuándo se abre el modal para reiniciar los datos
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setNewId(adminId);
      setNewPass(adminPass);
    }
  }

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!newId.trim()) return alert("El ID no puede estar vacío.");
    setIsSaving(true);
    const success = await onSave(adminId, newId.trim(), newPass.trim());
    setIsSaving(false);
    if (success !== false) onClose(); // Cierra si no hubo error de duplicado
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-800 p-5 flex justify-between items-center">
          <h2 className="text-white font-black flex items-center gap-2"><Key size={18} className="text-blue-400"/> Editar Acceso</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 font-medium leading-relaxed">
            <strong>Atención:</strong> Si cambias el ID de acceso, el administrador deberá usar el nuevo ID para iniciar sesión. Toda su información se migrará automáticamente.
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><User size={12}/> Nuevo ID de Acceso</label>
            <input 
              value={newId} onChange={(e) => setNewId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Key size={12}/> Nueva Contraseña</label>
            <input 
              value={newPass} onChange={(e) => setNewPass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md disabled:bg-blue-400">
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAdminAccessModal;
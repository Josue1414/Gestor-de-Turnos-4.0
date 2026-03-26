import React, { useState, useEffect } from 'react';
import { Edit2, Key, DatabaseZap, Calendar, Map as MapIcon, X } from 'lucide-react';
import type { EventoData } from '../hooks/useSuperAdminLogic';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EventoData) => void;
  initialData: EventoData | null;
  onOpenStructure: () => void;
  onOpenCroquis: () => void;
}

const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, onSave, initialData, onOpenStructure, onOpenCroquis }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    passwordGeneral: '',
    metodoGuardado: 'Firebase'
  });

  useEffect(() => {
    if (initialData && isOpen) {
      const timer = setTimeout(() => {
        setFormData({
          nombre: initialData.nombre || '',
          passwordGeneral: initialData.passwordGeneral || '',
          metodoGuardado: initialData.metodoGuardado || 'Firebase'
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return alert("El nombre es obligatorio.");
    if (initialData) {
      onSave({ ...initialData, ...formData });
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      
      <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border-2 border-slate-100 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg uppercase tracking-tight">
              <Edit2 className="text-slate-500" size={20} /> Editar Detalles del Evento
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Actualiza configuraciones, contraseñas, estructura y croquis.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Nombre del Evento</label>
              <input type="text" placeholder="Ej. Convención Anime" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-400 outline-none font-bold text-sm text-slate-700 shadow-inner" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Contraseña General (Master)</label>
                  <div className="relative">
                    <input type="text" placeholder="Clave para todos" value={formData.passwordGeneral} onChange={(e) => setFormData({...formData, passwordGeneral: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-400 outline-none font-bold text-sm text-slate-700 shadow-inner" />
                    <Key size={18} className="absolute right-3 top-3.5 text-amber-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Método de Guardado</label>
                  <select value={formData.metodoGuardado} onChange={(e) => setFormData({...formData, metodoGuardado: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-400 outline-none font-bold text-sm text-slate-700 shadow-inner cursor-pointer">
                    <option>Firebase</option>
                    <option>Google Sheets</option>
                    <option>Ambos</option>
                  </select>
                </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <DatabaseZap size={14} className="text-indigo-500"/> Estructura y Mapa del Evento
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button type="button" onClick={onOpenStructure} className="w-full p-3 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm">
                  <Calendar size={18} className="text-blue-500" /> Editar Días/Horarios/Cajas
                </button>
                <button type="button" onClick={onOpenCroquis} className="w-full p-3 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm">
                  <MapIcon size={18} className="text-indigo-500" /> Ver/Subir Croquis
                </button>
              </div>
            </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition text-sm">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2.5 rounded-xl font-black text-white bg-slate-800 hover:bg-slate-900 shadow-md transition flex items-center gap-2 text-sm">
              <Edit2 size={16} /> Guardar Cambios
            </button>
        </div>
      </form>
    </div>
  );
};

export default EditEventModal;
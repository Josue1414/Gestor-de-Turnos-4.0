import React from 'react';
import { Shield, Copy, Key, User, Box, Trash2, Play, Users, Calendar } from 'lucide-react';
import { useToast } from './ToastProvider';

export interface CapitanData {
  id: string; 
  nombre: string;
  usuario: string; 
  password?: string;
  cajasAsignadas: string[]; 
  linkUnico: string;
}

interface SeccionCapitanesProps {
  capitanes: CapitanData[];
  onOpenModal: () => void;
  onDeleteCapitan: (id: string) => void;
  onSimularCapitan: (id: string) => void;
  isOpen: boolean; // Controla si se muestra o no este bloque
}

const SeccionCapitanes: React.FC<SeccionCapitanesProps> = ({ 
  capitanes, onOpenModal, onDeleteCapitan, onSimularCapitan, isOpen
}) => {
  const { showToast } = useToast();

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    showToast('Enlace único de capitán copiado al portapapeles.', 'success');
  };

  const handleCopyAccess = (usuario: string, pass: string) => {
    navigator.clipboard.writeText(`Usuario: ${usuario}
Contraseña: ${pass}`);
    showToast('Credenciales copiadas.', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
        <h3 className="font-black text-slate-800 flex items-center gap-2">
          <Shield className="text-amber-500" size={18} />
          Equipo de Capitanes
        </h3>
        <button 
          onClick={onOpenModal}
          className="bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800 text-xs font-black px-4 py-2 rounded-xl transition shadow-sm border border-amber-200"
        >
          + Añadir Capitán
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {capitanes.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
             <Shield size={32} className="mb-2 opacity-20" />
             <p className="font-bold text-sm">Aún no has creado ningún capitán.</p>
          </div>
        ) : (
          capitanes.map(capitan => (
            <div key={capitan.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative group flex flex-col h-full">
              
              <button 
                onClick={() => onDeleteCapitan(capitan.id)}
                className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Eliminar capitán"
              >
                <Trash2 size={16} />
              </button>

              <h4 className="font-black text-slate-800 flex items-center gap-1.5 mb-3 pr-8">
                <User size={16} className="text-amber-500" /> {capitan.nombre}
              </h4>
              
              <div className="flex-1 space-y-3 mb-4">
                {/* Bloque de Accesos Compacto */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide leading-none">Usr: <span className="text-slate-700 lowercase">{capitan.usuario}</span></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide leading-none">Psw: <span className="text-slate-700">{capitan.password}</span></span>
                  </div>
                  <button 
                    onClick={() => handleCopyAccess(capitan.usuario, capitan.password || '')}
                    className="p-1.5 text-slate-400 hover:text-amber-600 bg-white border border-slate-200 rounded-md transition"
                    title="Copiar credenciales"
                  >
                    <Key size={14} />
                  </button>
                </div>

                {/* Resumen de Asignaciones en Mini Tarjetas */}
                <div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5 block">Resumen de Asignación</span>
                   <div className="grid grid-cols-2 gap-2">
                      <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg flex flex-col items-center justify-center">
                         <span className="text-xs font-black text-indigo-700 flex items-center gap-1"><Box size={12}/> {capitan.cajasAsignadas.length}</span>
                         <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Cajas</span>
                      </div>
                      {/* Aquí podemos poner más info si quisieramos calcularla, por ahora mostramos un placeholder bonito */}
                      <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg flex flex-col items-center justify-center">
                         <span className="text-xs font-black text-blue-700 flex items-center gap-1"><Users size={12}/> Activo</span>
                         <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Estado</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col gap-2 mt-auto">
                 <button 
                   onClick={() => handleCopyLink(capitan.linkUnico)}
                   className="w-full bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                 >
                   <Copy size={14} /> Copiar Link Invitación
                 </button>
                 <button 
                   onClick={() => onSimularCapitan(capitan.id)}
                   className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                 >
                   <Play size={12} fill="currentColor" /> Simular Vista
                 </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SeccionCapitanes;
import React, { useState, useEffect } from 'react';
import { X, User, Key, ChevronRight, Lock } from 'lucide-react';
import ModalInfoUsuario from './ModalInfoUsuario';
import EditAdminAccessModal from './EditAdminAccessModal';
import type { AdminData } from '../hooks/useSuperAdminLogic';

interface AdminSettingsFlowProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminData | null;
  eventoId: string;
  currentUserRole: "SuperAdmin" | "Supervisor";
  onSaveProfile: (eventoId: string, updatedAdmin: AdminData) => Promise<void>;
  onSaveAccess: (eventoId: string, oldId: string, newId: string, newPass: string) => Promise<boolean>;
}

const AdminSettingsFlow: React.FC<AdminSettingsFlowProps> = ({ 
  isOpen, onClose, admin, eventoId, currentUserRole, onSaveProfile, onSaveAccess 
}) => {
  const [view, setView] = useState<'menu' | 'profile' | 'access' | 'permissions'>('menu');
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Estado local para manejar los permisos antes de guardarlos
  const [localPerms, setLocalPerms] = useState({
    cajas: true,
    horarios: true,
    especiales: true
  });

  // Reinicia la vista y los permisos cada vez que se abre el modal o cambia el admin
  useEffect(() => {
    if (isOpen !== prevIsOpen) {
      setPrevIsOpen(isOpen);
      if (isOpen) {
        setView('menu');
        // Si el admin ya tiene permisos guardados, los usamos; si no, por defecto son true
        // Usamos (admin as any) para evitar errores de TypeScript si permissions aún no está en AdminData
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const perms = (admin as any)?.permissions;
        setLocalPerms({
          cajas: perms?.cajas ?? true,
          horarios: perms?.horarios ?? true,
          especiales: perms?.especiales ?? true
        });
      }
    }
  }, [isOpen, prevIsOpen, admin]);

  if (!isOpen || !admin) return null;

  return (
    <>
      {/* MENÚ INTERMEDIO */}
      {view === 'menu' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-800 p-5 flex justify-between items-center">
              <h2 className="text-white font-black">Ajustes del Administrador</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={20}/>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <button onClick={() => setView('profile')} className="w-full p-4 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl font-bold transition flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2"><User size={18}/> Editar Perfil (Datos)</span>
                <ChevronRight size={18}/>
              </button>
              
              <button onClick={() => setView('access')} className="w-full p-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold transition flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2"><Key size={18}/> Editar Acceso (ID/Pass)</span>
                <ChevronRight size={18}/>
              </button>

              {/* NUEVO BOTÓN: Permisos */}
              <button onClick={() => setView('permissions')} className="w-full p-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl font-bold transition flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2"><Lock size={18}/> Permisos (Bloqueos)</span>
                <ChevronRight size={18}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PERMISOS (NUEVO) */}
      {view === 'permissions' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-5 flex justify-between items-center text-white">
              <h2 className="font-black flex items-center gap-2"><Lock size={20}/> Permisos de Edición</h2>
              <button onClick={() => setView('menu')} className="text-emerald-200 hover:text-white transition-colors">
                <X size={20}/>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                Habilita lo que el admin puede modificar:
              </p>

              <label className="flex items-center justify-between cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition">
                <span className="text-sm font-bold text-slate-700">Crear / Borrar Cajas</span>
                <input 
                  type="checkbox" 
                  checked={localPerms.cajas} 
                  onChange={(e) => setLocalPerms({...localPerms, cajas: e.target.checked})} 
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition">
                <span className="text-sm font-bold text-slate-700">Crear / Borrar Horarios</span>
                <input 
                  type="checkbox" 
                  checked={localPerms.horarios} 
                  onChange={(e) => setLocalPerms({...localPerms, horarios: e.target.checked})} 
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition">
                <span className="text-sm font-bold text-slate-700">Cajas Especiales</span>
                <input 
                  type="checkbox" 
                  checked={localPerms.especiales} 
                  onChange={(e) => setLocalPerms({...localPerms, especiales: e.target.checked})} 
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </label>

              <button
                onClick={async () => {
                  // Guardamos el admin original y le inyectamos el nuevo objeto "permissions"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const adminActualizado: any = {
                    ...admin,
                    permissions: localPerms
                  };
                  await onSaveProfile(eventoId, adminActualizado as AdminData);
                  setView('menu');
                }}
                className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl transition shadow-md"
              >
                Guardar Permisos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERFIL */}
      {view === 'profile' && (
        <ModalInfoUsuario
          isOpen={true}
          onClose={() => setView('menu')}
          data={{
            id: admin.id,
            name: admin.name,
            role: 'Administrador',
            phone: admin.phone || '',
            supportArea: admin.area || '',
            notes: admin.notes || '',
            organization: admin.org || '',
            organizationLabel: admin.orgLabel || 'Empresa/Congregación',
          }}
          isViewingSelf={false}
          currentUserRole={currentUserRole === "Supervisor" ? "SuperAdmin" : currentUserRole}
          onSave={async (datosActualizados) => {
            const adminActualizado: AdminData = {
                ...admin,
                name: datosActualizados.name,
                phone: datosActualizados.phone || '',
                area: datosActualizados.supportArea || '',
                notes: datosActualizados.notes || '',
                org: datosActualizados.organization || '',
                orgLabel: datosActualizados.organizationLabel || 'Empresa/Congregación'
            };
            await onSaveProfile(eventoId, adminActualizado);
            setView('menu'); // Regresa al menú tras guardar
          }}
          checkNameExists={() => false}
        />
      )}

      {/* MODAL ACCESO */}
      {view === 'access' && (
        <EditAdminAccessModal
          isOpen={true}
          onClose={() => setView('menu')}
          adminId={admin.id}
          adminPass={admin.password || ''}
          onSave={async (oldId, newId, newPass) => {
            const success = await onSaveAccess(eventoId, oldId, newId, newPass);
            if (success) setView('menu'); // Solo regresa al menú si se guardó sin errores
            return success;
          }}
        />
      )}
    </>
  );
};

export default AdminSettingsFlow;
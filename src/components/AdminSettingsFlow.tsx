import React, { useState } from 'react';
import { X, User, Key, ChevronRight } from 'lucide-react';
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
  const [view, setView] = useState<'menu' | 'profile' | 'access'>('menu');
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Reinicia la vista al menú principal cada vez que se abre el modal
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setView('menu');
  }

  if (!isOpen || !admin) return null;

  return (
    <>
      {/* MENÚ INTERMEDIO */}
      {view === 'menu' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
// src/components/AdminSettingsFlow.tsx
import React, { useState, useEffect } from 'react';
import { X, User, Key, ChevronRight, Lock, CalendarDays } from 'lucide-react';
import ModalInfoUsuario from './ModalInfoUsuario';
import EditAdminAccessModal from './EditAdminAccessModal';
import type { AdminData } from '../hooks/useSuperAdminLogic';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
  const [view, setView] = useState<'menu' | 'profile' | 'access' | 'permissions' | 'days'>('menu');
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Estados para Permisos de Edición
  const [localPerms, setLocalPerms] = useState({ cajas: true, horarios: true, especiales: true });

  // Estados para Asignación de Días
  const [availableDaysList, setAvailableDaysList] = useState<string[]>([]);
  const [localDays, setLocalDays] = useState<string[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);

  useEffect(() => {
    if (isOpen !== prevIsOpen) {
      setPrevIsOpen(isOpen);
      if (isOpen) {
        setView('menu');
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

  // Cargar lista de días disponibles de Firebase y pre-cargar seleccionados
  useEffect(() => {
    if (isOpen && view === 'days') {
      setLoadingDays(true);
      getDoc(doc(db, 'eventos', eventoId)).then(snap => {
        if(snap.exists()) {
          const data = snap.data();
          const daysSet = new Set<string>();
          if(data.diasPorAdmin) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.values(data.diasPorAdmin).forEach((diasArray: any) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              diasArray.forEach((d: any) => {
                if(d.nombreDia) daysSet.add(d.nombreDia);
              });
            });
          }
          const daysArr = Array.from(daysSet);
          setAvailableDaysList(daysArr);
          
          // Si diasAsignados es undefined, significa que ve TODOS los días. 
          const adminDays = admin?.diasAsignados;
          if (adminDays === undefined) {
             setLocalDays(daysArr);
          } else {
             setLocalDays(adminDays);
          }
        }
        setLoadingDays(false);
      }).catch(err => {
        console.error(err);
        setLoadingDays(false);
      });
    }
  }, [isOpen, view, eventoId, admin]);

  const toggleDay = (day: string) => {
    setLocalDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

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

              <button onClick={() => setView('permissions')} className="w-full p-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl font-bold transition flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2"><Lock size={18}/> Permisos (Bloqueos)</span>
                <ChevronRight size={18}/>
              </button>

              {/* NUEVO BOTÓN: Asignar Días */}
              <button onClick={() => setView('days')} className="w-full p-4 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white rounded-xl font-bold transition flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2"><CalendarDays size={18}/> Días Asignados</span>
                <ChevronRight size={18}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DÍAS ASIGNADOS (NUEVO) */}
      {view === 'days' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-amber-500 p-5 flex justify-between items-center text-white shrink-0">
              <h2 className="font-black flex items-center gap-2"><CalendarDays size={20}/> Días Permitidos</h2>
              <button onClick={() => setView('menu')} className="text-amber-100 hover:text-white transition-colors">
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-3 overflow-y-auto flex-1">
              <p className="text-xs font-bold text-slate-500 mb-2 leading-tight">
                Selecciona los días que este administrador podrá ver y gestionar.
              </p>

              {loadingDays ? (
                <p className="text-center text-sm font-bold text-slate-400 py-6 animate-pulse">Cargando días...</p>
              ) : availableDaysList.length === 0 ? (
                <p className="text-center text-sm font-bold text-red-400 py-6">No hay días configurados en el evento.</p>
              ) : (
                availableDaysList.map(day => (
                  <label key={day} className={`flex items-center justify-between cursor-pointer p-3.5 rounded-xl border transition-all ${localDays.includes(day) ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200 hover:border-amber-300'}`}>
                    <span className={`text-sm font-bold ${localDays.includes(day) ? 'text-amber-700' : 'text-slate-700'}`}>{day}</span>
                    <input 
                      type="checkbox" 
                      checked={localDays.includes(day)} 
                      onChange={() => toggleDay(day)} 
                      className="w-5 h-5 accent-amber-500 cursor-pointer"
                    />
                  </label>
                ))
              )}
            </div>

            <div className="p-6 pt-2 shrink-0 bg-white border-t border-slate-100">
               <button
                 onClick={async () => {
                   const adminActualizado: AdminData = { ...admin, diasAsignados: localDays };
                   await onSaveProfile(eventoId, adminActualizado);
                   setView('menu');
                 }}
                 className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3.5 rounded-xl transition shadow-md"
               >
                 Guardar Días
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PERMISOS */}
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const adminActualizado: any = { ...admin, permissions: localPerms };
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

      {/* MODAL PERFIL - LÓGICA CORREGIDA PARA EVITAR ERROR DE TIPADO STRICTO */}
      {view === 'profile' && (
        <ModalInfoUsuario
          isOpen={true}
          onClose={() => setView('menu')}
          data={{
            id: admin.id,
            name: admin.name,
            role: 'Administrador',
            phone: admin.phone || '',
            countryCode: (admin as any).countryCode || '+52',
            supportArea: (admin as any).supportArea || (admin as any).area || '',
            notes: admin.notes || '',
            organization: (admin as any).organization || (admin as any).org || '',
            organizationLabel: (admin as any).organizationLabel || (admin as any).orgLabel || 'Empresa/Congregación',
          }}
          isViewingSelf={false}
          currentUserRole={currentUserRole === "Supervisor" ? "SuperAdmin" : currentUserRole}
          onSave={async (datosActualizados) => {
            // Utilizamos 'any' para poder inyectar las propiedades nuevas sin que TypeScript 
            // rechace el literal de objeto por no existir en la versión actual de AdminData
            const adminActualizado: any = {
                ...admin,
                name: datosActualizados.name,
                phone: datosActualizados.phone || '',
                countryCode: datosActualizados.countryCode || '+52',
                supportArea: datosActualizados.supportArea || '',
                notes: datosActualizados.notes || '',
                organization: datosActualizados.organization || '',
                organizationLabel: datosActualizados.organizationLabel || 'Empresa/Congregación'
            };
            
            // Limpiamos las variables antiguas para que no viajen a la BD
            delete adminActualizado.area;
            delete adminActualizado.org;
            delete adminActualizado.orgLabel;

            await onSaveProfile(eventoId, adminActualizado as AdminData);
            setView('menu'); 
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
            if (success) setView('menu');
            return success;
          }}
        />
      )}
    </>
  );
};

export default AdminSettingsFlow;
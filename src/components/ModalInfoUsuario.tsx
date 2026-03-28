import React, { useState, useEffect } from 'react';
import { User, Phone, StickyNote, X, ExternalLink, Check, Download, Lock, Users as UsersIcon, MapPin } from 'lucide-react';
import TextInput from './TextInput'; 

export interface UsuarioModalData {
  id: string; 
  name: string; 
  role: 'Administrador' | 'Participante' | 'SuperAdmin';
  phone: string; 
  countryCode?: string; // <-- NUEVO: Código de país
  supportArea: string; 
  notes: string; 
  organizationLabel?: string; 
  organization?: string;
  ubicaciones?: string[]; // <-- NUEVO: Para mostrar la lista de turnos
}

interface ModalInfoUsuarioProps {
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: UsuarioModalData) => void;
  data: UsuarioModalData | null; 
  isViewingSelf?: boolean;
  checkNameExists?: (name: string, currentId: string) => boolean;
  currentUserRole?: 'Administrador' | 'Participante' | 'SuperAdmin'; 
  onDownloadImage?: () => void; 
}

const createWhatsAppLink = (code: string, phone: string) => {
  const sanitizedCode = (code || '52').replace(/\D/g, '');
  const sanitizedPhone = (phone || '').replace(/\D/g, '');
  return sanitizedPhone ? `https://wa.me/${sanitizedCode}${sanitizedPhone}` : '#';
};

const FieldItem: React.FC<{ icon: React.ReactNode; label: React.ReactNode; children: React.ReactNode; actionRight?: React.ReactNode }> = ({ icon, label, children, actionRight }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 flex-shrink-0 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm border border-blue-100">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">{label}</label>
        {actionRight}
      </div>
      {children}
    </div>
  </div>
);

const ModalInfoUsuario: React.FC<ModalInfoUsuarioProps> = ({ 
  isOpen, onClose, data, isViewingSelf, currentUserRole, onSave, onDownloadImage 
}) => {
  const [formData, setFormData] = useState<UsuarioModalData>({
    id: '', name: '', role: 'Participante', phone: '', countryCode: '+52', supportArea: '', notes: '', organization: '', organizationLabel: 'Congregación', ubicaciones: []
  });

  useEffect(() => {
    if (data && isOpen) {
      const timer = setTimeout(() => {
        setFormData({
          ...data,
          countryCode: data.countryCode || '+52',
          organizationLabel: data.organizationLabel || 'Congregación'
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [data, isOpen]);

  if (!isOpen || !data) return null;

  const handleSave = () => {
    if (!formData.name.trim()) return alert('El nombre no puede estar vacío');
    onSave(formData);
  };

  const isEditable = isViewingSelf || currentUserRole === 'Administrador' || currentUserRole === 'SuperAdmin';
  const isAdminViewing = currentUserRole === 'Administrador' || currentUserRole === 'SuperAdmin';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-slate-50 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-white">
        
        <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <User className="text-blue-500" size={20} /> Perfil de Usuario
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{formData.role}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <FieldItem icon={<User size={20} />} label="Nombre Completo">
            {isEditable ? (
              <TextInput 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                onClear={() => setFormData({...formData, name: ''})}
                placeholder="Ej. Juan Pérez"
              />
            ) : (
              <div className="text-sm font-bold text-slate-800 bg-white p-3 border border-slate-200 rounded-xl">{formData.name}</div>
            )}
          </FieldItem>

          <FieldItem 
            icon={<Phone size={20} />} 
            label="Teléfono / WhatsApp"
            actionRight={
              formData.phone && formData.phone.length >= 10 && (
                <a href={createWhatsAppLink(formData.countryCode || '+52', formData.phone)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Probar Link <ExternalLink size={12} />
                </a>
              )
            }
          >
            {isEditable ? (
              <div className="flex gap-2">
                <div className="relative w-24 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">+</span>
                  <input 
                    type="text" 
                    value={(formData.countryCode || '+52').replace('+', '')}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, countryCode: '+' + onlyNums});
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-2.5 pl-7 font-bold outline-none focus:border-blue-400 focus:bg-white transition shadow-sm text-sm"
                    placeholder="52"
                    title="Código de País"
                  />
                </div>
                <div className="flex-1">
                  <TextInput 
                    value={formData.phone}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/\D/g, '');
                      if (onlyNums.length <= 10) setFormData({...formData, phone: onlyNums});
                    }}
                    onClear={() => setFormData({...formData, phone: ''})}
                    placeholder="Ej. 5512345678"
                    type="tel"
                  />
                  <p className="text-[10px] text-slate-400 font-bold mt-1 text-right">{formData.phone.length}/10 dígitos</p>
                </div>
              </div>
            ) : (
              <div className="text-sm font-bold text-slate-800 bg-white p-3 border border-slate-200 rounded-xl">{formData.countryCode} {formData.phone || 'No registrado'}</div>
            )}
          </FieldItem>

          <FieldItem 
            icon={<UsersIcon size={20} />} 
            label={
              isAdminViewing ? (
                <input 
                  type="text" 
                  value={formData.organizationLabel}
                  onChange={(e) => setFormData({...formData, organizationLabel: e.target.value})}
                  className="bg-transparent border-b border-dashed border-slate-400 focus:border-blue-500 outline-none w-32 text-xs font-black text-slate-500 uppercase tracking-wider"
                  title="Cambiar etiqueta (Ej. Empresa, Escuela)"
                />
              ) : (
                <span>{formData.organizationLabel}</span>
              )
            }
          >
            {isEditable ? (
              <TextInput 
                value={formData.organization || ''}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
                onClear={() => setFormData({...formData, organization: ''})}
                placeholder={`Nombre de la ${formData.organizationLabel?.toLowerCase() || 'organización'}`}
              />
            ) : (
              <div className="text-sm font-bold text-slate-800 bg-white p-3 border border-slate-200 rounded-xl">{formData.organization || 'No especificada'}</div>
            )}
          </FieldItem>

          <FieldItem icon={<MapPin size={20} />} label="Turnos y Ubicaciones">
            {formData.role === 'Participante' ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.ubicaciones && formData.ubicaciones.length > 0 ? (
                  formData.ubicaciones.map((ubi, i) => (
                    <span key={i} className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>{ubi}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400 font-medium italic flex items-center h-full">Usuario sin turnos asignados actualmente.</span>
                )}
              </div>
            ) : (
              <span className="text-sm font-bold text-slate-500 bg-slate-100 p-2 rounded-lg border border-slate-200">Acceso Total (Administrador)</span>
            )}
          </FieldItem>

          <FieldItem 
            icon={<StickyNote size={20} />} 
            label={
              <span className="flex items-center gap-1">Notas Personales <Lock size={12} className="text-amber-500"/></span>
            }
          >
            <div className="mb-2 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 p-2 rounded-lg font-medium leading-tight">
              Solo tú y el administrador principal pueden ver y editar este campo.
            </div>
            {isEditable ? (
              <textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                placeholder="Escribe aquí tu disponibilidad o detalles de ayuda..."
                rows={3} 
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white shadow-sm resize-y" 
              />
            ) : (
              <div className="text-sm text-slate-600 bg-white p-3 border border-slate-200 rounded-xl whitespace-pre-wrap">{formData.notes || 'Sin notas.'}</div>
            )}
          </FieldItem>

          {/* BOTÓN DE DESCARGA SUPER INTUITIVO */}
          {onDownloadImage && (
            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={onDownloadImage} 
                className="w-full bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 text-indigo-700 p-4 rounded-2xl transition font-black text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Download size={20} />
                {formData.role === 'Participante' ? 'DESCARGAR MIS TURNOS (IMAGEN)' : 'DESCARGAR HORARIO GLOBAL (IMAGEN)'}
              </button>
            </div>
          )}

        </div>

        {isEditable && (
          <div className="flex justify-end gap-3 p-4 bg-white border-t border-slate-100 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 rounded-xl text-slate-700 text-sm font-bold hover:bg-slate-200 transition">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition shadow-md flex items-center gap-2">
              <Check size={16} /> Guardar Perfil
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalInfoUsuario;
import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, StickyNote, Lock, X, ExternalLink, Edit2, Check, Users as UsersIcon, Download } from 'lucide-react';

interface Usuario {
  id: string; name: string; role: 'Administrador' | 'Participante' | 'SuperAdmin';
  phone: string; supportArea: string; notes: string; organizationLabel?: string; organization?: string;
}

interface ModalInfoUsuarioProps {
  isOpen: boolean; onClose: () => void; onSave: (data: Usuario) => void;
  data: Usuario | null; isViewingSelf?: boolean;
  checkNameExists?: (name: string, currentId: string) => boolean;
  currentUserRole?: 'Administrador' | 'Participante' | 'SuperAdmin'; // <-- NUEVO: Para arreglar el candado
  onDownloadImage?: () => void; // <-- NUEVO: Función para generar la imagen
}

const createWhatsAppLink = (phoneNumber: string) => {
  const sanitizedNumber = phoneNumber.replace(/[^0-9]/g, '');
  return sanitizedNumber ? `https://wa.me/${sanitizedNumber}` : '#';
};

const FieldItem: React.FC<{ icon: React.ReactNode; label: React.ReactNode; children: React.ReactNode; actionRight?: React.ReactNode }> = ({ icon, label, children, actionRight }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500">{icon}</div>
    <div className="flex-1 w-full">
      <div className="flex justify-between items-end mb-1">
        <div className="text-sm font-bold text-slate-500 tracking-tight leading-tight">{label}</div>
        {actionRight && <div>{actionRight}</div>}
      </div>
      {children}
    </div>
  </div>
);

const ModalInfoUsuario: React.FC<ModalInfoUsuarioProps> = ({ 
  isOpen, onClose, onSave, data, isViewingSelf = false, checkNameExists, currentUserRole = 'Administrador', onDownloadImage 
}) => {
  const [formData, setFormData] = useState<Usuario>({
    id: '', name: '', role: 'Participante', phone: '', supportArea: '', notes: '', organizationLabel: 'Congregación', organization: ''
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingOrgLabel, setIsEditingOrgLabel] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (isOpen && data) {
      setFormData({
        id: data.id, name: data.name || '', role: data.role || 'Participante', phone: data.phone || '',
        supportArea: data.supportArea || '', notes: data.notes || '', organizationLabel: data.organizationLabel || 'Congregación', organization: data.organization || ''
      });
      setIsEditingName(false); setIsEditingOrgLabel(false); setNameError('');
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const roleLabelColors = {
    Administrador: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    Participante: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    SuperAdmin: 'bg-rose-100 text-rose-800 border border-rose-200',
  };

  const handleValidateName = () => {
    if (formData.name.trim() === '') { setNameError('El nombre no puede estar vacío'); return; }
    if (checkNameExists && checkNameExists(formData.name, formData.id)) { setNameError('Este participante ya existe.'); return; }
    setNameError(''); setIsEditingName(false);
  };

  const handleSaveClick = () => {
    if (checkNameExists && checkNameExists(formData.name, formData.id)) {
      setNameError('Este participante ya existe. Corrige el nombre antes de guardar.');
      setIsEditingName(true); return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 flex flex-col gap-6" onClick={e => e.stopPropagation()}>
        
        {/* CABECERA */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-100 rounded-full text-slate-500 mt-1"><User size={32} /></div>
            <div>
              {isEditingName ? (
                <div className="flex flex-col mb-1">
                  <div className="flex items-center gap-2">
                    <input autoFocus type="text" value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (nameError) setNameError(''); }} onKeyDown={(e) => e.key === 'Enter' && handleValidateName()} className={`text-2xl font-bold text-slate-800 tracking-tight border-b-2 outline-none bg-slate-50 px-1 py-0.5 w-full max-w-[200px] ${nameError ? 'border-red-500 text-red-600' : 'border-blue-500'}`} />
                    <button onClick={handleValidateName} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition"><Check size={18} /></button>
                  </div>
                  {nameError && <span className="text-xs font-bold text-red-500 mt-1">{nameError}</span>}
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer mb-1" onClick={() => setIsEditingName(true)}>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{formData.name || 'Sin Nombre'}</h2>
                  <div className="p-1 rounded-md text-slate-300 group-hover:bg-slate-100 group-hover:text-blue-500 transition-colors"><Edit2 size={16} /></div>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-0.5 text-[11px] font-black uppercase rounded-full tracking-wide shadow-sm ${roleLabelColors[formData.role]}`}>
                  {isViewingSelf ? 'Tu Rol: ' : ''}{formData.role}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition bg-slate-50 hover:bg-slate-100 rounded-full"><X size={20} /></button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="flex-1 flex flex-col gap-5 pr-2 overflow-y-auto max-h-[60vh]">
          
          <FieldItem icon={<UsersIcon size={20} />} label={
            /* EL CANDADO CORREGIDO: Basado en currentUserRole */
            <div className={`flex items-center gap-1 ${currentUserRole !== 'Participante' ? 'group cursor-pointer w-fit' : ''}`} onClick={() => { if (currentUserRole !== 'Participante') setIsEditingOrgLabel(true); }}>
              {isEditingOrgLabel ? (
                <input autoFocus value={formData.organizationLabel} onChange={(e) => setFormData({...formData, organizationLabel: e.target.value})} onBlur={() => setIsEditingOrgLabel(false)} onKeyDown={(e) => e.key === 'Enter' && setIsEditingOrgLabel(false)} className="border-b border-blue-400 outline-none bg-blue-50 px-1 text-blue-700" />
              ) : (
                <>
                  <span>{formData.organizationLabel}</span>
                  {currentUserRole !== 'Participante' && <Edit2 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </>
              )}
            </div>
          }>
            <input type="text" value={formData.organization || ''} onChange={(e) => setFormData({...formData, organization: e.target.value})} placeholder={`Nombre de la ${formData.organizationLabel?.toLowerCase() || 'organización'}`} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-white shadow-sm" />
          </FieldItem>

          <FieldItem icon={<Phone size={20} />} label="Celular / WhatsApp">
            <div className="flex items-center gap-2">
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9+\-\s]/g, '') })} placeholder="+52 899 123 4567" className="flex-1 p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white shadow-sm font-mono tracking-tight" />
              {/* WHATSAPP OCULTO SI ES TU PROPIO PERFIL */}
              {!isViewingSelf && (
                <a href={createWhatsAppLink(formData.phone)} target="_blank" rel="noopener noreferrer" className={`p-2.5 rounded-xl transition flex items-center shadow-sm border ${formData.phone.length > 5 ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed pointer-events-none'}`}><ExternalLink size={18} /></a>
              )}
            </div>
          </FieldItem>

          {/* ÁREA DE APOYO CON BOTÓN DE DESCARGA IMAGEN */}
          <FieldItem 
            icon={<MapPin size={20} />} 
            label={formData.role === 'Participante' ? "Áreas de Apoyo Asignadas" : "Área de Apoyo Principal"}
            actionRight={
              <button onClick={onDownloadImage} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-200 flex items-center gap-1 hover:bg-indigo-100 transition">
                <Download size={12} /> {currentUserRole === 'Participante' ? 'MI HORARIO' : 'HORARIO GENERAL'}
              </button>
            }
          >
            {formData.role === 'Administrador' || formData.role === 'SuperAdmin' ? (
              <input type="text" value={formData.supportArea} onChange={(e) => setFormData({...formData, supportArea: e.target.value})} placeholder="Ej. Coordinación General" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white shadow-sm" />
            ) : (
              <div className="flex flex-wrap gap-2 mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px]">
                {formData.supportArea && formData.supportArea !== 'Sin área asignada' ? (
                  formData.supportArea.split(', ').map((area, idx) => (
                    <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>{area}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400 italic flex items-center h-full">Usuario sin turnos asignados.</span>
                )}
              </div>
            )}
          </FieldItem>

          <FieldItem icon={<StickyNote size={20} />} label="Notas y Comentarios (ej. disponibilidad)">
            <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white shadow-sm resize-y" />
          </FieldItem>
        </div>

        <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 mt-2">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 rounded-xl text-slate-700 text-sm font-bold hover:bg-slate-200 transition">Cancelar</button>
          <button onClick={handleSaveClick} className="px-6 py-2.5 bg-blue-600 rounded-xl text-white text-sm font-bold hover:bg-blue-700 transition shadow-md hover:shadow-lg flex items-center">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};

export default ModalInfoUsuario;
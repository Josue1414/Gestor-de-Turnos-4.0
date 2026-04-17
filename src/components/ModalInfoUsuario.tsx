import React, { useState } from 'react';
import { User, Phone, StickyNote, X, Download, MapPin, Calendar } from 'lucide-react';

export interface UsuarioModalData {
  id: string; 
  name: string; 
  role: 'Administrador' | 'Participante' | 'SuperAdmin';
  phone: string; 
  countryCode?: string;
  supportArea: string; 
  notes: string; 
  organizationLabel?: string; 
  organization?: string;
  ubicaciones?: string[];
  birthDate?: string; 
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

const FieldItem = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
  <div className="mb-5 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
      <span className="text-blue-500 bg-blue-50 p-1.5 rounded-lg">{icon}</span> {label}
    </label>
    {children}
  </div>
);

// --- COMPONENTE HIJO (El contenido real del formulario) ---
// Al separarlo, podemos inicializar el estado directamente sin usar useEffect
const ModalContent: React.FC<Omit<ModalInfoUsuarioProps, 'isOpen' | 'data'> & { data: UsuarioModalData }> = ({
  onClose, onSave, data, isViewingSelf, checkNameExists, currentUserRole = 'Administrador', onDownloadImage
}) => {
  // Inicializamos el estado limpiamente y de forma directa. ¡Adiós useEffect!
  const [formData, setFormData] = useState<UsuarioModalData>({
    ...data,
    birthDate: data.birthDate || ''
  });
  const [errorName, setErrorName] = useState('');

  const isEditable = isViewingSelf || (currentUserRole === 'Administrador' || currentUserRole === 'SuperAdmin');

  const handleSave = () => {
    if (!formData.name.trim()) return;
    if (checkNameExists && checkNameExists(formData.name, formData.id)) {
      setErrorName('Ya existe alguien con este nombre. Agrega un apellido.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center z-[100] p-0 sm:p-4 transition-all">
      <div className="bg-slate-50 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 transform transition-transform">
        
        <div className="flex justify-between items-center p-5 bg-white border-b border-slate-100 shrink-0">
          <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
            {isViewingSelf ? 'Mi Perfil' : 'Información de Usuario'}
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-1">
          <FieldItem icon={<User size={18} />} label="Nombre Completo">
            {isEditable ? (
              <>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 font-bold text-slate-700 transition"
                />
                {errorName && <p className="text-red-500 text-xs font-bold mt-2">{errorName}</p>}
              </>
            ) : (
              <span className="font-bold text-slate-800 text-lg">{formData.name}</span>
            )}
          </FieldItem>

          <FieldItem icon={<Phone size={18} />} label="Teléfono (Opcional)">
            {isEditable ? (
              <div className="flex gap-2">
                <input 
                  type="text" value={formData.countryCode || '+52'} onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 font-bold text-slate-700 text-center"
                  placeholder="+52"
                />
                <input 
                  type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 font-bold text-slate-700"
                  placeholder="Ej. 55 1234 5678"
                />
              </div>
            ) : (
              <span className="font-bold text-slate-800">{formData.phone || 'No registrado'}</span>
            )}
          </FieldItem>

          <FieldItem icon={<Calendar size={18} />} label="Fecha de Nacimiento (Clave)">
            {isEditable ? (
              <input 
                type="date" 
                value={formData.birthDate || ''} 
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 font-medium text-slate-700"
              />
            ) : (
              <span className="font-bold text-slate-800">{formData.birthDate || 'No registrada'}</span>
            )}
          </FieldItem>

          <FieldItem icon={<MapPin size={18} />} label={formData.role === 'Participante' ? 'Turnos Asignados' : 'Área / Rol'}>
            <span className="font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
              {formData.supportArea || 'No tiene turnos'}
            </span>
          </FieldItem>

          <FieldItem icon={<StickyNote size={18} />} label="Notas Internas">
            {isEditable ? (
              <textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm font-medium text-slate-700 resize-none"
                placeholder="Alergias, necesidades especiales, comentarios..."
              />
            ) : (
              <div className="text-sm font-medium text-slate-600 bg-white p-3 border border-slate-200 rounded-xl whitespace-pre-wrap">{formData.notes || 'Sin notas.'}</div>
            )}
          </FieldItem>

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
            <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 rounded-xl text-white text-sm font-black shadow-md hover:bg-blue-700 transition">Guardar Perfil</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE CONTENEDOR (El que exportamos) ---
const ModalInfoUsuario: React.FC<ModalInfoUsuarioProps> = ({ isOpen, data, ...props }) => {
  // Si está cerrado o no hay datos, no pintamos nada en pantalla.
  if (!isOpen || !data) return null;

  // El truco maestro de React: 'key={data.id}' 
  // Obliga a React a renderizar ModalContent de cero cuando el ID cambia, 
  // dándonos un estado 100% fresco sin necesidad de usar useEffect.
  return <ModalContent key={data.id} data={data} {...props} />;
};

export default ModalInfoUsuario;
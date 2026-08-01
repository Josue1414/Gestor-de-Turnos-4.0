// src/components/ModalInfoUsuario.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { User, Phone, StickyNote, X, Download, Calendar, Briefcase, Clock, MessageCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MESES = [
  { valor: '01', nombre: 'Enero' }, { valor: '02', nombre: 'Febrero' },
  { valor: '03', nombre: 'Marzo' }, { valor: '04', nombre: 'Abril' },
  { valor: '05', nombre: 'Mayo' }, { valor: '06', nombre: 'Junio' },
  { valor: '07', nombre: 'Julio' }, { valor: '08', nombre: 'Agosto' },
  { valor: '09', nombre: 'Septiembre' }, { valor: '10', nombre: 'Octubre' },
  { valor: '11', nombre: 'Noviembre' }, { valor: '12', nombre: 'Diciembre' },
];

export interface UsuarioModalData {
  id: string; 
  name: string; 
  role: 'Administrador' | 'Participante' | 'SuperAdmin' | 'Capitan'; 
  phone: string; 
  countryCode?: string;
  supportArea: string; 
  notes: string; 
  organizationLabel?: string; 
  organization?: string;
  ubicaciones?: string[];
  birthDate?: string; 
  turnosAsignados?: { dia: string; horario: string; caja: string }[];
}

interface ModalInfoUsuarioProps {
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: UsuarioModalData) => void;
  data: UsuarioModalData | null; 
  isViewingSelf?: boolean;
  checkNameExists?: (name: string, currentId: string) => boolean;
  currentUserRole?: 'Administrador' | 'Participante' | 'SuperAdmin' | 'Capitan';
  onDownloadImage?: () => void; 
}

const FieldItem = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
  <div className="mb-3 bg-slate-100 p-3 rounded-2xl border border-slate-200">
    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
      <span className="text-blue-500 bg-blue-50 p-1.5 rounded-lg">{icon}</span> {label}
    </label>
    {children}
  </div>
);

const ModalContent: React.FC<Omit<ModalInfoUsuarioProps, 'isOpen' | 'data'> & { data: UsuarioModalData }> = ({
  onClose, onSave, data, isViewingSelf, checkNameExists, currentUserRole = 'Administrador', onDownloadImage
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<UsuarioModalData>({
    ...data,
    birthDate: data.birthDate || '',
    phone: data.phone || '',
    countryCode: data.countryCode || '+52',
    notes: data.notes || '',
    organization: data.organization || '',
    organizationLabel: data.organizationLabel || 'Congregación',
  });
  const [errorName, setErrorName] = useState('');
  
  // NUEVO: Estado para confirmar el cierre de sesión
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Estados para la fecha de nacimiento en formato lista
  const [anioNacimiento, setAnioNacimiento] = useState('');
  const [mesNacimiento, setMesNacimiento] = useState('');
  const [diaNacimiento, setDiaNacimiento] = useState('');

  // Pre-cargar la fecha de nacimiento en los selectores
  useEffect(() => {
    if (data.birthDate) {
      const [y, m, d] = data.birthDate.split('-');
      if (y && m && d) {
        setAnioNacimiento(y);
        setMesNacimiento(m);
        setDiaNacimiento(d);
      }
    }
  }, [data.birthDate]);

  const listaAnios = useMemo(() => {
    const anioMaximo = new Date().getFullYear() - 18;
    const anios: number[] = [];
    for (let a = anioMaximo; a >= 1900; a--) {
      anios.push(a);
    }
    return anios;
  }, []);

  const cantidadDiasEnMes = useMemo(() => {
    if (!anioNacimiento || !mesNacimiento) return 31;
    const a = parseInt(anioNacimiento, 10);
    const m = parseInt(mesNacimiento, 10);
    return new Date(a, m, 0).getDate();
  }, [anioNacimiento, mesNacimiento]);

  const listaDias = useMemo(() => {
    const dias: string[] = [];
    for (let d = 1; d <= cantidadDiasEnMes; d++) {
      dias.push(d.toString().padStart(2, '0'));
    }
    return dias;
  }, [cantidadDiasEnMes]);

  const isEditable = isViewingSelf || (currentUserRole === 'Administrador' || currentUserRole === 'SuperAdmin' || currentUserRole === 'Capitan');
  const isAdmin = currentUserRole === 'Administrador' || currentUserRole === 'SuperAdmin';

  const handleSave = () => {
    if (!formData.name.trim()) return;
    if (checkNameExists && checkNameExists(formData.name, formData.id)) {
      setErrorName('Ya existe alguien con este nombre. Agrega un apellido.');
      return;
    }

    if (formData.role === 'Participante' && (!anioNacimiento || !mesNacimiento || !diaNacimiento)) {
      setErrorName('La fecha de nacimiento debe estar completa.');
      return;
    }

    onSave({
      ...formData,
      birthDate: formData.role === 'Participante' ? `${anioNacimiento}-${mesNacimiento}-${diaNacimiento}` : formData.birthDate,
      phone: formData.phone || '',
      countryCode: formData.countryCode || '+52',
      notes: formData.notes || '',
      organization: formData.organization || ''
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, ''); 
    if (numericValue.length <= 10) {
      setFormData({ ...formData, phone: numericValue });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_admin_id');
    localStorage.removeItem('current_capitan_id');
    localStorage.removeItem('simulando_capitan');
    sessionStorage.removeItem('visor_externo_tipo');
    navigate('/');
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center z-[100] p-0 sm:p-4 transition-all">
        <div className="bg-slate-50 w-full max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 transform transition-transform">
          <div className="flex justify-between items-center p-3 bg-white border-b border-slate-100 shrink-0">
            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
              {isViewingSelf ? 'Mi Perfil' : 'Información de Usuario'}
            </h3>
            <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
              <X size={20} />
            </button>
          </div>

          <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-3">
            <FieldItem icon={<User size={18} />} label="Nombre Completo">
              {isEditable ? (
                <>
                  <input 
                    type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 font-semibold text-slate-700 transition"
                  />
                  {errorName && <p className="text-red-500 text-xs font-bold mt-2">{errorName}</p>}
                </>
              ) : (
                <span className="font-bold text-slate-800 text-lg">{formData.name}</span>
              )}
            </FieldItem>

            <FieldItem icon={<Phone size={18} />} label="Teléfono (10 dígitos)">
              {isEditable ? (
                <div className="flex gap-2">
                  <input 
                    type="text" value={formData.countryCode} onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="w-20 bg-white border border-slate-200 rounded-xl px-2.5 py-2 outline-none focus:border-blue-400 font-medium text-slate-700 text-center"
                  />
                  <input 
                    type="tel" value={formData.phone} onChange={handlePhoneChange}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 font-medium text-slate-700" placeholder="Ej. 5512345678"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
                  <span className="font-bold text-slate-800 ml-2">
                    {formData.phone ? `${formData.countryCode} ${formData.phone}` : 'No registrado'}
                  </span>
                  
                  <a 
                    href={formData.phone ? `https://wa.me/${(formData.countryCode || '+52').replace(/\D/g, '')}${formData.phone}` : undefined}
                    target={formData.phone ? "_blank" : undefined}
                    rel="noreferrer"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                      formData.phone 
                        ? 'bg-[#25D366] hover:bg-[#1EBE5D] text-white hover:scale-105' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                    onClick={(e) => !formData.phone && e.preventDefault()}
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                </div>
              )}
            </FieldItem>

            {formData.role === 'Participante' && (
              <FieldItem icon={<Calendar size={18} />} label="Fecha de Nacimiento (Clave)">
                {isEditable ? (
                  <div className="flex gap-2 mt-1">
                    <div className="w-1/3">
                      <span className="text-[9px] font-bold text-slate-400 block text-center mb-1 uppercase">Año</span>
                      <select 
                        value={anioNacimiento} 
                        onChange={(e) => setAnioNacimiento(e.target.value)} 
                        className="w-full bg-white border border-slate-200 text-slate-800 text-center text-xs font-bold rounded-xl p-2 outline-none focus:border-blue-400 cursor-pointer shadow-sm"
                      >
                        <option value="">Año</option>
                        {listaAnios.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <span className="text-[9px] font-bold text-slate-400 block text-center mb-1 uppercase">Mes</span>
                      <select 
                        value={mesNacimiento} 
                        onChange={(e) => setMesNacimiento(e.target.value)} 
                        className="w-full bg-white border border-slate-200 text-slate-800 text-center text-xs font-bold rounded-xl p-2 outline-none focus:border-blue-400 cursor-pointer shadow-sm"
                      >
                        <option value="">Mes</option>
                        {MESES.map(m => <option key={m.valor} value={m.valor}>{m.nombre}</option>)}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <span className="text-[9px] font-bold text-slate-400 block text-center mb-1 uppercase">Día</span>
                      <select 
                        value={diaNacimiento} 
                        onChange={(e) => setDiaNacimiento(e.target.value)} 
                        className="w-full bg-white border border-slate-200 text-slate-800 text-center text-xs font-bold rounded-xl p-2 outline-none focus:border-blue-400 cursor-pointer shadow-sm"
                      >
                        <option value="">Día</option>
                        {listaDias.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <span className="font-bold text-slate-800">{formData.birthDate || 'No registrada'}</span>
                )}
              </FieldItem>
            )}

            <FieldItem icon={<Briefcase size={18} />} label={formData.organizationLabel || "Congregación"}>
              {isEditable ? (
                <div className="space-y-2">
                  {isAdmin && (
                    <input 
                      type="text" placeholder="Cambiar etiqueta (ej: Empresa)" value={formData.organizationLabel}
                      onChange={(e) => setFormData({...formData, organizationLabel: e.target.value})}
                      className="w-full text-[10px] text-indigo-500 bg-indigo-50 font-black uppercase rounded-lg p-2 border border-indigo-100"
                    />
                  )}
                  <input 
                    type="text" value={formData.organization} onChange={(e) => setFormData({...formData, organization: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 font-medium text-slate-700 transition"
                    placeholder={`Nombre de tu ${formData.organizationLabel || 'Congregación'}`}
                  />
                </div>
              ) : (
                <span className="font-bold text-slate-800 text-sm">{formData.organization || 'No especificada'}</span>
              )}
            </FieldItem>

            <FieldItem icon={<Clock size={18} />} label="Turnos Asignados">
              {formData.turnosAsignados && formData.turnosAsignados.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {formData.turnosAsignados.map((turno, idx) => (
                    <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 flex justify-between items-center shadow-sm">
                      <span className="text-[11px] font-bold text-indigo-900">{turno.dia}: {turno.horario}</span>
                      <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-100/50 px-2 py-0.5 rounded border border-indigo-200 max-w-[120px] truncate">{turno.caja}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-400 italic">No tiene turnos asignados aún.</span>
              )}
            </FieldItem>

            <FieldItem icon={<StickyNote size={18} />} label="Notas Internas">
              {isEditable ? (
                <textarea 
                  value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-sm font-medium text-slate-700 resize-none"
                  placeholder="Alergias, necesidades especiales, comentarios..."
                />
              ) : (
                <div className="text-sm font-medium text-slate-600 bg-white p-3 border border-slate-200 rounded-xl whitespace-pre-wrap">{formData.notes || 'Sin notas.'}</div>
              )}
            </FieldItem>

            {onDownloadImage && (
              <div className="pt-2 border-t border-slate-100">
                <button onClick={onDownloadImage} className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 py-3 rounded-2xl transition font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                  <Download size={20} />
                  {formData.role === 'Participante' ? 'DESCARGAR MIS TURNOS' : 'DESCARGAR HORARIO GLOBAL'}
                </button>
              </div>
            )}

            {/* BOTÓN PARA CERRAR SESIÓN (Abre la confirmación) */}
            {isViewingSelf && (
              <div className="pt-2 border-t border-slate-100">
                <button 
                  onClick={() => setShowLogoutConfirm(true)} 
                  className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 py-3 rounded-2xl transition font-black text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <LogOut size={20} />
                  CERRAR SESIÓN
                </button>
              </div>
            )}
          </div>

          {isEditable && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 bg-white border-t border-slate-100 shrink-0">
              <button onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 rounded-xl text-slate-700 text-sm font-bold hover:bg-slate-200 transition">Cancelar</button>
              <button onClick={handleSave} className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 rounded-xl text-white text-sm font-black shadow-md hover:bg-blue-700 transition">Guardar Perfil</button>
            </div>
          )}
        </div>
      </div>

      {/* RENDERIZAMOS EL MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN POR ENCIMA */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-inner border border-red-100">
              <LogOut size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">¿Cerrar Sesión?</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Estás a punto de salir de tu cuenta. Tendrás que volver a ingresar para acceder.</p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleLogout} 
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black shadow-md hover:bg-red-600 transition"
              >
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ModalInfoUsuario: React.FC<ModalInfoUsuarioProps> = ({ isOpen, data, ...props }) => {
  if (!isOpen || !data) return null;
  return <ModalContent key={data.id} data={data} {...props} />;
};

export default ModalInfoUsuario;
import React, { useState } from 'react';
import { X, Users, Settings, Share2, Copy, CheckCircle, MessageCircle, Trash2, UserPlus } from 'lucide-react';
import type { Participante } from '../types';

export interface ParticipanteExtendido extends Participante {
  telefono?: string;
  notas?: string;
}

interface ParticipantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  participantes: ParticipanteExtendido[]; 
  onEditParticipante: (id: string) => void;
  onDeleteParticipante: (id: string, nombre: string) => void;
  currentUserId?: string; 
  currentUserRole?: 'Administrador' | 'Participante' | 'SuperAdmin'; 
  eventoId?: string; 
  adminId?: string;  
}

const ParticipantDrawer: React.FC<ParticipantDrawerProps> = ({ 
  isOpen, onClose, participantes, onEditParticipante, onDeleteParticipante, currentUserId, currentUserRole = 'Administrador',
  eventoId = 'demo-evento', adminId = 'demo-admin'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const participantesFiltrados = participantes.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const libresCount = participantes.filter(p => p.estado === 'Libre').length;
  const asignadosCount = participantes.filter(p => p.estado === 'Asignado').length;
  
  const canEdit = currentUserRole === 'Administrador' || currentUserRole === 'SuperAdmin';

  const handleCopyLink = (participanteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/p/${eventoId}/${adminId}/${participanteId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(participanteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsApp = (participante: ParticipanteExtendido, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!participante.telefono) return alert("Este participante no tiene número de teléfono registrado.");
    
    const numeroLimpio = participante.telefono.replace(/\D/g, '');
    const url = `${window.location.origin}/p/${eventoId}/${adminId}/${participante.id}`;
    const mensaje = `¡Hola ${participante.nombre}! 👋\n\nAquí tienes tu link de acceso único para elegir tus turnos en el evento:\n${url}\n\nPor favor, no compartas este link, es solo tuyo.`;
    
    window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleCopyInviteLink = () => {
    const url = `${window.location.origin}/invite/${eventoId}/${adminId}`;
    navigator.clipboard.writeText(`¡Hola! Únete al evento registrándote en este enlace:\n${url}`);
    alert("¡Link de invitación general copiado!");
  };

  const handleCopyAllLinks = () => {
    let textoMasivo = `📋 *Lista de Accesos Personales - Turnos*\n\n`;
    participantes.forEach(p => {
      textoMasivo += `• ${p.nombre}:\n  ${window.location.origin}/p/${eventoId}/${adminId}/${p.id}\n\n`;
    });
    navigator.clipboard.writeText(textoMasivo);
    alert("¡Lista copiada! Pégala en tu grupo o lista de difusión de WhatsApp.");
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />}

      <div className={`fixed inset-y-0 right-0 w-80 sm:w-[420px] bg-slate-50 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="bg-slate-800 p-5 flex flex-col gap-4 text-white shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-xl flex items-center gap-2"><Users size={22} className="text-blue-400" /> Directorio</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white"><X size={20} /></button>
          </div>
          
          <div className="flex gap-2 text-xs font-bold mb-1">
            <div className="flex-1 bg-slate-700 p-2 rounded-lg text-center shadow-inner border border-slate-600">
              <span className="text-emerald-400 block text-lg">{libresCount}</span> Libres
            </div>
            <div className="flex-1 bg-slate-700 p-2 rounded-lg text-center shadow-inner border border-slate-600">
              <span className="text-blue-400 block text-lg">{asignadosCount}</span> Ocupados
            </div>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl py-2 px-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400 transition"
            />
          </div>

          {canEdit && (
            <div className="flex flex-col gap-2 mt-2">
              <button onClick={handleCopyInviteLink} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold transition shadow-md">
                <UserPlus size={16} /> Copiar Link de Invitación General
              </button>
              <button onClick={handleCopyAllLinks} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-bold transition shadow-md">
                <Copy size={14} /> Copiar Todos los Links (Para Grupo)
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-100">
          {participantesFiltrados.length > 0 ? (
            participantesFiltrados.map((p) => {
              const esMiUsuario = p.id === currentUserId;
              const tieneTelefono = Boolean(p.telefono && p.telefono.trim().length > 7);
              
              return (
                <div key={p.id} className={`bg-white rounded-xl p-3 border shadow-sm transition-all ${esMiUsuario ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-sm text-slate-700 flex items-center gap-2 truncate pr-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.estado === 'Libre' ? 'bg-emerald-400 shadow-sm shadow-emerald-300' : 'bg-blue-400 shadow-sm shadow-blue-300'}`}></span>
                      {p.nombre} {esMiUsuario && <span className="text-xs text-blue-500 font-black">(Tú)</span>}
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      
                      {canEdit && (
                        <>
                          <button 
                            onClick={(e) => handleWhatsApp(p, e)}
                            className={`p-1.5 rounded-lg transition-all flex items-center justify-center w-8 h-8 ${tieneTelefono ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                            title={tieneTelefono ? "Enviar link por WhatsApp" : "No tiene teléfono registrado"}
                          >
                            <MessageCircle size={16} />
                          </button>

                          <button 
                            onClick={(e) => handleCopyLink(p.id, e)}
                            className={`p-1.5 rounded-lg transition-all flex items-center justify-center w-8 h-8 ${copiedId === p.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-200'}`}
                            title="Copiar Link"
                          >
                            {copiedId === p.id ? <CheckCircle size={16} /> : <Share2 size={16} />}
                          </button>
                        </>
                      )}

                      {/* AJUSTES: Visible para el Admin O para el propio dueño del usuario */}
                      {(canEdit || esMiUsuario) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEditParticipante(p.id); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition w-8 h-8 flex items-center justify-center"
                          title={esMiUsuario ? "Editar mi Perfil" : "Ver/Editar Perfil"}
                        >
                          <Settings size={16} />
                        </button>
                      )}

                      {canEdit && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteParticipante(p.id, p.nombre); }}
                          className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition w-8 h-8 flex items-center justify-center"
                          title="Eliminar Participante"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {p.estado === 'Asignado' && p.ubicaciones && p.ubicaciones.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {p.ubicaciones.map((ubi, index) => (
                        <p key={index} className="text-[11px] text-blue-600 font-bold ml-4 flex items-center gap-1 bg-blue-50/50 w-fit px-2 py-0.5 rounded-md border border-blue-100">
                          📍 {ubi}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10"><p className="text-slate-400 text-sm font-bold">No se encontraron resultados</p></div>
          )}
        </div>
      </div>
    </>
  );
};

export default ParticipantDrawer;
// src/components/ParticipantDrawer.tsx
import React, { useState } from 'react';
import { X, Users, Settings, Share2, CheckCircle, MessageCircle, Trash2, UserPlus, ChevronDown } from 'lucide-react';
import type { Participante } from '../types';
import { useToast } from './ToastProvider';

export interface ParticipanteExtendido extends Participante {
  telefono?: string;
  notas?: string;
  creador?: string; 
  capitanesInvolucrados?: string[]; 
}

interface ParticipantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  participantes: ParticipanteExtendido[]; 
  onEditParticipante: (id: string) => void;
  onDeleteParticipante: (id: string, nombre: string) => void;
  currentUserId?: string; 
  currentUserRole?: 'Administrador' | 'Participante' | 'SuperAdmin' | 'Capitan'; 
  eventoId?: string; 
  adminId?: string;  
  turnosLibresCount?: number;
  turnosOcupadosCount?: number;
  customInviteLink?: string; 
}

const ParticipantDrawer: React.FC<ParticipantDrawerProps> = ({ 
  isOpen, onClose, participantes, onEditParticipante, onDeleteParticipante, currentUserId, currentUserRole = 'Administrador',
  eventoId = 'demo-evento', adminId = 'demo-admin', customInviteLink
}) => {
 
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTermState, setSearchTermState] = useState('');
  
  const { showToast } = useToast();

  const participantesFiltrados = participantes
    .filter(p => p.nombre.toLowerCase().includes(searchTermState.toLowerCase().trim()))
    .sort((a, b) => {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      return a.nombre.localeCompare(b.nombre);
    });

  const canEdit = currentUserRole === 'Administrador' || currentUserRole === 'SuperAdmin' || currentUserRole === 'Capitan';

  const copiarSeguro = (texto: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = texto;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.prepend(textArea);
      textArea.select();
      try { document.execCommand('copy'); } catch (error) { console.error(error); } finally { textArea.remove(); }
    }
  };

  const handleCopyLink = (participanteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/p/${eventoId}/${adminId}/${participanteId}`;
    copiarSeguro(url);
    setCopiedId(participanteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsApp = (participante: ParticipanteExtendido, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!participante.telefono) { 
      showToast('Este participante no tiene número de teléfono registrado.', 'error'); 
      return; 
    }
    const numeroLimpio = participante.telefono.replace(/\D/g, '');
    const url = `${window.location.origin}/p/${eventoId}/${adminId}/${participante.id}`;
    const mensaje = `¡Hola ${participante.nombre}! 👋\n\nAquí tienes tu link de acceso único para elegir tus turnos en el evento:\n${url}\n\nPor favor, no compartas este link, es solo tuyo.`;
    window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleCopyInviteLink = () => {
    const baseGeneral = `${window.location.origin}/invite/${eventoId}/${adminId}`;
    const baseEquipo = `${window.location.origin}/invite-team/${eventoId}/${adminId}`;
    
    const url = customInviteLink ? `${baseEquipo}/${customInviteLink}` : baseGeneral;
    
    copiarSeguro(`¡Hola! Únete al evento registrándote en este enlace:\n${url}`);
    
    const mensajeToast = customInviteLink 
      ? '¡Link de invitación del equipo copiado!' 
      : '¡Link de invitación general copiado!';
      
    showToast(mensajeToast, 'success');
  };

  const toggleTurnos = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] transition-opacity" onClick={onClose} />}

      <div className={`fixed inset-y-0 right-0 w-80 sm:w-[420px] bg-slate-50 shadow-2xl z-[210] transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="bg-slate-800 p-5 flex flex-col gap-4 text-white shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-xl flex items-center gap-2">
              <Users size={22} className="text-blue-400" /> Directorio
            </h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={searchTermState}
              onChange={(e) => setSearchTermState(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl py-2 px-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400 transition"
            />
          </div>

          {canEdit && (
            <div className="flex flex-col gap-2 mt-2">
              <button onClick={handleCopyInviteLink} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold transition shadow-md">
                <UserPlus size={16} /> Copiar Link de Invitación
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-100">
          {participantesFiltrados.length > 0 ? (
            participantesFiltrados.map((p) => {
              const esMiUsuario = p.id === currentUserId;
              const tieneTelefono = Boolean(p.telefono && p.telefono.trim().length > 7);
              const isExpanded = expandedId === p.id;
              
              return (
                <div key={p.id} className={`bg-white rounded-xl p-3 border shadow-sm transition-all ${esMiUsuario ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex justify-between items-start">
                    
                    <div className="min-w-0 pr-2 flex-1">
                      <div className="font-bold text-sm text-slate-700 flex items-center gap-2 truncate">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.estado === 'Libre' ? 'bg-emerald-400 shadow-sm shadow-emerald-300' : 'bg-blue-400 shadow-sm shadow-blue-300'}`}></span>
                        <span className="truncate">{p.nombre}</span>
                        {esMiUsuario && <span className="text-xs text-blue-500 font-black shrink-0">(Tú)</span>}
                      </div>

                      {currentUserRole !== 'Participante' && (
                        <div className="flex flex-wrap gap-1.5 mt-2 ml-4">
                          {p.creador === 'Admin' && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                              Creado por Admin
                            </span>
                          )}

                          {currentUserRole === 'Administrador' && p.capitanesInvolucrados && p.capitanesInvolucrados.map((capNombre, idx) => (
                            <span key={idx} className="text-[9px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                              Capitán: {capNombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Aquí hacemos la validación estricta para que solo Capitanes vean los enlaces */}
                      {currentUserRole === 'Capitan' && (
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

                      {(canEdit || esMiUsuario) && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onEditParticipante(p.id); 
                            onClose(); 
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition w-8 h-8 flex items-center justify-center"
                          title={esMiUsuario ? "Editar mi Perfil" : "Ver/Editar Perfil"}
                        >
                          <Settings size={16} />
                        </button>
                      )}

                      {canEdit && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onDeleteParticipante(p.id, p.nombre); 
                            onClose(); 
                          }}
                          className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition w-8 h-8 flex items-center justify-center"
                          title="Eliminar Participante"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {p.estado === 'Asignado' && p.ubicaciones && p.ubicaciones.length > 0 && (
                    <div className="mt-3 ml-4">
                      <button 
                        onClick={(e) => toggleTurnos(p.id, e)}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <ChevronDown size={14} className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        {isExpanded ? 'Ocultar Turnos' : `Ver Turnos (${p.ubicaciones.length})`}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
                          {p.ubicaciones.map((ubi, index) => (
                            <p key={index} className="text-[11px] text-blue-700 font-bold flex items-center gap-1.5 bg-blue-50/70 w-fit px-2.5 py-1 rounded-md border border-blue-100/50">
                              📍 {ubi}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm font-bold">No se encontraron resultados</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ParticipantDrawer;
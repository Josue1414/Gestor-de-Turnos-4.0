// src/views/User/ParticipantPanel.tsx
import { useState, useEffect } from 'react';
import { Calendar, Users, ShieldCheck, Settings, LayoutList, LayoutGrid, Bell, Smartphone } from 'lucide-react';

import MatrizTurnosParticipante from '../../components/MatrizTurnosParticipante';
import VistaTarjetasCajas from '../../components/VistaTarjetasCajas';
import ModalInfoUsuario from '../../components/ModalInfoUsuario';
import ParticipantDrawer from '../../components/ParticipantDrawer';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import CroquisModal from '../../components/CroquisModal';
import InstallGuideModal from '../../components/InstallGuideModal';
import ModalPedirAyuda, { type ContactoAyuda } from '../../components/ModalPedirAyuda'; // <-- NUEVO
import EventoFinalizadoScreen from '../../components/EventoFinalizadoScreen';

import { useParticipantLogic } from './useParticipantLogic';

const ParticipantPanel = () => {
  const {
    eventoId, adminId, loading, dias, participantes, eventoNombre,
    diaActivo, setDiaActivo, vistaTarjetas, setVistaTarjetas,
    downloadModal, setDownloadModal, showDirectorio, setShowDirectorio,
    showCroquis, setShowCroquis, isUsuarioModalOpen, setIsUsuarioModalOpen,
    miUsuario, participantesDirectorio,
    datosParaModal, diaActual, turnosLibresCount, turnosOcupadosCount,
    croquisDataParaMostrar, handleGuardarPerfilAjustado, isBusy,
    handleAsignarme, handleQuitarme,
    adminContacto, turnoAlertaInfo, handleSolicitarAsistencia, motivoSalida
  } = useParticipantLogic();

  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  
  // NUEVO: Estado para abrir el modal del Centro de Ayuda
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (deferredPrompt as any).prompt();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { outcome } = await (deferredPrompt as any).userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  if (motivoSalida) {
    return (
      <EventoFinalizadoScreen
        motivo={motivoSalida}
        eventoNombre={eventoNombre}
        contacto={{ nombre: adminContacto.nombre, telefono: adminContacto.telefono }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
        <ShieldCheck size={48} className="text-blue-500 animate-pulse mb-4" />
        <h2 className="text-xl font-black text-slate-700">Cargando evento...</h2>
      </div>
    );
  }

  if (!miUsuario || !eventoId || !adminId) {
    return (
      <EventoFinalizadoScreen
        motivo="sin-acceso"
        eventoNombre={eventoNombre}
        contacto={{ nombre: adminContacto.nombre, telefono: adminContacto.telefono }}
      />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeHandleAsignarme = (cajaId: string, turnoOrId: any) => {
    const tId = typeof turnoOrId === 'string' ? turnoOrId : turnoOrId?.id;
    if (tId) handleAsignarme(cajaId, tId);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeHandleQuitarme = (cajaId: string, turnoOrId: any) => {
    const tId = typeof turnoOrId === 'string' ? turnoOrId : turnoOrId?.id;
    if (tId) handleQuitarme(cajaId, tId);
  };

  // PREPARAR CONTACTOS DE WHATSAPP PARA EL MODAL DE AYUDA Y VISTAS
  const contactosAyuda: ContactoAyuda[] = [];
  if (miUsuario.capitanNombre && miUsuario.capitanTelefono) {
    contactosAyuda.push({ nombre: miUsuario.capitanNombre, telefono: miUsuario.capitanTelefono, rol: 'Capitán' });
  }
  if (adminContacto.nombre && adminContacto.telefono) {
    contactosAyuda.push({ nombre: adminContacto.nombre, telefono: adminContacto.telefono, rol: 'Admin' });
  }

  return (
    <div className="h-[100dvh] w-full bg-slate-100 font-sans flex flex-col overflow-auto relative">
      
      <div className="sticky left-0 w-[100vw] max-w-[100vw] px-2 sm:px-6 pt-2 sm:pt-6 pb-2 shrink-0 z-10 box-border">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-200 w-full max-w-[1400px] mx-auto gap-4">
          
          <div className="flex items-start gap-3 w-full sm:w-auto">
            <div className="min-w-0 flex flex-col items-start gap-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none truncate">
                Hola, <span className="text-blue-600">{miUsuario.nombre}</span>
              </h1>
              <p className="text-sm sm:text-base font-black text-slate-800 truncate leading-none">{eventoNombre}</p>
              {miUsuario.capitanNombre && (
                <span className="inline-flex items-center text-[10px] sm:text-xs font-black bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-lg w-fit uppercase tracking-wider shadow-sm mt-0.5">
                  Equipo de {miUsuario.capitanNombre}
                </span>
              )}
            </div>
          </div>

          {/* BOTÓN PEDIR AYUDA (MÓVIL) */}
          {turnoAlertaInfo && (
            <div className="w-full sm:hidden mt-1">
              <button
                onClick={() => setShowHelpModal(true)}
                className={`w-full p-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition shadow-sm border
                  ${turnoAlertaInfo.solicitaAsistencia
                    ? turnoAlertaInfo.tipoAsistencia === 'peligro' ? 'bg-red-500 hover:bg-red-600 text-white border-red-600 animate-pulse' : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600 animate-pulse'
                    : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                  }`}
              >
                <Bell size={18} className="w-5 h-5" />
                <span>
                  {turnoAlertaInfo.solicitaAsistencia ? 'Gestionar Alerta' : 'Centro de Ayuda'}
                </span>
              </button>
            </div>
          )}

          <div className="w-full h-px bg-slate-200 sm:hidden my-1"></div>

          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
            <button 
              onClick={handleInstallClick} 
              className="bg-slate-800 border border-slate-800 text-white p-2 sm:px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm hover:bg-slate-700"
            >
              <Smartphone size={16} className="w-4 h-4" /> <span>Instalar App</span>
            </button>

            <button onClick={() => setShowCroquis(true)} className="bg-slate-50 border border-slate-200 text-slate-700 p-2 sm:px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm hover:bg-slate-100">
              📍 <span>Croquis</span>
            </button>
            
            <button onClick={() => setShowDirectorio(true)} className="bg-blue-50 border border-blue-200 text-blue-700 p-2 sm:px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition shadow-sm">
              <Users size={16} className="w-4 h-4" /> <span>Participantes ({participantesDirectorio.length})</span>
            </button>

            <button onClick={() => setIsUsuarioModalOpen(true)} className="bg-indigo-50 text-indigo-700 p-2 sm:px-3 border border-indigo-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-100 transition shadow-sm">
               <Settings size={16} className="w-4 h-4" /> <span>Mi Perfil</span>
            </button>

            {/* BOTÓN PEDIR AYUDA (ESCRITORIO) */}
            {turnoAlertaInfo && (
              <button
                onClick={() => setShowHelpModal(true)}
                className={`hidden sm:flex p-2 px-3 rounded-xl text-[11px] font-bold items-center justify-center gap-1.5 transition shadow-sm border
                  ${turnoAlertaInfo.solicitaAsistencia
                    ? turnoAlertaInfo.tipoAsistencia === 'peligro' ? 'bg-red-500 hover:bg-red-600 text-white border-red-600 animate-pulse' : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600 animate-pulse'
                    : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                  }`}
              >
                <Bell size={16} className="w-4 h-4" />
                <span>
                  {turnoAlertaInfo.solicitaAsistencia ? 'Gestionar Alerta' : 'Centro de Ayuda'}
                </span>
              </button>
            )}
          </div>
        </header>
      </div>

      <div className="sticky top-0 left-0 z-50 w-[100vw] max-w-[100vw] bg-slate-100 h-[60px] flex items-center shadow-sm border-b border-slate-200 px-2 sm:px-6 shrink-0 box-border mt-1 sm:mt-0">
        <div className="w-full max-w-[1400px] mx-auto flex gap-2 overflow-x-auto no-scrollbar items-center h-full px-1">
          {dias.length > 0 ? (
            dias.map((dia, idx) => (
              <button 
                key={dia.id} 
                onClick={() => setDiaActivo(idx)} 
                className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 ${diaActivo === idx ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 text-[10px]'}`}
              >
                <Calendar size={14} /> {dia.nombreDia}
              </button>
            ))
          ) : (
            <span className="text-slate-400 text-sm font-bold px-2">No hay días disponibles para tu equipo</span>
          )}
        </div>
      </div>

      <div className={`px-2 sm:px-6 pb-10 flex flex-col z-0 mx-auto ${vistaTarjetas ? 'w-full max-w-[1400px]' : 'w-max min-w-[100vw]'}`}>
        
        <div className="w-full max-w-[1400px] mt-2 mb-4 flex justify-start">
          <div className="bg-slate-200/70 p-1 rounded-xl flex items-center">
            <button 
              onClick={() => setVistaTarjetas(false)} 
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${!vistaTarjetas ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutList size={16} /> Tabla
            </button>
            <button 
              onClick={() => setVistaTarjetas(true)} 
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${vistaTarjetas ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={16} /> Tarjetas
            </button>
          </div>
        </div>

        {diaActual ? (() => {
          return vistaTarjetas ? (
            <VistaTarjetasCajas 
              diaActual={diaActual} 
              getParticipante={(id) => participantes.find(p => p.id === id)}
              miUsuarioId={miUsuario.id} 
              isBusy={isBusy}
              onAsignar={(c, _cn, t, _h) => safeHandleAsignarme(c, t)} 
              onQuitar={(c, t, _pid) => safeHandleQuitarme(c, t)} 
              onCrearCaja={() => {}} onDeleteCaja={() => {}} onDeleteHorario={() => {}} onEditCaja={() => {}} onEditHorario={() => {}} onDeleteTurnoEspecial={() => {}} onEditTurnoEspecial={() => {}}
              adminPerms={{ cajas: false, horarios: false, especiales: false }}
              onActualizarEstadoTurno={() => {}} 
              contactosWhatsApp={contactosAyuda}
            />
          ) : (
            <MatrizTurnosParticipante 
              diaActual={diaActual} 
              getParticipante={(id) => participantes.find(p => p.id === id)} 
              miUsuarioId={miUsuario.id} 
              onAsignarme={safeHandleAsignarme} 
              onQuitarme={safeHandleQuitarme} 
              contactosWhatsApp={contactosAyuda}
            />
          )
        })() : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 mt-10 w-full">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p className="font-bold">Aún no hay días configurados para ti.</p>
          </div>
        )}
      </div>

      <ParticipantDrawer 
        isOpen={showDirectorio} onClose={() => setShowDirectorio(false)} participantes={participantesDirectorio} currentUserId={miUsuario.id} currentUserRole="Participante" onEditParticipante={(id) => { if (id === miUsuario.id) setIsUsuarioModalOpen(true); }} onDeleteParticipante={() => {}} eventoId={eventoId} adminId={adminId} turnosLibresCount={turnosLibresCount} turnosOcupadosCount={turnosOcupadosCount}
      />

      <ModalInfoUsuario 
        isOpen={isUsuarioModalOpen} onClose={() => setIsUsuarioModalOpen(false)} data={datosParaModal} isViewingSelf={true} currentUserRole="Participante" onSave={handleGuardarPerfilAjustado} onDownloadImage={() => setDownloadModal(true)} 
      />

      <DownloadScheduleModal 
        isOpen={downloadModal} onClose={() => setDownloadModal(false)} type="personal" seccionName="Mis Accesos" dias={dias} diaActivo={diaActivo} participantes={participantes} targetUserId={miUsuario.id} 
      />

      <CroquisModal 
        isOpen={showCroquis} onClose={() => setShowCroquis(false)} canEdit={false} croquis={croquisDataParaMostrar} onSaveCroquis={async () => Promise.resolve()} participantes={participantes} dias={dias} diaActivo={diaActivo} currentUserRole="Participante" 
      />

      <InstallGuideModal isOpen={showInstallGuide} onClose={() => setShowInstallGuide(false)} />
      
      {/* EL MODAL DEL CENTRO DE AYUDA */}
      <ModalPedirAyuda 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)}
        contactos={contactosAyuda}
        alertaActiva={turnoAlertaInfo?.solicitaAsistencia || false}
        tipoAlertaActiva={turnoAlertaInfo?.tipoAsistencia}
        onSolicitar={(tipo) => {
          handleSolicitarAsistencia(true, tipo);
          setShowHelpModal(false);
        }}
        onCancelar={() => {
          handleSolicitarAsistencia(false);
          setShowHelpModal(false);
        }}
      />
      
    </div>
  );
};

export default ParticipantPanel;
// src/views/User/ParticipantPanel.tsx
import { Calendar, Users, ShieldCheck, LogOut, Settings, LayoutList, LayoutGrid } from 'lucide-react';

import MatrizTurnosParticipante from '../../components/MatrizTurnosParticipante';
import VistaTarjetasCajas from '../../components/VistaTarjetasCajas';
import ModalInfoUsuario from '../../components/ModalInfoUsuario';
import ParticipantDrawer from '../../components/ParticipantDrawer';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import CroquisModal from '../../components/CroquisModal';

// Importamos nuestro nuevo "cerebro"
import { useParticipantLogic } from './useParticipantLogic';

const ParticipantPanel = () => {
  // Extraemos toda la lógica y datos desde nuestro hook
  const {
    eventoId, adminId, loading, dias, participantes, eventoNombre,
    diaActivo, setDiaActivo, vistaTarjetas, setVistaTarjetas,
    downloadModal, setDownloadModal, showDirectorio, setShowDirectorio,
    showCroquis, setShowCroquis, isUsuarioModalOpen, setIsUsuarioModalOpen,
    showLogoutConfirm, setShowLogoutConfirm, miUsuario, participantesDirectorio,
    datosParaModal, diaActual, turnosLibresCount, turnosOcupadosCount,
    croquisDataParaMostrar, handleGuardarPerfilAjustado, isBusy,
    handleAsignarme, handleQuitarme, handleLogout
  } = useParticipantLogic();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
        <ShieldCheck size={48} className="text-blue-500 animate-pulse mb-4" />
        <h2 className="text-xl font-black text-slate-700">Cargando evento...</h2>
      </div>
    );
  }

  if (!miUsuario || !eventoId || !adminId) return null;

  return (
    <div className="h-[100dvh] w-full bg-slate-100 font-sans flex flex-col overflow-auto relative">
      
      <div className="sticky left-0 w-[100vw] max-w-[100vw] px-2 sm:px-6 pt-2 sm:pt-6 pb-2 shrink-0 z-10 box-border">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 w-full max-w-[1400px] mx-auto gap-4">
          
          <div className="flex items-center gap-3 w-full sm:w-auto border-b border-slate-100 pb-3 sm:border-none sm:pb-0">
            <button 
              onClick={() => setShowLogoutConfirm(true)} 
              className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 p-2 sm:px-3 rounded-xl text-[11px] font-bold shadow-sm transition flex items-center justify-center gap-1.5 shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut size={16} className="w-4 h-4" /> <span className="hidden sm:inline">Salir</span>
            </button>

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <div className="min-w-0 flex flex-col items-start">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight mb-1 truncate">
                Hola, <span className="text-blue-600">{miUsuario.nombre}</span>
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-0.5">
                <p className="text-sm sm:text-base font-black text-slate-800 truncate">{eventoNombre}</p>
                {miUsuario.capitanNombre && (
                  <span className="inline-flex items-center text-[11px] sm:text-sm font-black bg-amber-100 text-amber-700 border border-amber-300 px-2.5 py-1 rounded-lg w-fit uppercase tracking-wider shadow-sm">
                    Equipo de {miUsuario.capitanNombre}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
            <button onClick={() => setShowCroquis(true)} className="bg-slate-50 border border-slate-200 text-slate-700 p-2 sm:px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm hover:bg-slate-100">
              📍 <span className="hidden sm:inline">Croquis</span>
            </button>
            
            <button onClick={() => setShowDirectorio(true)} className="bg-blue-50 border border-blue-200 text-blue-700 p-2 sm:px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition shadow-sm">
              <Users size={16} className="w-4 h-4" /> <span className="hidden sm:inline">Directorio ({participantesDirectorio.length})</span>
            </button>

            <button onClick={() => setIsUsuarioModalOpen(true)} className="bg-indigo-50 text-indigo-700 p-2 sm:px-3 border border-indigo-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-100 transition shadow-sm">
               <Settings size={16} className="w-4 h-4" /> Mi Perfil
            </button>
          </div>
        </header>
      </div>

      <div className="sticky top-0 left-0 z-50 w-[100vw] max-w-[100vw] bg-slate-100 h-[60px] flex items-center shadow-sm border-b border-slate-200 px-2 sm:px-6 shrink-0 box-border">
        <div className="w-full max-w-[1400px] mx-auto flex gap-2 overflow-x-auto no-scrollbar items-center h-full px-1">
          {dias.map((dia, idx) => (
            <button key={dia.id} onClick={() => setDiaActivo(idx)} className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 ${diaActivo === idx ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 text-[10px]'}`}>
              <Calendar size={14} /> {dia.nombreDia}
            </button>
          ))}
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

        {diaActual ? (
          vistaTarjetas ? (
            <VistaTarjetasCajas 
              diaActual={diaActual} 
              getParticipante={(id) => participantes.find(p => p.id === id)}
              miUsuarioId={miUsuario.id} 
              isBusy={isBusy}
              onAsignar={(c, _cn, t, _h) => handleAsignarme(c, t)} 
              onQuitar={handleQuitarme} 
              onCrearCaja={() => {}} onDeleteCaja={() => {}} onDeleteHorario={() => {}} onEditCaja={() => {}} onEditHorario={() => {}} onDeleteTurnoEspecial={() => {}} onEditTurnoEspecial={() => {}}
              adminPerms={{ cajas: false, horarios: false, especiales: false }}
              onActualizarEstadoTurno={() => {}} // <--- SOLUCIÓN AQUÍ
            />
          ) : (
            <MatrizTurnosParticipante 
              diaActual={diaActual} 
              getParticipante={(id) => participantes.find(p => p.id === id)} 
              miUsuarioId={miUsuario.id} 
              onAsignarme={handleAsignarme} 
              onQuitarme={handleQuitarme} 
            />
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 mt-10 w-full">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p className="font-bold">Aún no hay días configurados para ti.</p>
          </div>
        )}
      </div>

      <ParticipantDrawer 
        isOpen={showDirectorio} 
        onClose={() => setShowDirectorio(false)} 
        participantes={participantesDirectorio} 
        currentUserId={miUsuario.id} 
        currentUserRole="Participante" 
        onEditParticipante={(id) => { if (id === miUsuario.id) setIsUsuarioModalOpen(true); }}
        onDeleteParticipante={() => {}} 
        eventoId={eventoId} adminId={adminId}
        turnosLibresCount={turnosLibresCount} turnosOcupadosCount={turnosOcupadosCount}
      />

      <ModalInfoUsuario 
        isOpen={isUsuarioModalOpen} 
        onClose={() => setIsUsuarioModalOpen(false)} 
        data={datosParaModal} 
        isViewingSelf={true} 
        currentUserRole="Participante" 
        onSave={handleGuardarPerfilAjustado} 
        onDownloadImage={() => setDownloadModal(true)} 
      />

      <DownloadScheduleModal 
        isOpen={downloadModal} onClose={() => setDownloadModal(false)} type="personal" 
        seccionName="Mis Accesos" dias={dias} diaActivo={diaActivo} participantes={participantes} targetUserId={miUsuario.id} 
      />

      <CroquisModal isOpen={showCroquis} onClose={() => setShowCroquis(false)} canEdit={false} croquis={croquisDataParaMostrar} onSaveCroquis={async () => Promise.resolve()}/>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-inner border border-red-100">
              <LogOut size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">¿Cerrar Sesión?</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Estás a punto de salir de tu cuenta. Tendrás que volver a ingresar con tu fecha de nacimiento.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition">Cancelar</button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black shadow-md hover:bg-red-600 transition">Sí, salir</button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ParticipantPanel;
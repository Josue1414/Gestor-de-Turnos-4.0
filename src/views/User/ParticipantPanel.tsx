import { useState, } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Map as MapIcon, Settings, Users, Star, CheckCircle, Bird, ShieldCheck, LogOut } from 'lucide-react';
import type { DiaEvento, Participante } from '../../types';
import MatrizTurnosParticipante from '../../components/MatrizTurnosParticipante';
import ModalInfoUsuario from '../../components/ModalInfoUsuario';
import ParticipantDrawer from '../../components/ParticipantDrawer';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import CroquisModal from '../../components/CroquisModal';

type PerfilUsuario = {
  id: string;
  name: string;
  role: 'Participante' | 'Administrador' | 'SuperAdmin';
  phone: string;
  supportArea: string;
  notes: string;
  organizationLabel?: string;
  organization?: string;
};

const ParticipantPanel = () => {
  const navigate = useNavigate();
  const [diaActivo, setDiaActivo] = useState(0);
  const [downloadModal, setDownloadModal] = useState(false);
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [showDirectorio, setShowDirectorio] = useState(false);
  const [showCroquis, setShowCroquis] = useState(false);

  // Perfil inicial vacío (Se llenará con Firebase luego)
  const [misDatosParticipante, setMisDatosParticipante] = useState<PerfilUsuario>({
    id: '', name: 'Cargando Usuario...', role: 'Participante', phone: '',
    supportArea: '', notes: '', organizationLabel: 'Organización', organization: ''
  });

  // Listas vacías (Se llenarán con Firebase luego)
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [dias, setDias] = useState<DiaEvento[]>([]);

  // TODO: Aquí irá el useEffect de Firebase onSnapshot próximamente

  const diaActual = dias[diaActivo];

  // Pantalla de carga mientras no haya días configurados
  if (!diaActual) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck size={48} className="text-slate-300 mb-4 animate-pulse" />
        <h2 className="text-xl font-black text-slate-700">Cargando Evento...</h2>
        <p className="text-sm text-slate-500 mt-2">Conectando con la base de datos.</p>
        <button onClick={() => navigate('/')} className="mt-6 px-4 py-2 bg-slate-200 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-300 transition">Volver al Inicio</button>
      </div>
    );
  }

  const participantesEnriquecidos = participantes.map(p => {
    const ubicaciones: string[] = [];
    diaActual.cajas.forEach(caja => {
      caja.turnos.forEach(turno => {
        if (turno.participanteId === p.id) ubicaciones.push(`${caja.nombre} - ${turno.horario}`);
      });
    });
    return { ...p, estado: ubicaciones.length > 0 ? 'Asignado' : 'Libre', ubicaciones } as Participante;
  });

  const getParticipante = (id: string | null) => participantesEnriquecidos.find(p => p.id === id);

  const totalMisTurnosGlobales = dias.reduce((accDia, dia) => 
    accDia + dia.cajas.reduce((accCaja, caja) => 
      accCaja + caja.turnos.filter(t => t.participanteId === misDatosParticipante.id).length, 0
    ), 0
  );

  const misTurnosHoy = diaActual.cajas.reduce((acc, caja) => acc + caja.turnos.filter(t => t.participanteId === misDatosParticipante.id).length, 0);
  const libresHoy = diaActual.cajas.reduce((acc, caja) => acc + caja.turnos.filter(t => t.participanteId === null).length, 0);

  const handleAsignarme = (cajaId: string, turnoId: string) => {
    const nuevosDias = [...dias]; const caja = nuevosDias[diaActivo].cajas.find(c => c.id === cajaId);
    if (caja) {
      const turno = caja.turnos.find(t => t.id === turnoId);
      if (turno && turno.participanteId === null) { turno.participanteId = misDatosParticipante.id; setDias(nuevosDias); }
    }
  };

  const handleQuitarme = (cajaId: string, turnoId: string) => {
    const nuevosDias = [...dias]; const caja = nuevosDias[diaActivo].cajas.find(c => c.id === cajaId);
    if (caja) {
      const turno = caja.turnos.find(t => t.id === turnoId);
      if (turno && turno.participanteId === misDatosParticipante.id) { turno.participanteId = null; setDias(nuevosDias); }
    }
  };

  const handleGuardarPerfil = (datosActualizados: PerfilUsuario) => {
    setMisDatosParticipante(datosActualizados);
    setParticipantes(prev => prev.map(p => p.id === datosActualizados.id ? { ...p, nombre: datosActualizados.name } : p));
    setIsUsuarioModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    navigate('/');
  };

  const datosParaModal = { ...misDatosParticipante, supportArea: getParticipante(misDatosParticipante.id)?.ubicaciones?.join(', ') || 'Sin área asignada' };

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-6 font-sans flex flex-col h-screen relative">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4 shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
            VISTA DE: <span className="text-blue-600">{misDatosParticipante.name}</span>
          </h1>
          <div className="mt-2 flex items-center">
            <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-full text-xs font-black shadow-sm flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldCheck size={16} /> Total Asignado: {totalMisTurnosGlobales} Turno(s)
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="hidden sm:block text-right mr-2">
            <p className="text-sm font-bold text-slate-800">{misDatosParticipante.organization || 'Sin Organización'}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{misDatosParticipante.organizationLabel}</p>
          </div>
          <button onClick={() => setIsUsuarioModalOpen(true)} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition border border-slate-200 shadow-sm" title="Ajustes de Perfil"><Settings size={20} /></button>
          <button onClick={handleLogout} className="p-3 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition border border-slate-200 hover:border-red-200 shadow-sm" title="Cerrar Sesión"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
        {dias.map((dia, idx) => (
          <button key={dia.id} onClick={() => setDiaActivo(idx)} className={`px-5 py-2 rounded-xl font-bold transition whitespace-nowrap ${diaActivo === idx ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            <Calendar size={16} /> {dia.nombreDia}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center shrink-0 gap-4">
          
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-slate-500">Selecciona los horarios en los que deseas apoyar.</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Bird size={14} className="text-blue-500" /> {libresHoy} Turnos Libres Hoy
              </span>
              <span className={`border px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm ${misTurnosHoy > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                {misTurnosHoy > 0 ? <CheckCircle size={14} /> : <Star size={14} />} 
                {misTurnosHoy > 0 ? `Participas en ${misTurnosHoy} turno(s) HOY` : 'Aún no participas HOY'}
              </span>
            </div>
          </div>

          <div className="flex gap-2 w-full lg:w-auto">
             <button onClick={() => setShowCroquis(true)} className="flex-1 lg:flex-none bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition hover:bg-slate-50 shadow-sm"><MapIcon size={16} className="text-indigo-500" /> Croquis</button>
             <button onClick={() => setShowDirectorio(true)} className="flex-1 lg:flex-none bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition hover:bg-slate-700 shadow-md"><Users size={16} /> Participantes</button>
          </div>
        </div>

        <MatrizTurnosParticipante diaActual={diaActual} getParticipante={getParticipante} miUsuarioId={misDatosParticipante.id} onAsignarme={handleAsignarme} onQuitarme={handleQuitarme} />
      </div>

      <ParticipantDrawer isOpen={showDirectorio} onClose={() => setShowDirectorio(false)} participantes={participantesEnriquecidos} currentUserId={misDatosParticipante.id} currentUserRole="Participante" onEditParticipante={(id) => { if (id === misDatosParticipante.id) setIsUsuarioModalOpen(true); }} />

      <ModalInfoUsuario isOpen={isUsuarioModalOpen} onClose={() => setIsUsuarioModalOpen(false)} data={datosParaModal} isViewingSelf={true} currentUserRole="Participante" onSave={handleGuardarPerfil} onDownloadImage={() => setDownloadModal(true)} />

      <DownloadScheduleModal isOpen={downloadModal} onClose={() => setDownloadModal(false)} type="personal" seccionName="Accesos Principales" dias={dias} diaActivo={diaActivo} participantes={participantesEnriquecidos} targetUserId={misDatosParticipante.id} />
      
      <CroquisModal isOpen={showCroquis} onClose={() => setShowCroquis(false)} isAdmin={false} />
    </div>
  );
};

export default ParticipantPanel;
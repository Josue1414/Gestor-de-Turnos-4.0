import { useState, useEffect } from 'react';
import { Calendar, Map as MapIcon, Settings, Users, Star, CheckCircle, Bird, ShieldCheck } from 'lucide-react';
import type { DiaEvento, Participante } from '../../types';
import MatrizTurnosParticipante from '../../components/MatrizTurnosParticipante';
import ModalInfoUsuario from '../../components/ModalInfoUsuario';
import ParticipantDrawer from '../../components/ParticipantDrawer';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import CroquisModal from '../../components/CroquisModal';

// Creamos un "tipo" específico para los datos de tu perfil en lugar de usar "any"
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
  const [diaActivo, setDiaActivo] = useState(0);
  const [downloadModal, setDownloadModal] = useState(false);
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [showDirectorio, setShowDirectorio] = useState(false);
  const [showCroquis, setShowCroquis] = useState(false);

  const [misDatosParticipante, setMisDatosParticipante] = useState<PerfilUsuario>({
    id: 'p2', name: 'Juan Pérez', role: 'Participante', phone: '+52 899 111 2222',
    supportArea: '', notes: 'Llegaré 10 mins tarde el viernes.', organizationLabel: 'Congregación', organization: 'Centro Sur'
  });

  // --- BASE DE DATOS SIMULADA CONECTADA A LOCALSTORAGE ---
  const [participantes, setParticipantes] = useState<Participante[]>(() => {
    const guardados = localStorage.getItem('gestor_participantes');
    if (guardados) return JSON.parse(guardados);
    return [
      { id: 'p1', nombre: 'Roberto Sánchez', linkUnico: '...', estado: 'Libre' },
      { id: 'p2', nombre: 'Juan Pérez', linkUnico: '...', estado: 'Libre' },
      { id: 'p3', nombre: 'Sofía Martínez', linkUnico: '...', estado: 'Libre' },
      { id: 'p4', nombre: 'María López', linkUnico: '...', estado: 'Libre' },
    ];
  });

  const [dias, setDias] = useState<DiaEvento[]>(() => {
    const guardados = localStorage.getItem('gestor_dias');
    if (guardados) return JSON.parse(guardados);
    return [
      {
        id: 'd1', fecha: '2026-03-15', nombreDia: 'Viernes 15',
        horariosMaestros: ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00'],
        cajas: [
          { id: 'c1', nombre: 'Caja 1', turnos: [{ id: 't1', horario: '08:00 - 10:00', participanteId: 'p2' }, { id: 't2', horario: '10:00 - 12:00', participanteId: null }, { id: 't2b', horario: '12:00 - 14:00', participanteId: 'CERRADO' }, { id: 't2c', horario: '14:00 - 16:00', participanteId: null }] },
          { id: 'c2', nombre: 'Caja 2', turnos: [{ id: 't3', horario: '08:00 - 10:00', participanteId: 'p4' }, { id: 't4', horario: '10:00 - 12:00', participanteId: 'p2' }, { id: 't4b', horario: '12:00 - 14:00', participanteId: null }, { id: 't4c', horario: '14:00 - 16:00', participanteId: null }] },
          // Quitamos el "as any"
          { id: 'spec1', nombre: 'Staff VIP', esEspecial: true, turnos: [{ id: 'ts1', horario: '08:00 - 16:00', participanteId: 'p1' }] } 
        ]
      },
      {
        id: 'd2', fecha: '2026-03-16', nombreDia: 'Sábado 16',
        horariosMaestros: ['09:00 - 11:00', '11:00 - 13:00', '13:00 - 15:00'],
        cajas: [
          { id: 'c3', nombre: 'Caja 1', turnos: [{ id: 't5', horario: '09:00 - 11:00', participanteId: 'p2' }, { id: 't6', horario: '11:00 - 13:00', participanteId: 'p1' }, { id: 't7', horario: '13:00 - 15:00', participanteId: null }] },
          { id: 'c4', nombre: 'Caja 2', turnos: [{ id: 't9', horario: '09:00 - 11:00', participanteId: null }, { id: 't10', horario: '11:00 - 13:00', participanteId: 'p3' }, { id: 't11', horario: '13:00 - 15:00', participanteId: 'p4' }] }
        ]
      },
      {
        id: 'd3', fecha: '2026-03-17', nombreDia: 'Domingo 17',
        horariosMaestros: ['10:00 - 12:00', '12:00 - 14:00'],
        cajas: [
          { id: 'c5', nombre: 'Caja Principal', turnos: [{ id: 't13', horario: '10:00 - 12:00', participanteId: 'p2' }, { id: 't14', horario: '12:00 - 14:00', participanteId: null }] },
          // Quitamos el "as any"
          { id: 'spec2', nombre: 'Estacionamiento', esEspecial: true, turnos: [{ id: 'ts2', horario: '09:00 - 15:00', participanteId: 'p3' }] } 
        ]
      }
    ];
  });

  // Guardar en disco cada que haya un cambio
  useEffect(() => { localStorage.setItem('gestor_participantes', JSON.stringify(participantes)); }, [participantes]);
  useEffect(() => { localStorage.setItem('gestor_dias', JSON.stringify(dias)); }, [dias]);

  const diaActual = dias[diaActivo];

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

  // --- NUEVA ETIQUETA GLOBAL ---
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

  // Reemplazamos el "any" por el tipo PerfilUsuario
  const handleGuardarPerfil = (datosActualizados: PerfilUsuario) => {
    setMisDatosParticipante(datosActualizados);
    setParticipantes(prev => prev.map(p => p.id === datosActualizados.id ? { ...p, nombre: datosActualizados.name } : p));
    setIsUsuarioModalOpen(false);
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
          <button onClick={() => setIsUsuarioModalOpen(true)} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition border border-slate-200 shadow-sm"><Settings size={20} /></button>
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
      
      <CroquisModal 
        isOpen={showCroquis} 
        onClose={() => setShowCroquis(false)} 
        isAdmin={false} 
      />
    
    </div>
  );
};

export default ParticipantPanel;
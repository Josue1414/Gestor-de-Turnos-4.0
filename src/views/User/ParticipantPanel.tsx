import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Users, ShieldCheck, LogOut } from 'lucide-react';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

import type { DiaEvento, Participante } from '../../types';

import MatrizTurnosParticipante from '../../components/MatrizTurnosParticipante';
import ModalInfoUsuario, { type UsuarioModalData } from '../../components/ModalInfoUsuario';
import ParticipantDrawer from '../../components/ParticipantDrawer';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import CroquisModal from '../../components/CroquisModal';

interface ParticipanteExtendidoDb extends Participante {
  telefono?: string;
  codigoPais?: string;
  notas?: string;
  organizacion?: string;
  organizationLabel?: string;
  ubicaciones?: string[];
}

const ParticipantPanel = () => {
  const { eventoId, adminId, participanteId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState<DiaEvento[]>([]);
  const [participantes, setParticipantes] = useState<ParticipanteExtendidoDb[]>([]);
  const [eventoNombre, setEventoNombre] = useState('Evento');
  
  const [diaActivo, setDiaActivo] = useState(0);
  const [downloadModal, setDownloadModal] = useState(false);
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [showDirectorio, setShowDirectorio] = useState(false);
  const [showCroquis, setShowCroquis] = useState(false);

  useEffect(() => {
    if (!eventoId || !adminId) return;

    const docRef = doc(db, 'eventos', eventoId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEventoNombre(data.nombre || 'Evento');
        
        setDias(data.diasPorAdmin?.[adminId] || []);
        setParticipantes(data.participantesPorAdmin?.[adminId] || []);
        setLoading(false);
      } else {
        alert("El evento no existe.");
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [eventoId, adminId, navigate]);

  const miUsuario = participantes.find(p => p.id === participanteId);
  const diaActual = dias[diaActivo];

  const getParticipante = (id: string | null) => participantes.find(p => p.id === id);

  const handleAsignarme = async (cajaId: string, turnoId: string) => {
    if (!miUsuario || !diaActual) return;
    
    const nuevosDias = [...dias];
    const diaIndex = diaActivo;
    const cajaIndex = nuevosDias[diaIndex].cajas.findIndex(c => c.id === cajaId);
    const turnoIndex = nuevosDias[diaIndex].cajas[cajaIndex].turnos.findIndex(t => t.id === turnoId);

    nuevosDias[diaIndex].cajas[cajaIndex].turnos[turnoIndex].participanteId = miUsuario.id;

    await updateDoc(doc(db, 'eventos', eventoId!), {
      [`diasPorAdmin.${adminId}`]: nuevosDias
    });
  };

  const handleQuitarme = async (cajaId: string, turnoId: string) => {
    if (!miUsuario || !diaActual) return;

    const nuevosDias = [...dias];
    const diaIndex = diaActivo;
    const cajaIndex = nuevosDias[diaIndex].cajas.findIndex(c => c.id === cajaId);
    const turnoIndex = nuevosDias[diaIndex].cajas[cajaIndex].turnos.findIndex(t => t.id === turnoId);

    if (nuevosDias[diaIndex].cajas[cajaIndex].turnos[turnoIndex].participanteId === miUsuario.id) {
      nuevosDias[diaIndex].cajas[cajaIndex].turnos[turnoIndex].participanteId = null;

      await updateDoc(doc(db, 'eventos', eventoId!), {
        [`diasPorAdmin.${adminId}`]: nuevosDias
      });
    }
  };

  const handleGuardarPerfilAjustado = async (datosActualizados: UsuarioModalData) => {
    if (!miUsuario) return;

    // VALIDACIÓN DE NOMBRE DUPLICADO (Excluyendo a uno mismo)
    const nameExists = participantes.some(
      p => p.nombre.toLowerCase() === datosActualizados.name.toLowerCase().trim() && p.id !== datosActualizados.id
    );

    if (nameExists) {
      alert("Este nombre ya está en uso por otro participante. Por favor elige otro para evitar confusiones.");
      return;
    }

    const participantesActualizados = participantes.map(p => 
      p.id === miUsuario.id 
        ? { 
            ...p, 
            nombre: datosActualizados.name, 
            telefono: datosActualizados.phone, 
            codigoPais: datosActualizados.countryCode,
            notas: datosActualizados.notes,
            organizacion: datosActualizados.organization
            // No sobreescribimos organizationLabel porque el participante no puede cambiar la etiqueta
          } 
        : p
    );

    await updateDoc(doc(db, 'eventos', eventoId!), {
      [`participantesPorAdmin.${adminId}`]: participantesActualizados
    });
    setIsUsuarioModalOpen(false);
  };

  const handleLogout = () => {
    // Redirigir a la pantalla de Invitación como pediste
    navigate(`/invite/${eventoId}/${adminId}`);
  };

  // Preparamos los datos frescos (useMemo evita renders infinitos en el Modal)
  const datosParaModal = useMemo((): UsuarioModalData | null => {
    if (!miUsuario) return null;
    return {
      id: miUsuario.id,
      name: miUsuario.nombre,
      role: 'Participante',
      phone: miUsuario.telefono || '',
      countryCode: miUsuario.codigoPais || '+52',
      supportArea: '',
      notes: miUsuario.notas || '',
      organization: miUsuario.organizacion || '',
      organizationLabel: miUsuario.organizationLabel || 'Congregación',
      ubicaciones: miUsuario.ubicaciones || []
    };
  }, [miUsuario]);

  if (loading || !miUsuario) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck size={48} className="text-blue-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-black text-slate-700">Cargando tu panel...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-6 font-sans flex flex-col h-screen relative overflow-x-hidden">
      
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            ¡Hola, {miUsuario.nombre.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{eventoNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition" title="Cerrar sesión">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row xl:items-center gap-4 mb-4 shrink-0 w-full overflow-x-auto pb-2">
        <div className="flex items-center gap-2 shrink-0">
          {dias.map((dia, idx) => (
            <button key={dia.id} onClick={() => setDiaActivo(idx)} className={`px-5 py-2.5 rounded-xl font-bold transition whitespace-nowrap ${diaActivo === idx ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
              <Calendar size={16} /> {dia.nombreDia}
            </button>
          ))}
        </div>
        <div className="xl:ml-auto shrink-0 flex gap-2 w-full xl:w-auto">
          <button onClick={() => setShowDirectorio(true)} className="flex-1 lg:flex-none bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition hover:bg-slate-700 shadow-md">
            <Users size={16} /> Participantes
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {diaActual ? (
          <MatrizTurnosParticipante 
            diaActual={diaActual} 
            getParticipante={getParticipante} 
            miUsuarioId={miUsuario.id} 
            onAsignarme={handleAsignarme} 
            onQuitarme={handleQuitarme} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p className="font-bold">Aún no hay días configurados.</p>
          </div>
        )}
      </div>

      <ParticipantDrawer 
        isOpen={showDirectorio} 
        onClose={() => setShowDirectorio(false)} 
        participantes={participantes} 
        currentUserId={miUsuario.id} 
        currentUserRole="Participante" 
        onEditParticipante={(id) => { if (id === miUsuario.id) setIsUsuarioModalOpen(true); }}
        onDeleteParticipante={() => {}} // Tapón: Participante no borra a nadie, evita error TS
        eventoId={eventoId}
        adminId={adminId}
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
        isOpen={downloadModal} 
        onClose={() => setDownloadModal(false)} 
        type="personal" 
        seccionName="Mis Accesos" 
        dias={dias} 
        diaActivo={diaActivo} 
        participantes={participantes} 
        targetUserId={miUsuario.id} 
      />
      
      <CroquisModal isOpen={showCroquis} onClose={() => setShowCroquis(false)} isAdmin={false} />
    </div>
  );
};

export default ParticipantPanel;
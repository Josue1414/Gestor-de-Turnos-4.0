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
  fechaNacimiento?: string;
}

const ParticipantPanel = () => {
  const { eventoId, adminId, participanteId } = useParams<{ eventoId: string; adminId: string; participanteId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState<DiaEvento[]>([]);
  const [participantes, setParticipantes] = useState<ParticipanteExtendidoDb[]>([]);
  const [eventoNombre, setEventoNombre] = useState('Evento');
  
  const [diaActivo, setDiaActivo] = useState(0);
  const [downloadModal, setDownloadModal] = useState(false);
  const [showDirectorio, setShowDirectorio] = useState(false);
  const [showCroquis, setShowCroquis] = useState(false);
  
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);

  useEffect(() => {
    if (!eventoId || !adminId) return;

    const docRef = doc(db, 'eventos', eventoId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDias(data.diasPorAdmin?.[adminId] || []);
        setParticipantes(data.participantesPorAdmin?.[adminId] || []);
        if (data.nombre) setEventoNombre(data.nombre);
      } else {
        alert("El evento no existe.");
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventoId, adminId, navigate]);

  const miUsuario = participantes.find(p => p.id === participanteId);

  const datosParaModal: UsuarioModalData | null = useMemo(() => {
    if (!miUsuario) return null;

    // Calculamos los turnos aquí mismo para que React Vercel no marque errores
    const misTurnos: { dia: string; horario: string; caja: string }[] = [];
    dias.forEach(dia => {
      dia.cajas.forEach(caja => {
        caja.turnos.forEach(turno => {
          if (turno.participanteId === miUsuario.id) {
            misTurnos.push({
              dia: dia.nombreDia || 'Día',
              horario: turno.horario,
              caja: caja.nombre
            });
          }
        });
      });
    });

    return {
      id: miUsuario.id,
      name: miUsuario.nombre,
      role: 'Participante',
      phone: miUsuario.telefono || '',
      countryCode: miUsuario.codigoPais || '+52',
      supportArea: miUsuario.ubicaciones?.length ? miUsuario.ubicaciones.join(', ') : 'Libre',
      notes: miUsuario.notas || '',
      organization: miUsuario.organizacion || '',
      organizationLabel: miUsuario.organizationLabel || 'Congregación',
      ubicaciones: miUsuario.ubicaciones || [],
      birthDate: miUsuario.fechaNacimiento || '',
      turnosAsignados: misTurnos // <-- Aquí se inyectan para que el modal los dibuje
    };
  }, [miUsuario, dias]);
  if (!miUsuario && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-600">Sincronizando acceso...</p>
      </div>
    );
  }

  const handleGuardarPerfilAjustado = async (datosActualizados: UsuarioModalData) => {
    if (!eventoId || !adminId || !miUsuario) return;
    
    try {
      const docRef = doc(db, 'eventos', eventoId);
      const actualizados = participantes.map((p) => 
        p.id === miUsuario.id 
          ? { 
              ...p, 
              nombre: datosActualizados.name, 
              telefono: datosActualizados.phone, 
              codigoPais: datosActualizados.countryCode,
              notas: datosActualizados.notes,
              organizacion: datosActualizados.organization,
              organizationLabel: datosActualizados.organizationLabel,
              fechaNacimiento: datosActualizados.birthDate
            } 
          : p
      );

      await updateDoc(docRef, {
        [`participantesPorAdmin.${adminId}`]: actualizados
      });
      
      setIsUsuarioModalOpen(false);
    } catch (error) {
      console.error("Error guardando perfil:", error);
      alert("Hubo un error al guardar tu perfil.");
    }
  };

  const diaActual = dias[diaActivo];

  const syncEvent = async (nuevosDias: DiaEvento[]) => {
    if (!eventoId || !adminId) return;
    await updateDoc(doc(db, 'eventos', eventoId), {
      [`diasPorAdmin.${adminId}`]: nuevosDias
    });
  };

  const handleAsignarme = (cajaId: string, turnoId: string) => {
    if (!miUsuario) return;
    const nuevosDias = dias.map((d, i) => i === diaActivo ? {
      ...d, cajas: d.cajas.map(c => c.id === cajaId ? {
        ...c, turnos: c.turnos.map(t => t.id === turnoId ? { ...t, participanteId: miUsuario.id } : t)
      } : c)
    } : d);
    syncEvent(nuevosDias);
  };

  const handleQuitarme = (cajaId: string, turnoId: string) => {
    const nuevosDias = dias.map((d, i) => i === diaActivo ? {
      ...d, cajas: d.cajas.map(c => c.id === cajaId ? {
        ...c, turnos: c.turnos.map(t => t.id === turnoId ? { ...t, participanteId: null } : t)
      } : c)
    } : d);
    syncEvent(nuevosDias);
  };

  // AQUÍ ESTÁ LA CORRECCIÓN: Ahora te devuelve a tu link de invitación
  const handleLogout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_admin_id');
    if (eventoId && adminId) {
      navigate(`/invite/${eventoId}/${adminId}`);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
        <ShieldCheck size={48} className="text-blue-500 animate-pulse mb-4" />
        <h2 className="text-xl font-black text-slate-700">Cargando evento...</h2>
      </div>
    );
  }

  if (!miUsuario) return null;

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-6 font-sans flex flex-col h-screen overflow-x-hidden">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4 shrink-0 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight mb-1">
            Hola, <span className="text-blue-600">{miUsuario.nombre}</span>
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-500">{eventoNombre}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button onClick={() => setShowCroquis(true)} className="bg-white border border-slate-300 text-slate-700 px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2 transition shadow-sm hover:bg-slate-50 flex-1 justify-center sm:flex-none">
            📍 <span className="hidden sm:inline">Croquis</span>
          </button>
          
          <button onClick={() => setShowDirectorio(true)} className="bg-slate-800 text-white px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 hover:bg-slate-700 transition shadow-sm flex-1 sm:flex-none">
            <Users size={16} className="sm:w-4 sm:h-4" /> Directorio
          </button>

          <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          <button onClick={() => setIsUsuarioModalOpen(true)} className="bg-indigo-50 text-indigo-600 px-3 py-2 sm:py-2.5 border border-indigo-200 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 hover:bg-indigo-100 transition shadow-sm flex-1 sm:flex-none">
             Mi Perfil
          </button>

          <button onClick={handleLogout} className="bg-white text-red-600 border border-slate-200 hover:border-red-200 px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex-1 sm:flex-none flex items-center justify-center">
            <LogOut size={16} className="sm:w-4 sm:h-4 sm:mr-1" /> <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
        {dias.map((dia, idx) => (
          <button key={dia.id} onClick={() => setDiaActivo(idx)} className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition whitespace-nowrap text-xs sm:text-sm ${diaActivo === idx ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="sm:w-4 sm:h-4" /> {dia.nombreDia}
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {diaActual ? (
          <MatrizTurnosParticipante 
            diaActual={diaActual} 
            getParticipante={(id) => participantes.find(p => p.id === id)} 
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
        onDeleteParticipante={() => {}} 
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

      <CroquisModal 
        isOpen={showCroquis} 
        onClose={() => setShowCroquis(false)} 
        isAdmin={false} 
      />
    </div>
  );
};

export default ParticipantPanel;
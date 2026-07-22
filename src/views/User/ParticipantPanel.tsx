import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Users, ShieldCheck, LogOut } from 'lucide-react';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

import type { DiaEvento, Participante } from '../../types';

import MatrizTurnosParticipante from '../../components/MatrizTurnosParticipante';
import ModalInfoUsuario, { type UsuarioModalData } from '../../components/ModalInfoUsuario';
import ParticipantDrawer from '../../components/ParticipantDrawer';
import DownloadScheduleModal from '../../components/DownloadScheduleModal';
import CroquisModal, { type CroquisItem } from '../../components/CroquisModal';
import { useToast } from '../../components/ToastProvider';

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
  
  const [croquisGral, setCroquisGral] = useState<string | null>(null);
  const [croquisIndiv, setCroquisIndiv] = useState<string | null>(null);
  
  const [diaActivo, setDiaActivo] = useState(0);
  const [downloadModal, setDownloadModal] = useState(false);
  const [showDirectorio, setShowDirectorio] = useState(false);
  const [showCroquis, setShowCroquis] = useState(false);
  
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  // NUEVO: Estado para controlar el modal de confirmación de salida
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    if (!eventoId || !adminId) return;
    const docRef = doc(db, 'eventos', eventoId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDias(data.diasPorAdmin?.[adminId] || []);
        setParticipantes(data.participantesPorAdmin?.[adminId] || []);
        if (data.nombre) setEventoNombre(data.nombre);
        
        setCroquisGral(data.croquisUrl || null);
        setCroquisIndiv(data.croquisPorAdmin?.[adminId] || null);
      } else {
        showToast('El evento no existe.', 'error');
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventoId, adminId, navigate]);

  const participantesEnriquecidos = useMemo(() => {
    return participantes.map((p) => {
      const ubicaciones: string[] = [];
      dias.forEach((dia) => {
        dia.cajas.forEach((caja) => {
          caja.turnos.forEach((turno) => {
            if (turno.participanteId === p.id) {
              ubicaciones.push(`${dia.nombreDia.substring(0,3)} ${turno.horario} - ${caja.nombre}`);
            }
          });
        });
      });
      return {
        ...p,
        estado: ubicaciones.length > 0 ? 'Asignado' : 'Libre',
        ubicaciones
      };
    });
  }, [participantes, dias]);

  const miUsuario = participantesEnriquecidos.find(p => p.id === participanteId);

  const datosParaModal: UsuarioModalData | null = useMemo(() => {
    if (!miUsuario) return null;

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
      turnosAsignados: misTurnos 
    };
  }, [miUsuario, dias]);

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
      showToast('Hubo un error al guardar tu perfil.', 'error');
    }
  };

  const diaActual = dias[diaActivo];

  const turnosLibresCount = diaActual ? diaActual.cajas.reduce((acc, caja) => acc + caja.turnos.filter((t) => !t.participanteId).length, 0) : 0;
  const turnosOcupadosCount = diaActual ? diaActual.cajas.reduce((acc, caja) => acc + caja.turnos.filter((t) => Boolean(t.participanteId)).length, 0) : 0;

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

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_admin_id');
    if (eventoId && adminId) {
      navigate(`/invite/${eventoId}/${adminId}`);
    } else {
      navigate('/');
    }
  }, [eventoId, adminId, navigate]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname);
    const handlePopState = () => {
      const confirmar = window.confirm("¿Seguro que deseas salir de tu sesión actual?");
      if (confirmar) {
        handleLogout(); 
      } else {
        window.history.pushState(null, '', window.location.pathname);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleLogout]);

  const croquisDataParaMostrar: CroquisItem[] = useMemo(() => {
    const arr: CroquisItem[] = [];
    arr.push({ id: 'general', title: 'Croquis General', url: croquisGral });
    if (croquisIndiv) {
      arr.push({ id: adminId || 'admin', title: 'Croquis del Área', url: croquisIndiv });
    }
    return arr;
  }, [croquisGral, croquisIndiv, adminId]);

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
    <div className="h-[100dvh] w-full bg-slate-100 font-sans flex flex-col overflow-auto relative">
      
      {/* 1. HEADER REESTRUCTURADO */}
      <div className="sticky left-0 w-[100vw] max-w-[100vw] px-2 sm:px-6 pt-2 sm:pt-6 pb-2 shrink-0 z-10 box-border">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 w-full max-w-[1400px] mx-auto gap-4">
          
          {/* LADO IZQUIERDO: Botón Salir + Saludo (Separados visualmente) */}
          <div className="flex items-center gap-3 w-full sm:w-auto border-b border-slate-100 pb-3 sm:border-none sm:pb-0">
            <button 
              onClick={() => setShowLogoutConfirm(true)} 
              className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 p-2 sm:px-3 rounded-xl text-[11px] font-bold shadow-sm transition flex items-center justify-center gap-1.5 shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut size={16} className="w-4 h-4" /> <span className="hidden sm:inline">Salir</span>
            </button>

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight mb-0.5 truncate">
                Hola, <span className="text-blue-600">{miUsuario.nombre}</span>
              </h1>
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 truncate">{eventoNombre}</p>
            </div>
          </div>
          
          {/* LADO DERECHO: Herramientas del Participante */}
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
            <button onClick={() => setShowCroquis(true)} className="bg-slate-50 border border-slate-200 text-slate-700 p-2 sm:px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm hover:bg-slate-100">
              📍 <span className="hidden sm:inline">Croquis</span>
            </button>
            
            <button onClick={() => setShowDirectorio(true)} className="bg-blue-50 border border-blue-200 text-blue-700 p-2 sm:px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition shadow-sm">
              <Users size={16} className="w-4 h-4" /> <span className="hidden sm:inline">Directorio</span>
            </button>

            <button onClick={() => setIsUsuarioModalOpen(true)} className="bg-indigo-50 text-indigo-700 p-2 sm:px-3 border border-indigo-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-100 transition shadow-sm">
               Mi Perfil
            </button>
          </div>
        </header>
      </div>

      {/* 2. BARRA DE DÍAS */}
      <div className="sticky top-0 left-0 z-50 w-[100vw] max-w-[100vw] bg-slate-100 h-[60px] flex items-center shadow-sm border-b border-slate-200 px-2 sm:px-6 shrink-0 box-border">
        <div className="w-full max-w-[1400px] mx-auto flex gap-2 overflow-x-auto no-scrollbar items-center h-full px-1">
          {dias.map((dia, idx) => (
            <button key={dia.id} onClick={() => setDiaActivo(idx)} className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 ${diaActivo === idx ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 text-[10px]'}`}>
              <Calendar size={14} /> {dia.nombreDia}
            </button>
          ))}
        </div>
      </div>

      {/* 3. TABLA DE TURNOS */}
      <div className="px-2 sm:px-6 w-max min-w-[100vw] pb-10 flex flex-col z-0 mx-auto">
        {diaActual ? (
          <MatrizTurnosParticipante 
            diaActual={diaActual} 
            getParticipante={(id) => participantes.find(p => p.id === id)} 
            miUsuarioId={miUsuario.id} 
            onAsignarme={handleAsignarme} 
            onQuitarme={handleQuitarme} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 mt-10">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p className="font-bold">Aún no hay días configurados.</p>
          </div>
        )}
      </div>

      {/* MODALES ADICIONALES */}
      <ParticipantDrawer 
        isOpen={showDirectorio} 
        onClose={() => setShowDirectorio(false)} 
        participantes={participantesEnriquecidos} 
        currentUserId={miUsuario.id} 
        currentUserRole="Participante" 
        onEditParticipante={(id) => { if (id === miUsuario.id) setIsUsuarioModalOpen(true); }}
        onDeleteParticipante={() => {}} 
        eventoId={eventoId}
        adminId={adminId}
        turnosLibresCount={turnosLibresCount}
        turnosOcupadosCount={turnosOcupadosCount}
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
        canEdit={false} 
        croquis={croquisDataParaMostrar} 
        onSaveCroquis={async (_file: File | null, _id: string) => {
          return Promise.resolve();
        }}
      />

      {/* NUEVO: Modal de Confirmación de Salida Segura */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-inner border border-red-100">
              <LogOut size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">¿Cerrar Sesión?</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Estás a punto de salir de tu cuenta. Tendrás que volver a ingresar con tu fecha de nacimiento.</p>
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
      
    </div>
  );
};

export default ParticipantPanel;
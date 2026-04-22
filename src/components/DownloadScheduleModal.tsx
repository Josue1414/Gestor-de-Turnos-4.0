/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useRef, useState, useMemo } from 'react';
import { X, Download, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle, Calendar as CalendarIcon, ClipboardList } from 'lucide-react';
import html2canvas from 'html2canvas';

// --- INTERFACES ESTRICTAS ---
interface Turno { 
  id: string; 
  participanteId: string | null; 
  horario: string; 
}
interface Caja { 
  id: string; 
  nombre: string; 
  turnos: Turno[] | Record<string, Turno>; 
}
interface Dia { 
  id: string; 
  nombreDia: string; 
  cajas: Caja[] | Record<string, Caja>; 
  cajasEspeciales?: Caja[] | Record<string, Caja>; 
}
interface Participante { 
  id: string; 
  nombre: string; 
}

interface DownloadScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'general' | 'personal'; 
  seccionName: string;          
  dias: Dia[];
  diaActivo: number;            
  participantes: Participante[];
  targetUserId?: string | null; 
}

// Helper tipado para unir cajas normales y especiales
const getTodasLasCajas = (dia: Dia | null): Caja[] => {
    if (!dia) return [];
    const cajas = Array.isArray(dia.cajas) ? dia.cajas : (dia.cajas ? (Object.values(dia.cajas) as Caja[]) : []);
    const especiales = Array.isArray(dia.cajasEspeciales) ? dia.cajasEspeciales : (dia.cajasEspeciales ? (Object.values(dia.cajasEspeciales) as Caja[]) : []);
    return [...cajas, ...especiales];
};

// --- EL NUEVO MOTOR UNIVERSAL DE TIEMPO (Colores Individuales) ---
const parseTimeUniversal = (timeStr: string) => {
    if (!timeStr) return { minutes: 0, isRange: false, start: { text12h: '---', isPM: false } };
    
    const normalizedStr = timeStr.replace(/ a /ig, '-');
    const parts = normalizedStr.split('-');
    
    const parseSingleTime = (time: string) => {
        const clean = time.toUpperCase().trim();
        let isPM = false;
        let hour = 0;
        let min = 0;

        if (clean.includes('PM') || clean.includes('AM')) {
            isPM = clean.includes('PM');
            const numPart = clean.replace('AM', '').replace('PM', '').trim();
            const splitMatch = numPart.split(':');
            hour = parseInt(splitMatch[0], 10);
            min = splitMatch.length > 1 ? parseInt(splitMatch[1], 10) : 0;
            
            if (isNaN(hour)) hour = 0;
            if (isNaN(min)) min = 0;

            if (isPM && hour !== 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;
        } else {
            const splitMatch = clean.split(':');
            hour = parseInt(splitMatch[0], 10);
            min = splitMatch.length > 1 ? parseInt(splitMatch[1], 10) : 0;
            
            if (isNaN(hour)) hour = 0;
            if (isNaN(min)) min = 0;

            isPM = hour >= 12;
        }

        const minutes = (hour * 60) + min;

        let displayHour = hour;
        if (displayHour === 0) displayHour = 12;
        else if (displayHour > 12) displayHour -= 12;

        const text12h = `${displayHour}:${min.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
        return { minutes, text12h, isPM };
    };

    if (parts.length >= 2) {
        const start = parseSingleTime(parts[0]);
        const end = parseSingleTime(parts[1]);
        return {
            minutes: start.minutes,
            isRange: true,
            start: start,
            end: end
        };
    } else {
        const start = parseSingleTime(timeStr);
        return {
            minutes: start.minutes,
            isRange: false,
            start: start
        };
    }
};

// Colores de diseño
const COLOR_AM = '#3b82f6'; // Azul Claro
const COLOR_PM = '#1e3a8a'; // Azul Oscuro

const DownloadScheduleModal: React.FC<DownloadScheduleModalProps> = ({ 
  isOpen, onClose, type, seccionName, dias, diaActivo, participantes, targetUserId 
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customError, setCustomError] = useState<{title: string, message: string} | null>(null);

  // Lógica de turnos personales
  const todosMisTurnos = useMemo(() => {
    if (type !== 'personal' || !targetUserId || !dias) return [];
    
    const turnosAcumulados: { diaIndex: number, dia: string, caja: string, parsedTime: any, sortValue: number }[] = [];
    
    dias.forEach((dia, diaIndex) => {
      const cajasArr = getTodasLasCajas(dia);
      
      cajasArr.forEach((caja: Caja) => {
        const turnosArr = Array.isArray(caja.turnos) ? caja.turnos : (caja.turnos ? (Object.values(caja.turnos) as Turno[]) : []);
            
        turnosArr.forEach((turno: Turno) => {
          if (String(turno.participanteId) === String(targetUserId)) {
            const parsedTime = parseTimeUniversal(turno.horario);
            
            turnosAcumulados.push({ 
                diaIndex,
                dia: dia.nombreDia, 
                caja: caja.nombre || 'Sin área', 
                parsedTime,
                sortValue: parsedTime.minutes
            });
          }
        });
      });
    });

    turnosAcumulados.sort((a, b) => {
        if (a.diaIndex !== b.diaIndex) return a.diaIndex - b.diaIndex;
        return a.sortValue - b.sortValue; 
    });

    return turnosAcumulados; 
  }, [type, targetUserId, dias]);

  if (!isOpen) return null;

  const diaActual = dias && dias.length > 0 ? dias[diaActivo] : null;
  const participantName = type === 'personal' && targetUserId 
    ? participantes?.find(p => p.id === targetUserId)?.nombre || 'Participante' : '';

  // Extraer cajas y ordenar para Vista Admin
  const todasLasCajasAdmin = getTodasLasCajas(diaActual);
  const horariosMap = new Map<string, number>();
  todasLasCajasAdmin.forEach((caja: Caja) => {
      const turnosArr = Array.isArray(caja.turnos) ? caja.turnos : (caja.turnos ? Object.values(caja.turnos) as Turno[] : []);
      turnosArr.forEach((t: Turno) => {
          if (!horariosMap.has(t.horario)) {
              horariosMap.set(t.horario, parseTimeUniversal(t.horario).minutes);
          }
      });
  });
  
  const horariosUnicosOrdenados = Array.from(horariosMap.keys()).sort((a, b) => horariosMap.get(a)! - horariosMap.get(b)!);

  const getNombreParticipante = (id: string | null) => {
    if (!id) return '';
    return participantes?.find(p => p.id === id)?.nombre || '---';
  };

  // --- FUNCIÓN DE DESCARGA ---
  const handleDownload = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);
    setCustomError(null);
    
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 1.5, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        windowWidth: 800
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const safeSeccion = (seccionName || 'Evento').replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
      
      link.download = type === 'general' 
        ? `Agenda_${safeSeccion}_${(diaActual?.nombreDia || 'Dia').replace(/\s+/g, '_')}.png`
        : `Mis_Turnos_${participantName.replace(/\s+/g, '_')}.png`;
        
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 2000);

    } catch (err: unknown) { 
      console.error("Fallo detectado en html2canvas:", err); 
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un bloqueo interno en el navegador. Intenta nuevamente.";
      setCustomError({
        title: "Error Técnico",
        message: errorMessage
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* ENCABEZADO MODAL */}
        <div className="bg-slate-900 p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400"><ImageIcon size={20} /></div>
             <h2 className="text-white font-black text-lg tracking-tight uppercase">Exportar Imagen</h2>
          </div>
          <button onClick={onClose} className="bg-slate-800 hover:bg-red-500 text-white p-2 rounded-xl transition-all"><X size={20} /></button>
        </div>

        {/* ÁREA DE SCROLL (VISTA PREVIA) */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-100 border-y border-slate-200">
          <div className="flex justify-center items-start min-w-max h-full">
            
            <div className="bg-white shadow-2xl mx-auto flex-shrink-0">
              
              {/* === ZONA DE LA FOTO === */}
              <div 
                id="print-container"
                ref={printRef} 
                style={{ 
                  backgroundColor: '#ffffff', 
                  width: '800px', 
                  padding: '40px', 
                  boxSizing: 'border-box',
                  fontFamily: 'system-ui, -apple-system, sans-serif' 
                }} 
              >
                {/* CABECERA DOCUMENTO */}
                <div style={{ marginBottom: '32px', borderBottom: '4px solid #f1f5f9', paddingBottom: '24px', textAlign: 'center' }}>
                  <h1 style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', color: '#0f172a', margin: '0 0 12px 0' }}>
                    {seccionName || 'Gestor de Turnos'}
                  </h1>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                     <div style={{ padding: '6px 16px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalendarIcon size={14} color="#3b82f6" /> 
                        <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>
                           {type === 'general' ? (diaActual?.nombreDia || 'General') : 'Itinerario Personal'}
                        </span>
                     </div>
                     {type === 'personal' && (
                        <div style={{ padding: '6px 16px', borderRadius: '8px', backgroundColor: '#eff6ff' }}>
                           <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563eb' }}>{participantName}</span>
                        </div>
                     )}
                  </div>

                  {/* LEYENDA ADMIN */}
                  {type === 'general' && (
                     <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Referencia Horarios:</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                           <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLOR_AM }}></div>
                           <span style={{ fontSize: '10px', fontWeight: 900, color: COLOR_AM }}>AM (Mañana)</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                           <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLOR_PM }}></div>
                           <span style={{ fontSize: '10px', fontWeight: 900, color: COLOR_PM }}>PM (Tarde/Noche)</span>
                        </div>
                     </div>
                  )}
                </div>

                {/* VISTA GENERAL ADMIN */}
                {type === 'general' && diaActual && (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                     {todasLasCajasAdmin.map((caja: Caja) => (
                       <div key={caja.id} style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                         
                         <div style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: '#0f172a', color: '#ffffff' }}>
                           {caja.nombre}
                         </div>
                         
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1px', backgroundColor: '#e2e8f0' }}>
                           {horariosUnicosOrdenados.map(hRaw => {
                             const turnosArr = Array.isArray(caja.turnos) ? caja.turnos : (caja.turnos ? Object.values(caja.turnos) as Turno[] : []);
                             const turno = turnosArr.find(t => t.horario === hRaw);
                             const parsedTime = parseTimeUniversal(hRaw);
                             
                             // --- LÓGICA DE CELDA VACÍA CORREGIDA ---
                             const rawName = turno?.participanteId ? getNombreParticipante(turno.participanteId) : '';
                             const isRealmenteAsignado = rawName.trim() !== '' && rawName !== '---';
                             const displayText = isRealmenteAsignado ? rawName : 'Disponible';
                             const textColor = isRealmenteAsignado ? '#0f172a' : '#94a3b8'; // Gris oscuro para que se lea bien
                             
                             return (
                               <div key={hRaw} style={{ padding: '16px', backgroundColor: '#ffffff' }}>
                                 
                                 {/* Rango de Tiempo con Colores Individuales */}
                                 <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: parsedTime.start.isPM ? COLOR_PM : COLOR_AM }}>
                                       {parsedTime.start.text12h}
                                    </span>
                                    {parsedTime.isRange && parsedTime.end && (
                                       <>
                                          <span style={{ color: '#94a3b8' }}>-</span>
                                          <span style={{ color: parsedTime.end.isPM ? COLOR_PM : COLOR_AM }}>
                                             {parsedTime.end.text12h}
                                          </span>
                                       </>
                                    )}
                                 </div>

                                 <p style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.3', color: textColor, margin: 0, wordBreak: 'break-word' }}>
                                   {displayText}
                                 </p>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     ))}
                   </div>
                )}

                {/* VISTA PERSONAL (TABLA COMPACTA ORDENADA) */}
                {type === 'personal' && (
                  <table style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'left' }}>
                     <thead>
                        <tr>
                           <th style={{ padding: '16px', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #334155' }}>
                              Día
                           </th>
                           <th style={{ padding: '16px', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #334155', textAlign: 'center' }}>
                              <div>Horario</div>
                              <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '4px', letterSpacing: '0.05em' }}>
                                 <span style={{ color: '#60a5fa' }}>AM (CLARO)</span> | <span style={{ color: '#818cf8' }}>PM (OSCURO)</span>
                              </div>
                           </th>
                           <th style={{ padding: '16px', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #334155', textAlign: 'right' }}>
                              Área Asignada
                           </th>
                        </tr>
                     </thead>
                     <tbody>
                        {todosMisTurnos.length > 0 ? (
                           todosMisTurnos.map((t, idx) => (
                              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                                 <td style={{ padding: '16px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                                    {t.dia}
                                 </td>
                                 <td style={{ padding: '16px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '15px', fontWeight: 900 }}>
                                    {/* Rango de Tiempo con Colores Individuales (Participante) */}
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                                       <span style={{ color: t.parsedTime.start.isPM ? COLOR_PM : COLOR_AM }}>
                                          {t.parsedTime.start.text12h}
                                       </span>
                                       {t.parsedTime.isRange && t.parsedTime.end && (
                                          <>
                                             <span style={{ color: '#94a3b8' }}>-</span>
                                             <span style={{ color: t.parsedTime.end.isPM ? COLOR_PM : COLOR_AM }}>
                                                {t.parsedTime.end.text12h}
                                             </span>
                                          </>
                                       )}
                                    </div>
                                 </td>
                                 <td style={{ padding: '16px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                                    {t.caja}
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={3} style={{ padding: '40px', textAlign: 'center', fontWeight: 'bold', fontStyle: 'italic', textTransform: 'uppercase', fontSize: '12px', color: '#cbd5e1', border: '1px solid #e2e8f0' }}>
                                 Sin turnos asignados
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
                )}

                {/* PIE DE PÁGINA DOCUMENTO */}
                <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8' }}>
                  <p style={{ margin: 0 }}>Gestor de Turnos 4.0</p>
                  <p style={{ margin: 0 }}>{new Date().toLocaleDateString('es-MX')}</p>
                </div>
              </div>
              {/* === FIN ZONA DE LA FOTO === */}
            </div>

          </div>
        </div>

        {/* PIE DEL MODAL CON BOTONES */}
        <div className="p-5 bg-white border-t flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
             <ClipboardList size={16} />
             <p className="text-[10px] font-black uppercase tracking-widest">Generador libre de errores</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={onClose} disabled={isDownloading} className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition text-sm">Cerrar</button>
            <button 
              onClick={handleDownload} 
              disabled={isDownloading || success || (type === 'personal' && todosMisTurnos.length === 0)} 
              className={`flex-1 px-10 py-3 rounded-xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-2 text-sm ${
                success ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {isDownloading ? <><Loader2 className="animate-spin" size={18} /> Procesando...</> 
               : success ? <><CheckCircle2 size={18} /> ¡Guardado!</> 
               : <><Download size={18} /> Guardar Imagen</>}
            </button>
          </div>
        </div>

        {/* ALERTA DE ERROR TÉCNICO */}
        {customError && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl text-center border-b-8 border-red-500">
              <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2">{customError.title}</h3>
              <p className="text-sm font-bold text-slate-500 mb-8 p-3 bg-slate-50 rounded-lg overflow-auto max-h-32 text-left whitespace-pre-wrap">
                {customError.message}
              </p>
              <button onClick={() => setCustomError(null)} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl">Entendido</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadScheduleModal;
import React, { useRef, useState } from 'react';
import { X, Download, Calendar as CalendarIcon, MapPin, Clock, Users, Star } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { DiaEvento, Participante } from '../types';

interface DownloadScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'personal' | 'general';
  seccionName: string;
  dias: DiaEvento[];
  diaActivo: number;
  participantes: Participante[];
  targetUserId?: string;
}

const DownloadScheduleModal: React.FC<DownloadScheduleModalProps> = ({
  isOpen, onClose, type, seccionName, dias, diaActivo, participantes, targetUserId
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const targetUser = type === 'personal' ? participantes.find(p => p.id === targetUserId) : null;

  const handleDownload = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = type === 'personal' 
        ? `Horario_${targetUser?.nombre?.replace(/\s+/g, '_') || 'Participante'}.png` 
        : `Horario_General_${seccionName.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (error) {
      console.error("Error al generar la imagen:", error);
      alert("Hubo un error al generar la imagen.");
    } finally {
      setIsDownloading(false);
      onClose();
    }
  };

  const renderPersonalView = () => {
    if (!targetUser) return <p>Usuario no encontrado.</p>;

    return (
      <div className="bg-white p-8 rounded-2xl w-full max-w-md mx-auto border-2 border-slate-100">
        <div className="text-center mb-6 border-b-2 border-slate-100 pb-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{targetUser.nombre}</h2>
          <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mt-1">{seccionName}</p>
        </div>

        <div className="space-y-6">
          {dias.map(dia => {
            const misTurnosDia = dia.cajas.flatMap(caja => 
              caja.turnos
                .filter(t => t.participanteId === targetUser.id)
                .map(t => ({ cajaNombre: caja.nombre, horario: t.horario, esEspecial: caja.esEspecial }))
            );
            if (misTurnosDia.length === 0) return null;

            return (
              <div key={dia.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="font-black text-slate-700 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <CalendarIcon size={16} className="text-blue-500"/> {dia.nombreDia}
                </h3>
                <div className="space-y-3">
                  {misTurnosDia.map((turno, idx) => (
                    <div key={idx} className={`flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border ${turno.esEspecial ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100'}`}>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Clock size={14} className={turno.esEspecial ? 'text-indigo-400' : 'text-slate-400'} /> {turno.horario}
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-md ${turno.esEspecial ? 'text-indigo-700 bg-indigo-100' : 'text-blue-700 bg-blue-50'}`}>
                        {turno.esEspecial ? <Star size={12} className="fill-indigo-700" /> : <MapPin size={12} />} 
                        {turno.cajaNombre}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center text-xs text-slate-400 font-medium">Generado desde Gestor de Turnos 3.0</div>
      </div>
    );
  };

  const renderGeneralView = () => {
    const diaActual = dias[diaActivo] || dias[0]; 
    
    // SEPARAR CAJAS NORMALES DE ESPECIALES (Ya sin los comentarios @ts-ignore)
    const cajasNormales = diaActual.cajas.filter(c => !c.esEspecial);
    const cajasEspeciales = diaActual.cajas.filter(c => c.esEspecial);

    return (
      <div className="bg-white p-8 rounded-xl w-full max-w-4xl mx-auto border-2 border-slate-100 flex flex-col gap-6">
        <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">HORARIO GENERAL</h2>
            <p className="text-slate-500 font-bold tracking-widest uppercase text-sm mt-1">{seccionName} • <span className="text-blue-600">{diaActual.nombreDia}</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold">Generado desde</p>
            <p className="text-sm font-black text-blue-600">Gestor 3.0</p>
          </div>
        </div>

        {/* TABLA 1: CAJAS NORMALES */}
        {cajasNormales.length > 0 && (
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-3 bg-slate-800 text-white font-bold text-sm uppercase border border-slate-700">Horario</th>
                  {cajasNormales.map(caja => (
                    <th key={caja.id} className="p-3 bg-slate-700 text-white font-bold text-sm uppercase border border-slate-600 text-center">{caja.nombre}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diaActual.horariosMaestros.map((horario, idx) => (
                  <tr key={idx}>
                    <td className="p-3 border border-slate-300 bg-slate-100 font-bold text-sm text-slate-700 whitespace-nowrap">{horario}</td>
                    {cajasNormales.map(caja => {
                      const turno = caja.turnos.find(t => t.horario === horario);
                      const participante = participantes.find(p => p.id === turno?.participanteId);
                      return (
                        <td key={caja.id} className={`p-3 border border-slate-300 text-center text-sm font-bold ${turno?.participanteId === 'CERRADO' ? 'bg-red-50 text-red-400' : turno?.participanteId ? 'bg-white text-blue-700' : 'bg-slate-50 text-slate-300'}`}>
                          {turno?.participanteId === 'CERRADO' ? 'CERRADO' : participante?.nombre || 'VACÍO'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLA 2: CAJAS ESPECIALES */}
        {cajasEspeciales.length > 0 && (
          <div className="mt-4 border-t-2 border-dashed border-slate-200 pt-6">
            <h3 className="text-lg font-black text-indigo-900 tracking-tight uppercase mb-3 flex items-center gap-2">
              <Star size={18} className="fill-indigo-500 text-indigo-500" /> Áreas / Turnos Especiales
            </h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-3 bg-indigo-800 text-white font-bold text-sm uppercase border border-indigo-700">Área / Caja</th>
                  <th className="p-3 bg-indigo-700 text-white font-bold text-sm uppercase border border-indigo-600 text-center">Horario Asignado</th>
                  <th className="p-3 bg-indigo-700 text-white font-bold text-sm uppercase border border-indigo-600 text-center">Participante</th>
                </tr>
              </thead>
              <tbody>
                {cajasEspeciales.flatMap(caja => 
                  caja.turnos.map((turno, idx) => {
                    const participante = participantes.find(p => p.id === turno.participanteId);
                    return (
                      <tr key={`${caja.id}-${idx}`}>
                        <td className="p-3 border border-indigo-200 bg-indigo-50 font-black text-sm text-indigo-900 whitespace-nowrap">{caja.nombre}</td>
                        <td className="p-3 border border-indigo-200 bg-white font-bold text-sm text-slate-700 text-center whitespace-nowrap">{turno.horario}</td>
                        <td className={`p-3 border border-indigo-200 text-center text-sm font-bold ${turno?.participanteId === 'CERRADO' ? 'bg-red-50 text-red-400' : turno?.participanteId ? 'bg-white text-indigo-700' : 'bg-slate-50 text-slate-300'}`}>
                          {turno?.participanteId === 'CERRADO' ? 'CERRADO' : participante?.nombre || 'VACÍO'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex flex-col w-full max-w-5xl max-h-[90vh] bg-slate-100 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-white border-b border-slate-200 shrink-0">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Download size={20} className="text-blue-500"/> Vista Previa de Imagen</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-200/50 flex justify-center items-start">
          <div ref={printRef} className="shadow-lg">{type === 'personal' ? renderPersonalView() : renderGeneralView()}</div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
          <button onClick={handleDownload} disabled={isDownloading} className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md flex items-center gap-2 transition ${isDownloading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
            <Download size={18} /> {isDownloading ? 'Generando PNG...' : 'Descargar Imagen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadScheduleModal;
// src/components/CroquisModal.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Upload, Map as MapIcon, Trash2, ZoomIn, ZoomOut, Maximize, Loader2, ChevronLeft, ChevronRight, PenTool } from 'lucide-react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { Coordenada, PoligonoCroquis, DiaEvento, Participante } from '../types';
import CapaTrazados from './CroquisInteractivo/CapaTrazados';
import PanelDibujo from './CroquisInteractivo/PanelDibujo';
import TarjetaTurnoEnVivo, { type PoligonoCroquisExt } from './CroquisInteractivo/TarjetaTurnoEnVivo';

export interface CroquisItem {
  id: string;
  title: string;
  url: string | null;
  poligonos?: PoligonoCroquis[]; 
}

interface CroquisModalProps {
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
  croquis: CroquisItem[];
  dias?: DiaEvento[]; 
  diaActivo?: number; 
  getParticipante?: (id: string | null) => Participante | undefined;
  currentUserRole?: 'SuperAdmin' | 'Supervisor' | 'Administrador' | 'Capitan' | 'Participante';
  
  onSaveCroquis: (file: File | null, croquisId: string) => Promise<void>;
  onSavePoligono?: (poligono: any, croquisId: string) => Promise<void>; 
}

const CroquisModal: React.FC<CroquisModalProps> = ({ 
  isOpen, onClose, canEdit = false, croquis, 
  dias = [], diaActivo = 0, getParticipante, currentUserRole = 'Administrador',
  onSaveCroquis, onSavePoligono 
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [localOverride, setLocalOverride] = useState<string | null | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ESTADOS DEL MODO DIBUJO ---
  const [modoDibujo, setModoDibujo] = useState(false);
  const [puntosActuales, setPuntosActuales] = useState<Coordenada[]>([]);
  const [polyName, setPolyName] = useState('');
  const [polyColor, setPolyColor] = useState('#6366f1');
  const [polyNotas, setPolyNotas] = useState('');
  const [polyCajaVinculada, setPolyCajaVinculada] = useState('Ninguna');
  const [polyVisibilidad, setPolyVisibilidad] = useState<'todos' | 'solo_admins_capitanes'>('todos');

  // --- ESTADOS DE LA TARJETA EN VIVO ---
  const [poligonoActivo, setPoligonoActivo] = useState<PoligonoCroquisExt | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      setLocalOverride(undefined);
      setPoligonoActivo(null);
      cancelarDibujo();
    }
  }, [isOpen]);

  // Se movieron las declaraciones arriba para evitar errores al mover el early return
  const currentItem = croquis?.[activeIndex];
  const imagenUrl = localOverride !== undefined ? localOverride : currentItem?.url;

  const nombresCajasDisponibles = useMemo(() => {
    const nombres = new Set<string>();
    dias.forEach(d => d.cajas.forEach(c => nombres.add(c.nombre)));
    return Array.from(nombres);
  }, [dias]);

  const cajasDeHoyNombres = useMemo(() => {
    if (!dias[diaActivo]) return [];
    return dias[diaActivo].cajas.map(c => c.nombre);
  }, [dias, diaActivo]);

  const poligonosFiltrados = useMemo(() => {
    const polys = (currentItem?.poligonos || []) as PoligonoCroquisExt[];
    return polys.filter(p => {
      if (modoDibujo) return true; 
      
      if (p.cajaVinculadaNombre && p.cajaVinculadaNombre !== 'Ninguna') {
         if (!cajasDeHoyNombres.includes(p.cajaVinculadaNombre)) return false;
      }
      return p.estado === 'publicado';
    });
  }, [currentItem?.poligonos, modoDibujo, cajasDeHoyNombres]);


  const handleCloseModal = () => {
    if (isUploading) return;
    setLocalOverride(undefined);
    setPoligonoActivo(null);
    cancelarDibujo();
    onClose();
  };

  const cambiarImagen = (direccion: 'izq' | 'der') => {
    if (isUploading || modoDibujo || !croquis) return;
    setLocalOverride(undefined);
    setPoligonoActivo(null);
    if (direccion === 'izq') {
      setActiveIndex(prev => prev > 0 ? prev - 1 : croquis.length - 1);
    } else {
      setActiveIndex(prev => prev < croquis.length - 1 ? prev + 1 : 0);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentItem) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no debe superar los 5MB.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setIsUploading(true);
      try {
        const previewUrl = URL.createObjectURL(file);
        setLocalOverride(previewUrl);
        await onSaveCroquis(file, currentItem.id);
      } catch (error) {
        console.error("Error al subir croquis:", error);
        setLocalOverride(undefined);
        alert("Error al subir el croquis.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!confirm("¿Eliminar este croquis?") || !currentItem) return;
    setIsUploading(true);
    try {
      await onSaveCroquis(null, currentItem.id);
      setLocalOverride(null);
    } catch (error) {
      console.error(error);
      alert("Error al eliminar el croquis.");
    } finally {
      setIsUploading(false);
    }
  };

  const cancelarDibujo = () => {
    setModoDibujo(false);
    setPuntosActuales([]);
    setPolyName('');
    setPolyNotas('');
    setPolyCajaVinculada('Ninguna');
    setPolyVisibilidad('todos');
  };

  const handleGuardarTerritorio = async () => {
    if (!onSavePoligono || !currentItem) return;
    const nuevoPoligono: PoligonoCroquisExt = {
      id: `poly_${Date.now()}`,
      nombre: polyName.trim(),
      color: polyColor,
      puntos: puntosActuales,
      notas: polyNotas.trim(),
      cajaVinculadaNombre: polyCajaVinculada,
      visibilidad: polyVisibilidad,
      estado: 'publicado'
    };
    await onSavePoligono(nuevoPoligono, currentItem.id);
    cancelarDibujo();
  };

  const handlePoligonoClick = (poligono: PoligonoCroquisExt) => {
    setPoligonoActivo(poligono);
  };

  const cajaEnVivoActual = useMemo(() => {
    if (!poligonoActivo || poligonoActivo.cajaVinculadaNombre === 'Ninguna') return undefined;
    const diaActualObj = dias[diaActivo];
    if (!diaActualObj) return undefined;
    return diaActualObj.cajas.find(c => c.nombre === poligonoActivo.cajaVinculadaNombre);
  }, [poligonoActivo, dias, diaActivo]);

  // EL EARLY RETURN AHORA VIVE DEBAJO DE TODOS LOS HOOKS (REGLA DE ORO DE REACT)
  if (!isOpen || !croquis || croquis.length === 0 || !currentItem) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={handleCloseModal} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col h-[85vh] sm:h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white shrink-0 z-20 shadow-sm">
          <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
            <MapIcon className="text-indigo-500" /> {currentItem.title}
          </h3>
          
          <div className="flex items-center gap-3 sm:gap-4">
            {canEdit && imagenUrl && !modoDibujo && (
              <button 
                onClick={() => { setModoDibujo(true); setPoligonoActivo(null); }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
              >
                <PenTool size={14} /> <span className="hidden sm:inline">Trazar Área</span>
              </button>
            )}

            {croquis.length > 1 && !modoDibujo && (
              <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-widest hidden sm:block">
                {activeIndex + 1} / {croquis.length}
              </span>
            )}
            
            <button onClick={handleCloseModal} disabled={isUploading || modoDibujo} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-slate-100/50 flex items-center justify-center overflow-hidden dotted-background group">
          
          {croquis.length > 1 && !modoDibujo && (
            <>
              <button onClick={() => cambiarImagen('izq')} className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/80 p-3 rounded-full shadow-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition-all sm:opacity-0 sm:group-hover:opacity-100">
                <ChevronLeft size={28} />
              </button>
              <button onClick={() => cambiarImagen('der')} className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/80 p-3 rounded-full shadow-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition-all sm:opacity-0 sm:group-hover:opacity-100">
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {isUploading && (
            <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
              <span className="font-bold text-slate-700">Guardando Croquis...</span>
            </div>
          )}

          {imagenUrl ? (
            <TransformWrapper 
              initialScale={1} 
              minScale={0.5} 
              maxScale={8} 
              centerOnInit={true}
              panning={{ disabled: modoDibujo }}
              doubleClick={{ disabled: modoDibujo }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {!modoDibujo && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-xl border border-slate-200">
                      <button onClick={() => zoomOut()} className="p-2.5 text-slate-600 hover:bg-blue-50 rounded-xl transition"><ZoomOut size={20} /></button>
                      <div className="w-px h-6 bg-slate-200 mx-1"></div>
                      <button onClick={() => resetTransform()} className="p-2.5 text-slate-600 hover:bg-blue-50 rounded-xl transition font-bold"><Maximize size={20} /></button>
                      <div className="w-px h-6 bg-slate-200 mx-1"></div>
                      <button onClick={() => zoomIn()} className="p-2.5 text-slate-600 hover:bg-blue-50 rounded-xl transition"><ZoomIn size={20} /></button>
                    </div>
                  )}

                  {canEdit && !modoDibujo && (
                    <button onClick={handleRemove} className="absolute top-4 right-4 z-10 px-4 py-2.5 bg-red-500 text-white rounded-xl shadow-lg transition hover:bg-red-600 flex items-center gap-2 font-bold">
                      <Trash2 size={18} /> <span className="hidden sm:inline">Borrar Croquis</span>
                    </button>
                  )}

                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    
                    <div className="relative inline-flex items-center justify-center max-w-[95vw] max-h-[80vh]" onClick={() => setPoligonoActivo(null)}>
                      <img 
                        src={imagenUrl} 
                        alt="Croquis" 
                        className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg pointer-events-none" 
                      />
                      
                      <div className="absolute inset-0 z-10 rounded-lg overflow-hidden">
                        <CapaTrazados 
                          modoDibujo={modoDibujo}
                          puntosActuales={puntosActuales}
                          colorActual={polyColor}
                          poligonosGuardados={poligonosFiltrados as any[]}
                          onAgregarPunto={(punto) => setPuntosActuales(prev => [...prev, punto])}
                          onPoligonoClick={handlePoligonoClick}
                        />
                      </div>
                    </div>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          ) : (
            <div className="text-center w-full px-4">
              {canEdit ? (
                <label className="cursor-pointer mx-auto flex flex-col items-center justify-center w-full max-w-md h-72 border-4 border-dashed border-indigo-200 bg-white hover:bg-indigo-50 hover:border-indigo-400 rounded-3xl transition text-indigo-500 shadow-sm z-10 relative">
                  <Upload size={48} className="mb-4 text-indigo-400" />
                  <span className="font-black text-xl text-indigo-700">Subir Croquis (Máx 5MB)</span>
                  <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileUpload} ref={fileInputRef} disabled={isUploading} />
                </label>
              ) : (
                <div className="flex flex-col items-center text-slate-400 bg-white p-10 rounded-3xl shadow-sm border border-slate-200 max-w-sm mx-auto z-10 relative">
                  <MapIcon size={64} className="mb-4 opacity-20" />
                  <p className="font-black text-xl text-slate-600">Croquis no disponible</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TARJETA EN VIVO */}
        {poligonoActivo && (
          <TarjetaTurnoEnVivo 
            poligono={poligonoActivo}
            cajaActual={cajaEnVivoActual}
            rolUsuario={currentUserRole}
            getParticipante={getParticipante}
            onClose={() => setPoligonoActivo(null)}
          />
        )}

        {/* PANEL DE DIBUJO FLOTANTE */}
        {modoDibujo && (
          <PanelDibujo 
            puntosContados={puntosActuales.length}
            nombre={polyName} setNombre={setPolyName}
            color={polyColor} setColor={setPolyColor}
            notas={polyNotas} setNotas={setPolyNotas}
            cajaVinculadaNombre={polyCajaVinculada} setCajaVinculadaNombre={setPolyCajaVinculada}
            visibilidad={polyVisibilidad} setVisibilidad={setPolyVisibilidad}
            nombresCajasDisponibles={nombresCajasDisponibles}
            onDeshacer={() => setPuntosActuales(prev => prev.slice(0, -1))}
            onLimpiar={() => setPuntosActuales([])}
            onCancelar={cancelarDibujo}
            onGuardar={handleGuardarTerritorio}
          />
        )}

      </div>
      <style dangerouslySetInnerHTML={{__html: `.dotted-background { background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 20px 20px; }`}} />
    </div>
  );
};

export default CroquisModal;
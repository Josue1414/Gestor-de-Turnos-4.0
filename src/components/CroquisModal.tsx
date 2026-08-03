// src/components/CroquisModal.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Upload, Map as MapIcon, Trash2, ZoomIn, ZoomOut, Maximize, Loader2, ChevronLeft, ChevronRight, PenTool } from 'lucide-react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { Coordenada, DiaEvento } from '../types';
import CapaTrazados from './CroquisInteractivo/CapaTrazados';
import PanelDibujo from './CroquisInteractivo/PanelDibujo';
import TarjetaTurnoEnVivo, { type PoligonoCroquisExt } from './CroquisInteractivo/TarjetaTurnoEnVivo';

export interface CroquisItem {
  id: string;
  title: string;
  url: string | null;
  poligonos?: any[]; 
}

interface CroquisModalProps {
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
  croquis: CroquisItem[];
  dias?: DiaEvento[]; 
  currentUserRole?: 'SuperAdmin' | 'Supervisor' | 'Administrador' | 'Capitan' | 'Participante';
  
  onSaveCroquis: (file: File | null, croquisId: string) => Promise<void>;
  onSavePoligono?: (poligono: any, croquisId: string) => Promise<void>; 
  onDeletePoligono?: (poligonoId: string, croquisId: string) => Promise<void>;
}

const CroquisModal: React.FC<CroquisModalProps> = ({ 
  isOpen, onClose, canEdit = false, croquis, 
  dias = [], currentUserRole = 'Administrador',
  onSaveCroquis, onSavePoligono, onDeletePoligono
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [localOverride, setLocalOverride] = useState<string | null | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modoDibujo, setModoDibujo] = useState(false);
  const [etapaDibujo, setEtapaDibujo] = useState<'config' | 'trazando'>('config');
  const [puntosActuales, setPuntosActuales] = useState<Coordenada[]>([]);
  const [editingPolyId, setEditingPolyId] = useState<string | null>(null);
  
  const [polyName, setPolyName] = useState('');
  const [polyColor, setPolyColor] = useState('#6366f1');
  const [polyNotas, setPolyNotas] = useState('');
  const [polyVisibilidad, setPolyVisibilidad] = useState<'todos' | 'solo_admins_capitanes'>('todos');
  const [polyMostrarTexto, setPolyMostrarTexto] = useState(true);
  
  const [polyEncargadoNombre, setPolyEncargadoNombre] = useState('');
  const [polyEncargadoTelefono, setPolyEncargadoTelefono] = useState('');
  const [polyDiasSeleccionados, setPolyDiasSeleccionados] = useState<string[]>([]);
  const [polyHorarios, setPolyHorarios] = useState<string[]>([]);

  const [poligonoActivo, setPoligonoActivo] = useState<PoligonoCroquisExt | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      setLocalOverride(undefined);
      setPoligonoActivo(null);
      cancelarDibujo();
    }
  }, [isOpen]);

  const currentItem = croquis?.[activeIndex];
  const imagenUrl = localOverride !== undefined ? localOverride : currentItem?.url;

  // Extraemos fechas únicas con Set para evitar duplicados
  const diasDisponibles = useMemo(() => {
    const nombresDias = dias.map((d, index) => d.fecha || `Día ${index + 1}`);
    return Array.from(new Set(nombresDias));
  }, [dias]);

  const poligonosFiltrados = useMemo(() => {
    const polys = (currentItem?.poligonos || []) as PoligonoCroquisExt[];
    return polys.filter(p => {
      if (modoDibujo) return true; 
      if (currentUserRole === 'SuperAdmin' || currentUserRole === 'Supervisor') return true; 
      // Filtrar la visibilidad restringida para participantes
      if (p.visibilidad === 'solo_admins_capitanes' && currentUserRole === 'Participante') return false;
      
      // DEVOLVER TRUE: Esto corrige que los participantes no vean los croquis (ya no dependemos de un estado estricto "publicado" en datos viejos)
      return true;
    });
  }, [currentItem?.poligonos, modoDibujo, currentUserRole]);

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
        return;
      }
      setIsUploading(true);
      try {
        setLocalOverride(URL.createObjectURL(file));
        await onSaveCroquis(file, currentItem.id);
      } catch (error) {
        setLocalOverride(undefined);
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
    } finally {
      setIsUploading(false);
    }
  };

  const cancelarDibujo = () => {
    setModoDibujo(false);
    setEtapaDibujo('config');
    setEditingPolyId(null);
    setPuntosActuales([]);
    setPolyName('');
    setPolyNotas('');
    setPolyVisibilidad('todos');
    setPolyMostrarTexto(true);
    setPolyEncargadoNombre('');
    setPolyEncargadoTelefono('');
    setPolyDiasSeleccionados([]);
    setPolyHorarios([]);
  };

  const handleGuardarTerritorio = async () => {
    if (!onSavePoligono || !currentItem) return;
    const nuevoPoligono: PoligonoCroquisExt = {
      id: editingPolyId || `poly_${Date.now()}`,
      nombre: polyName.trim(),
      color: polyColor,
      puntos: puntosActuales,
      notas: polyNotas.trim(),
      encargadoNombre: polyEncargadoNombre.trim(),
      encargadoTelefono: polyEncargadoTelefono.trim(),
      diasAplicables: polyDiasSeleccionados,
      horarios: polyHorarios,
      visibilidad: polyVisibilidad,
      estado: 'publicado',
      mostrarTexto: polyMostrarTexto 
    };
    await onSavePoligono(nuevoPoligono, currentItem.id);
    cancelarDibujo();
  };

  const handleDeleteTerritorio = async (id: string) => {
    if (!onDeletePoligono || !currentItem) return;
    await onDeletePoligono(id, currentItem.id);
    setPoligonoActivo(null);
  };

  const iniciarEdicion = (poly: PoligonoCroquisExt) => {
    setEditingPolyId(poly.id);
    setPolyName(poly.nombre);
    setPolyColor(poly.color || '#6366f1');
    setPolyNotas(poly.notas || '');
    setPolyVisibilidad(poly.visibilidad || 'todos');
    setPolyMostrarTexto(poly.mostrarTexto ?? true);
    setPolyEncargadoNombre(poly.encargadoNombre || '');
    setPolyEncargadoTelefono(poly.encargadoTelefono || '');
    setPolyDiasSeleccionados(poly.diasAplicables || []);
    setPolyHorarios(poly.horarios || []);
    setPuntosActuales(poly.puntos || []);
    
    setPoligonoActivo(null);
    setModoDibujo(true);
    setEtapaDibujo('config');
  };

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
                onClick={() => { setModoDibujo(true); setEtapaDibujo('config'); setPoligonoActivo(null); }}
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
              <button onClick={() => cambiarImagen('izq')} className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/80 p-3 rounded-full shadow-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition-all sm:opacity-0 sm:group-hover:opacity-100"><ChevronLeft size={28} /></button>
              <button onClick={() => cambiarImagen('der')} className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/80 p-3 rounded-full shadow-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition-all sm:opacity-0 sm:group-hover:opacity-100"><ChevronRight size={28} /></button>
            </>
          )}

          {isUploading && (
            <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
              <span className="font-bold text-slate-700">Guardando Croquis...</span>
            </div>
          )}

          {imagenUrl ? (
            <TransformWrapper initialScale={1} minScale={0.5} maxScale={8} centerOnInit={true} panning={{ disabled: modoDibujo && etapaDibujo === 'trazando' }} doubleClick={{ disabled: modoDibujo }}>
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
                    <div className="relative inline-flex leading-none shadow-2xl" onClick={() => setPoligonoActivo(null)}>
                      <img src={imagenUrl} alt="Croquis" className="max-w-[1500px] max-h-[80vh] w-auto h-auto object-contain pointer-events-none block" />
                      <div className="absolute inset-0 z-10 w-full h-full">
                        <CapaTrazados 
                          modoDibujo={modoDibujo && etapaDibujo === 'trazando'} puntosActuales={puntosActuales} colorActual={polyColor}
                          poligonosGuardados={poligonosFiltrados as any[]} currentUserRole={currentUserRole}
                          onAgregarPunto={(punto) => setPuntosActuales(prev => [...prev, punto])}
                          onPoligonoClick={setPoligonoActivo}
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

        {poligonoActivo && (
          <TarjetaTurnoEnVivo 
            poligono={poligonoActivo} rolUsuario={currentUserRole}
            onClose={() => setPoligonoActivo(null)} onEdit={iniciarEdicion} onDelete={handleDeleteTerritorio}
          />
        )}

        {modoDibujo && (
          <PanelDibujo 
            etapa={etapaDibujo} onIniciarTrazo={() => setEtapaDibujo('trazando')}
            puntosContados={puntosActuales.length} nombre={polyName} setNombre={setPolyName}
            color={polyColor} setColor={setPolyColor} notas={polyNotas} setNotas={setPolyNotas}
            encargadoNombre={polyEncargadoNombre} setEncargadoNombre={setPolyEncargadoNombre}
            encargadoTelefono={polyEncargadoTelefono} setEncargadoTelefono={setPolyEncargadoTelefono}
            diasDisponibles={diasDisponibles} diasSeleccionados={polyDiasSeleccionados} setDiasSeleccionados={setPolyDiasSeleccionados}
            horarios={polyHorarios} setHorarios={setPolyHorarios}
            visibilidad={polyVisibilidad} setVisibilidad={setPolyVisibilidad}
            mostrarTexto={polyMostrarTexto} setMostrarTexto={setPolyMostrarTexto}
            onDeshacer={() => setPuntosActuales(prev => prev.slice(0, -1))}
            onLimpiar={() => setPuntosActuales([])} onCancelar={cancelarDibujo} onGuardar={handleGuardarTerritorio}
          />
        )}

      </div>
      <style dangerouslySetInnerHTML={{__html: `.dotted-background { background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 20px 20px; } .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }`}} />
    </div>
  );
};

export default CroquisModal;
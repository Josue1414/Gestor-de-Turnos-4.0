import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Map as MapIcon, Trash2, ZoomIn, ZoomOut, Maximize, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export interface CroquisItem {
  id: string;
  title: string;
  url: string | null;
}

interface CroquisModalProps {
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
  croquis: CroquisItem[];
  onSaveCroquis: (file: File | null, croquisId: string) => Promise<void>;
}

const CroquisModal: React.FC<CroquisModalProps> = ({ 
  isOpen, onClose, canEdit = false, croquis, onSaveCroquis
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [localOverride, setLocalOverride] = useState<string | null | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reiniciar estado al abrir
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      setLocalOverride(undefined);
    }
  }, [isOpen]);

  if (!isOpen || !croquis || croquis.length === 0) return null;

  const currentItem = croquis[activeIndex];
  const imagenUrl = localOverride !== undefined ? localOverride : currentItem.url;

  const handleCloseModal = () => {
    if (isUploading) return;
    setLocalOverride(undefined);
    onClose();
  };

  const cambiarImagen = (direccion: 'izq' | 'der') => {
    if (isUploading) return;
    setLocalOverride(undefined);
    if (direccion === 'izq') {
      setActiveIndex(prev => prev > 0 ? prev - 1 : croquis.length - 1);
    } else {
      setActiveIndex(prev => prev < croquis.length - 1 ? prev + 1 : 0);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    if (!confirm("¿Eliminar este croquis?")) return;
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={handleCloseModal} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col h-[85vh] sm:h-[90vh] overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white shrink-0 z-20 shadow-sm">
          <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
            <MapIcon className="text-indigo-500" /> {currentItem.title}
          </h3>
          <div className="flex items-center gap-4">
            {croquis.length > 1 && (
              <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-widest">
                {activeIndex + 1} / {croquis.length}
              </span>
            )}
            <button onClick={handleCloseModal} disabled={isUploading} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-slate-100/50 flex items-center justify-center overflow-hidden dotted-background group">
          
          {/* FLECHAS DE NAVEGACIÓN */}
          {croquis.length > 1 && (
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
            <TransformWrapper initialScale={1} minScale={0.5} maxScale={8} centerOnInit={true}>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-xl border border-slate-200">
                    <button onClick={() => zoomOut()} className="p-2.5 text-slate-600 hover:bg-blue-50 rounded-xl transition"><ZoomOut size={20} /></button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button onClick={() => resetTransform()} className="p-2.5 text-slate-600 hover:bg-blue-50 rounded-xl transition font-bold"><Maximize size={20} /></button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button onClick={() => zoomIn()} className="p-2.5 text-slate-600 hover:bg-blue-50 rounded-xl transition"><ZoomIn size={20} /></button>
                  </div>

                  {canEdit && (
                    <button onClick={handleRemove} className="absolute top-4 right-4 z-10 px-4 py-2.5 bg-red-500 text-white rounded-xl shadow-lg transition hover:bg-red-600 flex items-center gap-2 font-bold">
                      <Trash2 size={18} /> <span className="hidden sm:inline">Borrar Croquis</span>
                    </button>
                  )}

                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={imagenUrl} alt="Croquis" className="max-w-[95%] max-h-[95%] object-contain cursor-grab active:cursor-grabbing drop-shadow-2xl rounded-lg" />
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
      </div>
      <style dangerouslySetInnerHTML={{__html: `.dotted-background { background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 20px 20px; }`}} />
    </div>
  );
};

export default CroquisModal;
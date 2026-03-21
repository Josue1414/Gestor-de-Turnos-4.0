import React, { useState, useEffect } from 'react';
import { X, Upload, Map as MapIcon, Trash2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface CroquisModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const CroquisModal: React.FC<CroquisModalProps> = ({ isOpen, onClose, isAdmin = false }) => {
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const guardada = localStorage.getItem('gestor_croquis');
      if (guardada) setImagenUrl(guardada);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagenUrl(result);
        localStorage.setItem('gestor_croquis', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setImagenUrl(null);
    localStorage.removeItem('gestor_croquis');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
      {/* Fondo oscuro con blur */}
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col h-[85vh] sm:h-[90vh] overflow-hidden">
        
        {/* CABECERA */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white shrink-0 z-20 shadow-sm">
          <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
            <MapIcon className="text-indigo-500" /> Croquis del Evento
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="flex-1 relative bg-slate-100/50 flex items-center justify-center overflow-hidden dotted-background">
          {imagenUrl ? (
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={8} // Permite un zoom bastante profundo
              centerOnInit={true}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* BARRA DE CONTROLES FLOTANTE */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-xl border border-slate-200">
                    <button onClick={() => zoomOut()} className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition" title="Alejar">
                      <ZoomOut size={20} />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button onClick={() => resetTransform()} className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition font-bold text-sm" title="Centrar Imagen">
                      <Maximize size={20} />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button onClick={() => zoomIn()} className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition" title="Acercar">
                      <ZoomIn size={20} />
                    </button>
                  </div>

                  {/* BOTÓN DE ELIMINAR (Solo Admin) */}
                  {isAdmin && (
                    <button 
                      onClick={handleRemove} 
                      className="absolute top-4 right-4 z-10 px-4 py-2.5 bg-red-500 text-white rounded-xl shadow-lg transition hover:bg-red-600 flex items-center gap-2 font-bold"
                    >
                      <Trash2 size={18} /> <span className="hidden sm:inline">Cambiar Croquis</span>
                    </button>
                  )}

                  {/* EL ÁREA QUE SE PUEDE ARRASTRAR Y ZOOMEAR */}
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img 
                      src={imagenUrl} 
                      alt="Croquis del evento" 
                      className="max-w-[95%] max-h-[95%] object-contain cursor-grab active:cursor-grabbing drop-shadow-2xl rounded-lg"
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          ) : (
            <div className="text-center w-full px-4">
              {isAdmin ? (
                <label className="cursor-pointer mx-auto flex flex-col items-center justify-center w-full max-w-md h-72 border-4 border-dashed border-indigo-200 bg-white hover:bg-indigo-50 hover:border-indigo-400 rounded-3xl transition text-indigo-500 shadow-sm">
                  <Upload size={48} className="mb-4 text-indigo-400" />
                  <span className="font-black text-xl text-indigo-700">Subir Croquis</span>
                  <span className="text-sm mt-2 opacity-70 font-bold px-4 text-center">
                    Haz clic aquí para seleccionar una imagen<br/>(PNG, JPG)
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              ) : (
                <div className="flex flex-col items-center text-slate-400 bg-white p-10 rounded-3xl shadow-sm border border-slate-200 max-w-sm mx-auto">
                  <MapIcon size={64} className="mb-4 opacity-20" />
                  <p className="font-black text-xl text-slate-600">Croquis no disponible</p>
                  <p className="text-sm font-medium mt-2 text-center">
                    El administrador aún no ha subido el mapa del evento. Vuelve a revisar más tarde.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Estilo para el fondo punteado (opcional, le da un toque de software de diseño) */}
      <style dangerouslySetInnerHTML={{__html: `
        .dotted-background {
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}} />
    </div>
  );
};

export default CroquisModal;
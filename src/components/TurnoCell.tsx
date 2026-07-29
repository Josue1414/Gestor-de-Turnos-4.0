import React from 'react';
import { Plus, User } from 'lucide-react';

interface TurnoCellProps {
  cajaId: string;
  cajaNombre: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  turno: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participante?: any;
  onAsignar: () => void;
  onOpenInfo: () => void;
}

const TurnoCell: React.FC<TurnoCellProps> = ({ 
  participante, turno, onAsignar, onOpenInfo 
}) => {
  if (participante) {
    return (
      <div 
        onClick={onOpenInfo}
        className="bg-indigo-50 border border-indigo-200 rounded-lg p-1.5 sm:p-2 relative shadow-sm overflow-hidden cursor-pointer hover:bg-indigo-100 hover:border-indigo-400 transition-all group w-full"
      >
        <div className="flex items-center gap-1 font-bold text-indigo-900 text-[10px] sm:text-sm leading-tight break-words">
          <User size={10} className="shrink-0 sm:w-3 sm:h-3" /> 
          <span className="truncate">{participante.nombre}</span>
        </div>
        
        {/* Mostrar indicadores si la caja fue entregada o devuelta */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[8px] sm:text-[9px] text-indigo-500 font-bold uppercase block sm:mt-1">
            Ver detalles
          </span>
          {turno.entregada && <span className="w-2 h-2 rounded-full bg-blue-500" title="Entregada" />}
          {turno.devuelta && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Devuelta" />}
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={onAsignar} 
      className="w-full h-8 sm:h-12 bg-white border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 flex items-center justify-center gap-1 hover:bg-indigo-50 transition-colors shadow-sm overflow-hidden"
    >
      <Plus size={12} className="sm:w-3.5 sm:h-3.5" /> 
      <span className="text-[10px] sm:text-xs font-bold">Asignar</span>
    </button>
  );
};

export default TurnoCell;
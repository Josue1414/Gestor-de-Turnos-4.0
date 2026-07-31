// src/components/TurnoCell.tsx
import React from 'react';
import { Plus, User, AlertCircle, Clock, Bell } from 'lucide-react';

interface TurnoCellProps {
  cajaId: string;
  cajaNombre: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  turno: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participante?: any;
  fechaDia?: string; 
  horaActual?: Date;  
  onAsignar: () => void;
  onOpenInfo: () => void;
}

const TurnoCell: React.FC<TurnoCellProps> = ({ 
  participante, turno, onAsignar, onOpenInfo, fechaDia, horaActual 
}) => {
  
  const pideAsistencia = turno?.solicitaAsistencia;
  let estadoTurno: 'normal' | 'activo' | 'atrasado' = 'normal';

  // --- LÓGICA DE TIEMPO REAL ---
  // Comparamos horas solo si existe la fecha y el hook del reloj fue inyectado
  if (participante && fechaDia && turno.horario && horaActual) {
    const hoyStr = `${horaActual.getFullYear()}-${String(horaActual.getMonth() + 1).padStart(2, '0')}-${String(horaActual.getDate()).padStart(2, '0')}`;
    
    if (hoyStr === fechaDia) {
      const [inicioStr, finStr] = turno.horario.split('-').map((s: string) => s.trim());
      
      const obtenerMinutos = (horaStr: string) => {
        if (!horaStr) return 0;
        const [h, m] = horaStr.split(':').map(Number);
        return (h * 60) + m;
      };

      const minActual = horaActual.getHours() * 60 + horaActual.getMinutes();
      const minInicio = obtenerMinutos(inicioStr);
      const minFin = obtenerMinutos(finStr || inicioStr);

      const isActivo = minActual >= minInicio && minActual <= minFin;
      // NUEVA CONDICIÓN: Sigue atrasado a menos que ambas (entregada Y devuelta) sean true
      const isAtrasado = minActual > minFin && !(turno.entregada && turno.devuelta);

      if (isActivo) estadoTurno = 'activo';
      else if (isAtrasado) estadoTurno = 'atrasado';
    }
  }

  // --- ESTILOS DINÁMICOS ---
  const estilosBase = "border rounded-lg p-1.5 sm:p-2 relative shadow-sm overflow-hidden cursor-pointer transition-all group w-full";
  let estilosEstado = "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 text-indigo-900";
  
  if (pideAsistencia) {
    estilosEstado = "bg-orange-100 border-orange-500 ring-2 ring-orange-500/50 animate-pulse text-orange-900";
  } else if (estadoTurno === 'activo') {
    estilosEstado = "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/50 hover:bg-emerald-100 text-emerald-900";
  } else if (estadoTurno === 'atrasado') {
    // Mantenemos el mismo color azul que el estado normal
    estilosEstado = "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 text-indigo-900";
  }

  if (participante) {
    return (
      <div onClick={onOpenInfo} className={`${estilosBase} ${estilosEstado}`}>
        <div className="flex items-center justify-between gap-1 font-bold text-[10px] sm:text-sm leading-tight break-words">
          <div className="flex items-center gap-1 truncate">
            <User size={10} className="shrink-0 sm:w-3 sm:h-3" /> 
            <span className="truncate">{participante.nombre}</span>
          </div>
          
          {pideAsistencia && <Bell size={12} className="text-orange-600 animate-bounce shrink-0" />}
          {!pideAsistencia && estadoTurno === 'activo' && <Clock size={12} className="text-emerald-600 animate-pulse shrink-0" />}
          {!pideAsistencia && estadoTurno === 'atrasado' && <AlertCircle size={12} className="text-red-600 shrink-0" />}
        </div>
        
        <div className="flex items-center gap-1 mt-1">
          <span className={`text-[8px] sm:text-[9px] font-bold uppercase block sm:mt-1 ${pideAsistencia ? 'text-orange-600' : estadoTurno === 'activo' ? 'text-emerald-600' : estadoTurno === 'atrasado' ? 'text-red-600' : 'text-indigo-500'}`}>
            {pideAsistencia ? '¡Requiere Asistencia!' : estadoTurno === 'activo' ? 'En curso' : estadoTurno === 'atrasado' ? 'Falta' : 'Ver detalles'}
          </span>
          
          {/* Mostramos los puntos azules/verdes solo si NO está atrasado ni pide asistencia */}
          {estadoTurno !== 'atrasado' && !pideAsistencia && (
            <>
              {turno.entregada && <span className="w-2 h-2 rounded-full bg-blue-500" title="Entregada" />}
              {turno.devuelta && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Devuelta" />}
            </>
          )}

          {/* Si está atrasado, mostramos rojo para lo que falte, y su color normal para lo que ya esté listo */}
          {estadoTurno === 'atrasado' && !pideAsistencia && (
            <>
              <span className={`w-2 h-2 rounded-full ${turno.entregada ? 'bg-blue-500' : 'bg-red-500'}`} title={turno.entregada ? "Entregada" : "Falta entregar"} />
              <span className={`w-2 h-2 rounded-full ${turno.devuelta ? 'bg-emerald-500' : 'bg-red-500'}`} title={turno.devuelta ? "Devuelta" : "Falta devolver"} />
            </>
          )}
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
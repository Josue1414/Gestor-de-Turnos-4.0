// src/components/TurnoCell.tsx
import React from 'react';
import { Plus, User, AlertCircle, Clock } from 'lucide-react';

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
  const tipoAlerta = turno?.tipoAsistencia || 'asistencia'; // Identificamos si es 'peligro' o 'asistencia'
  
  let estadoTurno: 'normal' | 'activo' | 'atrasado' = 'normal';

  // LÓGICA DE TIEMPO REAL
  if (fechaDia && turno.horario && horaActual) {
    const hoyStr = `${horaActual.getFullYear()}-${String(horaActual.getMonth() + 1).padStart(2, '0')}-${String(horaActual.getDate()).padStart(2, '0')}`;
    
    if (fechaDia.includes(hoyStr)) {
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
      const isAtrasado = minActual > minFin && !(turno.entregada && turno.devuelta);

      if (isActivo) estadoTurno = 'activo';
      else if (isAtrasado) estadoTurno = 'atrasado';
    }
  }

  // ESTILOS DINÁMICOS
  const estilosBase = "border rounded-lg p-1.5 sm:p-2 relative shadow-sm overflow-hidden cursor-pointer transition-all group w-full";
  let estilosEstado = "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 text-indigo-900";
  
  if (pideAsistencia) {
    // Aplicamos estilos basados en el tipo de alerta
    if (tipoAlerta === 'peligro') {
      estilosEstado = "bg-red-50 border-red-500 ring-2 ring-red-500/50 animate-pulse text-red-900";
    } else {
      estilosEstado = "bg-blue-50 border-blue-500 ring-2 ring-blue-500/50 animate-pulse text-blue-900";
    }
  } else if (estadoTurno === 'activo') {
    estilosEstado = "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/50 hover:bg-emerald-100 text-emerald-900";
  } else if (estadoTurno === 'atrasado') {
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
          
          {/* Renderizado de Emojis Exclusivo según la situación */}
          {pideAsistencia && tipoAlerta === 'peligro' && <span className="animate-bounce shrink-0 text-sm">🚨</span>}
          {pideAsistencia && tipoAlerta === 'asistencia' && <span className="animate-bounce shrink-0 text-sm">✋</span>}
          
          {!pideAsistencia && estadoTurno === 'activo' && <Clock size={12} className="text-emerald-600 animate-pulse shrink-0" />}
          {!pideAsistencia && estadoTurno === 'atrasado' && <AlertCircle size={12} className="text-amber-500 shrink-0" />}
        </div>
        
        <div className="flex items-center gap-1 mt-1">
          <span className={`text-[8px] sm:text-[9px] font-bold uppercase block sm:mt-1 ${pideAsistencia ? (tipoAlerta === 'peligro' ? 'text-red-600' : 'text-blue-600') : estadoTurno === 'activo' ? 'text-emerald-600' : estadoTurno === 'atrasado' ? 'text-amber-500 font-black' : 'text-indigo-500'}`}>
            {pideAsistencia ? (tipoAlerta === 'peligro' ? '¡Emergencia!' : '¡Asistencia!') : estadoTurno === 'activo' ? 'En curso' : estadoTurno === 'atrasado' ? 'Faltante' : 'Ver detalles'}
          </span>
          
          {estadoTurno !== 'atrasado' && !pideAsistencia && (
            <>
              {turno.entregada && <span className="w-2 h-2 rounded-full bg-blue-500" title="Entregada" />}
              {turno.devuelta && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Devuelta" />}
            </>
          )}

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

  // SI EL TURNO ESTÁ LIBRE
  let btnClass = "w-full h-8 sm:h-12 border-2 border-dashed rounded-lg flex items-center justify-center gap-1 transition-colors shadow-sm overflow-hidden text-[10px] sm:text-xs font-bold ";
  
  if (estadoTurno === 'activo') {
    btnClass += "bg-emerald-50 border-emerald-400 text-emerald-600 hover:bg-emerald-100 ring-2 ring-emerald-400/50";
  } else if (estadoTurno === 'atrasado') {
    // SE QUEDA EN GRIS
    btnClass += "bg-slate-50 border-slate-300 text-slate-500 hover:bg-slate-100";
  } else {
    btnClass += "bg-white border-indigo-300 text-indigo-600 hover:bg-indigo-50";
  }

  return (
    <button onClick={onAsignar} className={btnClass}>
      <Plus size={12} className="sm:w-3.5 sm:h-3.5" /> 
      <span>{estadoTurno === 'atrasado' ? 'Faltó Asignar' : estadoTurno === 'activo' ? 'Falta Asignar' : 'Asignar'}</span>
    </button>
  );
};

export default TurnoCell;
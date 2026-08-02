// src/components/CroquisInteractivo/TarjetaTurnoEnVivo.tsx
import React, { useMemo } from 'react';
import { X, Clock, MapPin, Info, Lock } from 'lucide-react';
import type { Caja, Participante, Coordenada } from '../../types';
import { useTiempoReal } from '../../hooks/useTiempoReal';

// Definimos la interfaz local para aceptar las nuevas propiedades
export interface PoligonoCroquisExt {
  id: string;
  nombre: string;
  color: string;
  puntos: Coordenada[];
  notas?: string;
  cajaVinculadaNombre?: string;
  visibilidad?: 'todos' | 'solo_admins_capitanes';
  estado: string;
}

interface TarjetaTurnoEnVivoProps {
  poligono: PoligonoCroquisExt;
  cajaActual?: Caja; // Si está vinculada a una caja del día de hoy
  rolUsuario: 'SuperAdmin' | 'Supervisor' | 'Administrador' | 'Capitan' | 'Participante';
  getParticipante?: (id: string | null) => Participante | undefined;
  onClose: () => void;
}

const TarjetaTurnoEnVivo: React.FC<TarjetaTurnoEnVivoProps> = ({
  poligono, cajaActual, rolUsuario, getParticipante, onClose
}) => {
  const horaActual = useTiempoReal();

  const bloqueadoParaUsuario = poligono.visibilidad === 'solo_admins_capitanes' && rolUsuario === 'Participante';

  // Lógica de "Máquina del Tiempo"
  const turnosOrganizados = useMemo(() => {
    if (!cajaActual || bloqueadoParaUsuario || !cajaActual.turnos) return { anterior: null, actual: null, siguiente: null };

    // 1. Convertimos los horarios a minutos reales para hacer cálculos matemáticos precisos
    const turnosConMinutos = cajaActual.turnos.map(t => {
      const [inicioStr, finStr] = t.horario.split('-');
      const [hIni, mIni] = inicioStr.trim().split(':').map(Number);
      const [hFin, mFin] = finStr.trim().split(':').map(Number);
      return {
        ...t,
        minutosInicio: (hIni * 60) + (mIni || 0),
        minutosFin: (hFin * 60) + (mFin || 0)
      };
    }).sort((a, b) => a.minutosInicio - b.minutosInicio);

    const minutosHoy = (horaActual.getHours() * 60) + horaActual.getMinutes();

    let actual = null;
    let indexActual = -1;

    // 2. Buscar si estamos DENTRO de un turno en este preciso segundo
    for (let i = 0; i < turnosConMinutos.length; i++) {
      if (minutosHoy >= turnosConMinutos[i].minutosInicio && minutosHoy < turnosConMinutos[i].minutosFin) {
        actual = turnosConMinutos[i];
        indexActual = i;
        break;
      }
    }

    // 3. Si nadie está en turno AHORA, buscamos el más próximo en el futuro
    if (!actual) {
      const proximoIndex = turnosConMinutos.findIndex(t => t.minutosInicio > minutosHoy);
      if (proximoIndex !== -1) {
        return {
          anterior: proximoIndex > 0 ? turnosConMinutos[proximoIndex - 1] : null,
          actual: null,
          siguiente: turnosConMinutos[proximoIndex]
        };
      } else {
        // Ya terminaron todos los turnos del día
        return {
          anterior: turnosConMinutos[turnosConMinutos.length - 1],
          actual: null,
          siguiente: null
        };
      }
    }

    return {
      anterior: indexActual > 0 ? turnosConMinutos[indexActual - 1] : null,
      actual: actual,
      siguiente: indexActual < turnosConMinutos.length - 1 ? turnosConMinutos[indexActual + 1] : null
    };
  }, [cajaActual, horaActual, bloqueadoParaUsuario]);

  // Subcomponente para pintar cada filita de turnos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RenderizarFilaTurno = ({ turno, etiqueta, esActual }: { turno: any, etiqueta: string, esActual?: boolean }) => {
    if (!turno) return null;
    const part = getParticipante ? getParticipante(turno.participanteId) : undefined;
    
    return (
      <div className={`p-2 rounded-xl border flex items-center justify-between gap-3 ${esActual ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-wider ${esActual ? 'text-indigo-500' : 'text-slate-400'}`}>{etiqueta}</span>
          <span className={`text-xs font-bold ${esActual ? 'text-indigo-900' : 'text-slate-700'}`}>{turno.horario}</span>
        </div>
        <div className="flex-1 text-right truncate pl-2">
          {part ? (
            <span className={`text-xs font-black truncate ${esActual ? 'text-indigo-700' : 'text-slate-600'}`}>{part.nombre}</span>
          ) : (
            <span className="text-xs font-bold text-slate-400 italic">Turno Libre</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 z-[400] overflow-hidden animate-in slide-in-from-top-4 duration-300">
      
      <div className="p-4 border-b border-slate-100 flex justify-between items-start" style={{ backgroundColor: `${poligono.color}15` }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: poligono.color, color: 'white' }}>
            <MapPin size={16} />
          </div>
          <div className="flex flex-col">
            <h3 className="font-black text-slate-800 leading-tight">{poligono.nombre}</h3>
            {poligono.cajaVinculadaNombre && poligono.cajaVinculadaNombre !== 'Ninguna' && (
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Clock size={10}/> {poligono.cajaVinculadaNombre}
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 bg-white/50 hover:bg-white text-slate-500 rounded-lg transition shadow-sm">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {bloqueadoParaUsuario ? (
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
            <Lock size={24} className="text-slate-400" />
            <p className="text-sm font-bold text-slate-600">Área Restringida</p>
            <p className="text-xs text-slate-400">La información de este territorio es exclusiva para organizadores.</p>
          </div>
        ) : (
          <>
            {poligono.notas && (
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-2 items-start text-amber-800 text-xs font-medium leading-relaxed">
                <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <p>{poligono.notas}</p>
              </div>
            )}

            {cajaActual ? (
              <div className="space-y-1.5">
                <RenderizarFilaTurno turno={turnosOrganizados.anterior} etiqueta="Turno Anterior" />
                <RenderizarFilaTurno turno={turnosOrganizados.actual} etiqueta="En este momento" esActual={true} />
                <RenderizarFilaTurno turno={turnosOrganizados.siguiente} etiqueta="Próximo Turno" />
              </div>
            ) : poligono.cajaVinculadaNombre && poligono.cajaVinculadaNombre !== 'Ninguna' ? (
              <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <p className="text-xs font-bold text-slate-500">Esta área no tiene turnos activos para el día de hoy.</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default TarjetaTurnoEnVivo;
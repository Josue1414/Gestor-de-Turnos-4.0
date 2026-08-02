// src/components/CroquisInteractivo/CapaTrazados.tsx
import React, { useRef } from 'react';
import type { MouseEvent } from 'react';
import type { Coordenada, PoligonoCroquis } from '../../types';

interface CapaTrazadosProps {
  modoDibujo: boolean;
  puntosActuales: Coordenada[];
  colorActual: string;
  poligonosGuardados?: PoligonoCroquis[];
  onAgregarPunto?: (punto: Coordenada) => void;
  onPoligonoClick?: (poligono: PoligonoCroquis) => void;
}

const CapaTrazados: React.FC<CapaTrazadosProps> = ({
  modoDibujo,
  puntosActuales,
  colorActual,
  poligonosGuardados = [],
  onAgregarPunto,
  onPoligonoClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const manejarClic = (e: MouseEvent<SVGSVGElement>) => {
    if (!modoDibujo || !onAgregarPunto || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onAgregarPunto({ x, y });
  };

  const formatearPuntos = (puntos: Coordenada[]) => puntos.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg
      ref={svgRef}
      onClick={manejarClic}
      className={`absolute inset-0 w-full h-full z-10 ${modoDibujo ? 'cursor-crosshair' : 'cursor-default'}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="relieve" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.5" />
        </filter>
      </defs>

      {poligonosGuardados.map((poly) => (
        <polygon
          key={poly.id}
          points={formatearPuntos(poly.puntos)}
          fill={`${poly.color}40`} 
          stroke={poly.color}
          strokeWidth="0.3"
          filter={!modoDibujo ? "url(#relieve)" : ""}
          className={`transition-all duration-300 ${!modoDibujo ? 'cursor-pointer hover:stroke-[0.8] hover:fill-[opacity-0.6]' : 'pointer-events-none opacity-50'}`}
          onClick={(e) => {
            if (!modoDibujo && onPoligonoClick) {
              e.stopPropagation();
              onPoligonoClick(poly);
            }
          }}
        >
          <title>{poly.nombre}</title>
        </polygon>
      ))}

      {modoDibujo && puntosActuales.length > 0 && (
        <>
          <polygon
            points={formatearPuntos(puntosActuales)}
            fill={`${colorActual}30`}
            stroke={colorActual}
            strokeWidth="0.3"
            strokeDasharray="0.5,0.5"
            className="pointer-events-none"
          />
          {puntosActuales.map((punto, i) => (
            <circle
              key={i}
              cx={punto.x}
              cy={punto.y}
              r="0.3" 
              fill="white"
              stroke={colorActual}
              strokeWidth="0.2"
              className="pointer-events-none"
            />
          ))}
        </>
      )}
    </svg>
  );
};

export default CapaTrazados;
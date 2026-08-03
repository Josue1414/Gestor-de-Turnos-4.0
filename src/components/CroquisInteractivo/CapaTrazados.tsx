// src/components/CroquisInteractivo/CapaTrazados.tsx
import React, { useRef } from 'react';
import type { MouseEvent } from 'react';
import type { Coordenada } from '../../types';
import type { PoligonoCroquisExt } from './TarjetaTurnoEnVivo';

interface CapaTrazadosProps {
  modoDibujo: boolean;
  puntosActuales: Coordenada[];
  colorActual: string;
  poligonosGuardados?: PoligonoCroquisExt[];
  currentUserRole?: string;
  onAgregarPunto?: (punto: Coordenada) => void;
  onPoligonoClick?: (poligono: PoligonoCroquisExt) => void;
}

const CapaTrazados: React.FC<CapaTrazadosProps> = ({
  modoDibujo, puntosActuales, colorActual, poligonosGuardados = [], currentUserRole, onAgregarPunto, onPoligonoClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Consideramos editores a todos excepto Participantes
  const esEditor = currentUserRole !== 'Participante';

  const manejarClic = (e: MouseEvent<SVGSVGElement>) => {
    if (!modoDibujo || !onAgregarPunto || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAgregarPunto({ x, y });
  };

  const formatearPuntos = (puntos: Coordenada[]) => puntos.map(p => `${p.x},${p.y}`).join(' ');

  const calcularCentroide = (puntos: Coordenada[]) => {
    if (!puntos || puntos.length === 0) return { x: 50, y: 50 };
    let minX = puntos[0].x, maxX = puntos[0].x;
    let minY = puntos[0].y, maxY = puntos[0].y;
    puntos.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    return { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2 };
  };

  return (
    <svg
      ref={svgRef} onClick={manejarClic}
      className={`absolute inset-0 w-full h-full z-10 ${modoDibujo ? 'cursor-crosshair' : 'cursor-default'}`}
      viewBox="0 0 100 100" preserveAspectRatio="none"
    >
      <defs>
        <filter id="relieve" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.6" />
        </filter>
      </defs>

      {poligonosGuardados.map((poly) => {
        const esTransparente = poly.color === 'transparent';
        // Si es transparente y eres editor, ves un borde punteado gris. Si eres participante, no ves el borde.
        const strokeColor = esTransparente ? (esEditor ? '#94a3b8' : 'transparent') : poly.color;
        const fillColor = esTransparente ? 'transparent' : `${poly.color}1A`;
        const strokeWidth = esTransparente && !esEditor ? '0' : '0.3';
        const strokeDash = esTransparente && esEditor ? '1,1' : 'none';

        return (
          <g key={poly.id}>
            <polygon
              points={formatearPuntos(poly.puntos)}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
              filter={esEditor && !modoDibujo && !esTransparente ? "url(#relieve)" : ""}
              className={`transition-all duration-300 ${!modoDibujo ? 'cursor-pointer hover:stroke-[0.6] hover:fill-[opacity-0.3]' : 'pointer-events-none opacity-50'}`}
              onClick={(e) => {
                if (!modoDibujo && onPoligonoClick) {
                  e.stopPropagation();
                  onPoligonoClick(poly);
                }
              }}
            >
              <title>{poly.nombre}</title>
            </polygon>
            
            {poly.mostrarTexto && (
              <text
                x={calcularCentroide(poly.puntos).x}
                y={calcularCentroide(poly.puntos).y}
                fill={esTransparente ? (esEditor ? '#94a3b8' : 'transparent') : poly.color}
                fontSize="2.5"
                fontWeight="900"
                textAnchor="middle"
                alignmentBaseline="middle"
                className="pointer-events-none select-none"
                style={{ textShadow: esTransparente ? 'none' : '0px 0px 2px white, 0px 0px 4px white' }}
              >
                {poly.nombre}
              </text>
            )}
          </g>
        );
      })}

      {modoDibujo && puntosActuales.length > 0 && (
        <>
          <polygon 
            points={formatearPuntos(puntosActuales)} 
            fill={colorActual === 'transparent' ? 'transparent' : `${colorActual}1A`} 
            stroke={colorActual === 'transparent' ? '#94a3b8' : colorActual} 
            strokeWidth="0.3" strokeDasharray="0.5,0.5" className="pointer-events-none" 
          />
          {puntosActuales.map((punto, i) => (
            <circle key={i} cx={punto.x} cy={punto.y} r="0.3" fill="white" stroke={colorActual === 'transparent' ? '#94a3b8' : colorActual} strokeWidth="0.2" className="pointer-events-none" />
          ))}
        </>
      )}
    </svg>
  );
};

export default CapaTrazados;
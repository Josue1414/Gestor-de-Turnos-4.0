// src/components/CroquisInteractivo/CapaTrazados.tsx
import React, { useRef } from 'react';
import type { Coordenada } from '../../types';
import type { PoligonoCroquisExt } from './TarjetaTurnoEnVivo';

interface CapaTrazadosProps {
  modoDibujo: boolean;
  puntosActuales: Coordenada[];
  // CORRECCIÓN: Tipado que permite actualizaciones dinámicas de estado
  setPuntosActuales: React.Dispatch<React.SetStateAction<Coordenada[]>>;
  formaDibujo: 'libre'|'cuadrado'|'rectangulo'|'circulo';
  colorActual: string;
  poligonosGuardados?: PoligonoCroquisExt[];
  currentUserRole?: string;
  cajasConAlerta?: string[];
  onPoligonoClick?: (poligono: PoligonoCroquisExt) => void;
}

const CapaTrazados: React.FC<CapaTrazadosProps> = ({
  modoDibujo, puntosActuales, setPuntosActuales, formaDibujo, colorActual, poligonosGuardados = [], currentUserRole, cajasConAlerta = [], onPoligonoClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const esEditor = currentUserRole !== 'Participante';

  // REFERENCIA PARA EVITAR PROBLEMAS DE CLOSURE DE REACT EN EVENTOS RÁPIDOS
  const dragInfo = useRef({
    isDragging: false,
    dragType: 'none' as 'none' | 'vertex' | 'center' | 'free',
    vertexIndex: -1,
    startCoords: null as Coordenada | null,
    startPoints: [] as Coordenada[],
    centroid: null as Coordenada | null
  });

  const obtenerCoordenadasSvg = (e: React.PointerEvent<SVGElement>): Coordenada | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    };
  };

  const calcularCentroide = (puntos: Coordenada[]) => {
    if (!puntos || puntos.length === 0) return { x: 50, y: 50 };
    let minX = 100, maxX = 0, minY = 100, maxY = 0;
    puntos.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    return { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2 };
  };

  const calcularBoundingBox = (puntos: Coordenada[]) => {
    if (!puntos || puntos.length === 0) return { x: 50, y: 50, w: 0, h: 0 };
    let minX = 100, maxX = 0, minY = 100, maxY = 0;
    puntos.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    return { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2, w: maxX - minX, h: maxY - minY };
  };

  // EVENTOS DEL MOUSE / TÁCTILES
  const handlePointerDownSVG = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!modoDibujo || dragInfo.current.isDragging) return;

    const coords = obtenerCoordenadasSvg(e);
    if (!coords) return;

    if (puntosActuales.length === 0) {
      if (formaDibujo === 'cuadrado') {
        setPuntosActuales([ {x: coords.x - 5, y: coords.y - 5}, {x: coords.x + 5, y: coords.y - 5}, {x: coords.x + 5, y: coords.y + 5}, {x: coords.x - 5, y: coords.y + 5} ]);
      } else if (formaDibujo === 'rectangulo') {
        setPuntosActuales([ {x: coords.x - 10, y: coords.y - 5}, {x: coords.x + 10, y: coords.y - 5}, {x: coords.x + 10, y: coords.y + 5}, {x: coords.x - 10, y: coords.y + 5} ]);
      } else if (formaDibujo === 'circulo') {
        const pts = [];
        for(let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2;
          pts.push({ x: coords.x + Math.cos(angle) * 5, y: coords.y + Math.sin(angle) * 5 });
        }
        setPuntosActuales(pts);
      } else if (formaDibujo === 'libre') {
        dragInfo.current = { isDragging: true, dragType: 'free', vertexIndex: -1, startCoords: coords, startPoints: [], centroid: null };
        setPuntosActuales([coords]);
      }
    } else if (formaDibujo === 'libre') {
      dragInfo.current = { isDragging: true, dragType: 'free', vertexIndex: -1, startCoords: coords, startPoints: [], centroid: null };
      setPuntosActuales(prev => [...prev, coords]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!modoDibujo || !dragInfo.current.isDragging) return;
    const coords = obtenerCoordenadasSvg(e);
    if (!coords) return;

    const info = dragInfo.current;

    if (info.dragType === 'free') {
      // DIBUJO LIBRE INTELIGENTE
      setPuntosActuales(prev => {
        const last = prev[prev.length - 1];
        if (!last) return [coords];
        if (Math.hypot(coords.x - last.x, coords.y - last.y) > 0.8) {
          return [...prev, coords];
        }
        return prev;
      });
    } else if (info.dragType === 'vertex' && info.centroid) {
      // ESCALADO MATEMÁTICO PROPORCIONAL
      const pOriginal = info.startPoints[info.vertexIndex];
      const distOriginal = Math.hypot(pOriginal.x - info.centroid.x, pOriginal.y - info.centroid.y);
      const distNueva = Math.hypot(coords.x - info.centroid.x, coords.y - info.centroid.y);

      if (distOriginal > 0.1) {
        const scale = distNueva / distOriginal;
        setPuntosActuales(info.startPoints.map(p => ({
          x: info.centroid!.x + (p.x - info.centroid!.x) * scale,
          y: info.centroid!.y + (p.y - info.centroid!.y) * scale
        })));
      }
    } else if (info.dragType === 'center' && info.startCoords) {
      // MOVER TODA LA FIGURA
      const dx = coords.x - info.startCoords.x;
      const dy = coords.y - info.startCoords.y;
      setPuntosActuales(info.startPoints.map(p => ({
        x: p.x + dx,
        y: p.y + dy
      })));
    }
  };

  const handlePointerUp = () => {
    dragInfo.current.isDragging = false;
  };

  const handlePointerDownCentro = (e: React.PointerEvent) => {
    if (!modoDibujo || puntosActuales.length === 0) return;
    e.stopPropagation();
    const coords = obtenerCoordenadasSvg(e as any);
    if (!coords) return;
    dragInfo.current = {
      isDragging: true, dragType: 'center', vertexIndex: -1, 
      startCoords: coords, startPoints: [...puntosActuales], centroid: null
    };
  };

  const handlePointerDownVertice = (e: React.PointerEvent, i: number) => {
    if (!modoDibujo) return;
    e.stopPropagation();
    dragInfo.current = {
      isDragging: true, dragType: 'vertex', vertexIndex: i, 
      startCoords: null, startPoints: [...puntosActuales], centroid: calcularCentroide(puntosActuales)
    };
  };

  const formatearPuntos = (puntos: Coordenada[]) => puntos.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg
      ref={svgRef} 
      onPointerDown={handlePointerDownSVG}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      // CORRECCIÓN PARA MÓVILES: Bloquea el scroll de la pantalla al intentar dibujar
      style={{ touchAction: modoDibujo ? 'none' : 'auto' }}
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
        const tieneAlerta = poly.cajaId && cajasConAlerta.includes(poly.cajaId);
        
        const strokeColor = tieneAlerta ? '#ef4444' : (esTransparente ? (esEditor ? '#94a3b8' : 'transparent') : poly.color);
        const fillColor = tieneAlerta ? '#ef4444' : (esTransparente ? 'transparent' : poly.color);
        const fillOpacity = tieneAlerta ? '0.4' : (esTransparente ? '0' : '0.1'); 
        const strokeWidth = tieneAlerta ? '0.6' : (esTransparente && !esEditor ? '0' : '0.3');
        const strokeDash = esTransparente && esEditor && !tieneAlerta ? '1,1' : 'none';
        
        const animClass = tieneAlerta ? 'animate-pulse drop-shadow-xl' : '';
        const bbox = calcularBoundingBox(poly.puntos);

        // AJUSTE DINÁMICO E INTELIGENTE DEL TAMAÑO DE LA FUENTE
        const textoMostrar = tieneAlerta ? '⚠️' : poly.nombre;
        const debeMostrarTexto = tieneAlerta || poly.mostrarTexto; 
        
        let fontSizeDinamico = 2.5; 
        if (debeMostrarTexto) {
           const anchoLetraAprox = 0.6;
           const maxW = bbox.w * 0.8;
           const maxH = bbox.h * 0.8;
           const calcSizeW = maxW / (textoMostrar.length * anchoLetraAprox);
           
           fontSizeDinamico = Math.min(calcSizeW, maxH, 6);
           if (fontSizeDinamico < 0.5) fontSizeDinamico = 0.5;
        }

        return (
          <g key={poly.id} className={animClass}>
            <polygon
              points={formatearPuntos(poly.puntos)}
              fill={fillColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
              filter={esEditor && !modoDibujo && !esTransparente && !tieneAlerta ? "url(#relieve)" : ""}
              className={`transition-all duration-300 ${!modoDibujo ? 'cursor-pointer hover:stroke-[0.6] hover:fill-opacity-30' : 'pointer-events-none opacity-50'}`}
              onClick={(e) => {
                if (!modoDibujo && onPoligonoClick) {
                  e.stopPropagation();
                  onPoligonoClick(poly);
                }
              }}
            >
              <title>{poly.nombre}</title>
            </polygon>
            
            {debeMostrarTexto && (
              <text
                x={bbox.x}
                y={bbox.y}
                fill={tieneAlerta ? '#ef4444' : (esTransparente ? (esEditor ? '#94a3b8' : 'transparent') : poly.color)}
                fontSize={`${fontSizeDinamico}`}
                fontWeight="900"
                textAnchor="middle"
                alignmentBaseline="middle"
                className="pointer-events-none select-none transition-all duration-300"
                style={{ textShadow: esTransparente && !tieneAlerta ? 'none' : '0px 0px 2px white, 0px 0px 4px white' }}
              >
                {textoMostrar}
              </text>
            )}
          </g>
        );
      })}

      {modoDibujo && puntosActuales.length > 0 && (
        <g>
          <polygon 
            points={formatearPuntos(puntosActuales)} 
            fill={colorActual === 'transparent' ? 'transparent' : `${colorActual}1A`} 
            stroke={colorActual === 'transparent' ? '#94a3b8' : colorActual} 
            strokeWidth="0.3" 
            strokeDasharray={colorActual === 'transparent' ? '1,1' : '0.5,0.5'}
            onPointerDown={handlePointerDownCentro}
            className="cursor-move pointer-events-auto"
            style={{ pointerEvents: 'fill' }} 
          />
          
          {puntosActuales.map((punto, i) => (
            <circle 
              key={i} cx={punto.x} cy={punto.y} r="0.8" 
              fill="white" stroke={colorActual === 'transparent' ? '#94a3b8' : colorActual} strokeWidth="0.2" 
              onPointerDown={(e) => handlePointerDownVertice(e, i)}
              className="cursor-pointer pointer-events-auto transition-transform hover:scale-150" 
            />
          ))}
        </g>
      )}
    </svg>
  );
};

export default CapaTrazados;
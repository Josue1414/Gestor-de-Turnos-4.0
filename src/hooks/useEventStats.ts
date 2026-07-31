// src/hooks/useEventStats.ts
import { useMemo } from 'react';
import type { DiaEvento, Participante } from '../types';

export const useEventStats = (diasFiltrados: DiaEvento[], participantes: Participante[]) => {
  return useMemo(() => {
    let turnosTotales = 0;
    let turnosDisponibles = 0;
    
    const cajasUnicas = new Set<string>();
    const horariosUnicos = new Set<string>();
    const participantesAsignados = new Set<string>();

    diasFiltrados.forEach((dia) => {
      dia.cajas.forEach((caja) => {
        // 1. CORRECCIÓN: Contamos cajas únicas por su NOMBRE, igual que en statsCalculator
        const nombreNormalizado = (caja.nombre || '').trim().toLowerCase();
        if (nombreNormalizado) cajasUnicas.add(nombreNormalizado);
        
        turnosTotales += caja.turnos.length;

        caja.turnos.forEach((turno) => {
          horariosUnicos.add(turno.horario);
          
          if (!turno.participanteId) {
            turnosDisponibles++;
          } else {
            participantesAsignados.add(turno.participanteId);
          }
        });
      });
    });

    const totalParticipantes = participantes.length;
    const inactivos = totalParticipantes - participantesAsignados.size;

    return {
      cajas: cajasUnicas.size,
      horarios: horariosUnicos.size,
      totales: turnosTotales,
      disponibles: turnosDisponibles,
      participantes: totalParticipantes,
      inactivos: inactivos > 0 ? inactivos : 0,
    };
  }, [diasFiltrados, participantes]);
};
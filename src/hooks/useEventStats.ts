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
        // Contamos cajas únicas por su ID
        cajasUnicas.add(caja.id);
        turnosTotales += caja.turnos.length;

        caja.turnos.forEach((turno) => {
          // Contamos horarios únicos (ej. "08:00 - 09:00")
          horariosUnicos.add(turno.horario);
          
          if (!turno.participanteId) {
            turnosDisponibles++;
          } else {
            // Registramos el ID de quien ya tiene turno para calcular inactivos
            participantesAsignados.add(turno.participanteId);
          }
        });
      });
    });

    // La lista de participantes filtrada es la fuente real de la cantidad de usuarios
    const totalParticipantes = participantes.length;
    
    // Inactivos = Total de tu lista menos los que encontramos asignados en algún turno
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
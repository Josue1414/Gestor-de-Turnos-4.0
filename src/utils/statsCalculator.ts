/* eslint-disable @typescript-eslint/no-explicit-any */
// src/utils/statsCalculator.ts

interface Turno { id: string; participanteId: string | null; horario: string; }
interface Caja { id: string; nombre: string; turnos: Turno[]; }
interface Dia { id: string; cajas: Caja[]; cajasEspeciales?: Caja[]; }
interface Participante { id: string; estado?: string; }

export const calculateAdminStats = (dias: Dia[] | any[] = [], participantes: Participante[] | any[] = []) => {
  let totales = 0;
  let disponibles = 0;
  
  const uniqueCajas = new Set<string>();
  const uniqueHorarios = new Set<string>();
  const participantesConTurno = new Set<string>();

  if (Array.isArray(dias)) {
    dias.forEach((dia) => {
      // Extraer cajas normales y especiales robustamente (Firebase a veces manda objetos en lugar de arrays)
      const cajasNormales = Array.isArray(dia.cajas) ? dia.cajas : Object.values(dia.cajas || {});
      const cajasEspeciales = Array.isArray(dia.cajasEspeciales) ? dia.cajasEspeciales : Object.values(dia.cajasEspeciales || {});
      const todasLasCajas = [...cajasNormales, ...cajasEspeciales];

      todasLasCajas.forEach((caja: any) => {
        if (caja.nombre) uniqueCajas.add(caja.nombre.trim().toLowerCase());
        
        const turnos = Array.isArray(caja.turnos) ? caja.turnos : Object.values(caja.turnos || {});
        turnos.forEach((turno: any) => {
          totales++;
          if (turno.horario) uniqueHorarios.add(turno.horario.trim());
          
          if (!turno.participanteId) {
            disponibles++; 
          } else {
            // Normalización vital para el conteo exacto de inactivos
            participantesConTurno.add(String(turno.participanteId).trim());
          }
        });
      });
    });
  }

  // Comparamos el directorio vs los que sí tienen turno
  const inactivos = Array.isArray(participantes) 
    ? participantes.filter(p => !participantesConTurno.has(String(p.id).trim())).length 
    : 0;

  return {
    cajas: uniqueCajas.size,
    horarios: uniqueHorarios.size,
    totales,
    disponibles,
    participantes: Array.isArray(participantes) ? participantes.length : 0,
    inactivos
  };
};
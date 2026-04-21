interface Turno { id: string; participanteId: string | null; horario: string; }
interface Caja { id: string; nombre: string; turnos: Turno[]; }
interface Dia { id: string; cajas: Caja[]; }
interface Participante { id: string; estado?: string; }

export const calculateAdminStats = (dias: Dia[] = [], participantes: Participante[] = []) => {
  let totales = 0;
  let disponibles = 0;
  
  const uniqueCajas = new Set<string>();
  const uniqueHorarios = new Set<string>();
  const participantesConTurno = new Set<string>();

  if (Array.isArray(dias)) {
    dias.forEach((dia) => {
      if (Array.isArray(dia.cajas)) {
        dia.cajas.forEach((caja) => {
          if (caja.nombre) uniqueCajas.add(caja.nombre.trim().toLowerCase());
          
          if (Array.isArray(caja.turnos)) {
            caja.turnos.forEach((turno) => {
              totales++;
              if (turno.horario) uniqueHorarios.add(turno.horario.trim());
              
              if (!turno.participanteId) {
                disponibles++; 
              } else {
                // Normalización vital para el conteo de inactivos
                participantesConTurno.add(String(turno.participanteId).trim());
              }
            });
          }
        });
      }
    });
  }

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
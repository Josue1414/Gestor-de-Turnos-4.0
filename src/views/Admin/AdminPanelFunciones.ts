// src/views/Admin/AdminPanelFunciones.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

export const parseTimeToMinutes = (t: string) => {
  if (!t) return 0;
  const clean = t.toUpperCase().replace(/ A /g, '-').trim();
  const [hStr, mStr] = clean.split(':');
  let h = parseInt(hStr.replace(/\D/g, '')) || 0;
  const m = parseInt((mStr || '0').replace(/\D/g, '')) || 0;
  if (clean.includes('PM') && h !== 12) h += 12;
  if (clean.includes('AM') && h === 12) h = 0;
  return h * 60 + m;
};

export const checkChoque = (h1: string, h2: string) => {
  try {
    const r1 = h1.split('-');
    const r2 = h2.split('-');
    const i1 = parseTimeToMinutes(r1[0]);
    const f1 = r1.length > 1 ? parseTimeToMinutes(r1[1]) : i1 + 59;
    const i2 = parseTimeToMinutes(r2[0]);
    const f2 = r2.length > 1 ? parseTimeToMinutes(r2[1]) : i2 + 59;
    return i1 < f2 && i2 < f1;
  } catch { return false; }
};

export const checkIsEspecial = (c: any): boolean => {
  if (!c || typeof c !== 'object') return false;
  if (c.isEspecial === true || c.especial === true || c.tipo === 'especial') return true;
  if (typeof c.nombre === 'string') {
    const lowerName = c.nombre.toLowerCase();
    return lowerName.includes('especial') || lowerName.includes('vip');
  }
  return false;
};

export const getLocalBusyUserIds = (diaActual: any, horario: string) => {
  if (!diaActual || !horario) return [];
  const busy = new Set<string>();
  const cajasArr = Array.isArray(diaActual.cajas) ? diaActual.cajas : Object.values(diaActual.cajas || {});

  cajasArr.forEach((c: any) => {
     const turnosArr = Array.isArray(c.turnos) ? c.turnos : Object.values(c.turnos || {});
     turnosArr.forEach((t: any) => {
        if (t.participanteId && checkChoque(t.horario, horario)) {
           busy.add(String(t.participanteId).trim());
        }
     });
  });
  return Array.from(busy);
};

export const getSiguienteHorario = (diaActual: any) => {
  const cajasArr = Array.isArray(diaActual?.cajas) ? diaActual.cajas : Object.values(diaActual?.cajas || {});
  const cajasNormales = cajasArr.filter((c: any) => !checkIsEspecial(c));
  const horariosSet = new Set<string>();
  
  cajasNormales.forEach((c: any) => {
     const turnosArr = Array.isArray(c.turnos) ? c.turnos : Object.values(c.turnos || {});
     turnosArr.forEach((t: any) => horariosSet.add(t.horario));
  });
  
  const horarios = Array.from(horariosSet);
  if (horarios.length === 0) return { defaultStart: '08:00', defaultEnd: '09:00' };

  horarios.sort((a, b) => parseTimeToMinutes(a.split('-')[0]) - parseTimeToMinutes(b.split('-')[0]));

  const lastHorario = horarios[horarios.length - 1]; 
  const parts = lastHorario.split('-');
  if (parts.length === 2) {
     const startRaw = parts[1].trim();
     const cleanStr = (s: string) => {
        let [h, m] = s.replace(/[^\d:]/g, '').split(':').map(Number);
        if (s.toLowerCase().includes('pm') && h !== 12) h += 12;
        if (s.toLowerCase().includes('am') && h === 12) h = 0;
        return `${(h||0).toString().padStart(2, '0')}:${(m||0).toString().padStart(2, '0')}`;
     }
     const nextStart = cleanStr(startRaw);
     const [h, m] = nextStart.split(':').map(Number);
     const nextH = (h + 1 < 24 ? h + 1 : 0).toString().padStart(2, '0');
     const nextEnd = `${nextH}:${m.toString().padStart(2, '0')}`;
     
     return { defaultStart: nextStart, defaultEnd: nextEnd };
  }
  return { defaultStart: '08:00', defaultEnd: '09:00' };
};

// MODIFICACIÓN PRINCIPAL: Se recibe el horario a ignorar
export const validarNuevoHorario = (inicio: string, fin: string, diaActual: any, horarioExcluido?: string) => {
  const startMins = parseTimeToMinutes(inicio);
  const endMins = parseTimeToMinutes(fin);

  if (endMins <= startMins) {
    return { error: "⚠️ Horario inválido: La hora de fin debe ser posterior a la hora de inicio. No se permiten horarios que crucen la medianoche hacia el día siguiente." };
  }

  const nuevoHorarioStr = `${inicio} - ${fin}`;
  const cajasArr = Array.isArray(diaActual?.cajas) ? diaActual.cajas : Object.values(diaActual?.cajas || {});
  const cajasNormales = cajasArr.filter((c: any) => !checkIsEspecial(c));
  
  let turnoCruzado = '';
  const isDuplicateOrClash = cajasNormales.some((c: any) => {
    const turnosArr = Array.isArray(c.turnos) ? c.turnos : Object.values(c.turnos || {});
    return turnosArr.some((t: any) => {
      
      // IGNORAMOS EL TURNO SI ES EXACTAMENTE EL QUE ESTAMOS EDITANDO
      if (horarioExcluido && t.horario === horarioExcluido) return false;

      if (checkChoque(t.horario, nuevoHorarioStr)) {
        turnoCruzado = t.horario;
        return true;
      }
      return false;
    });
  });

  if (isDuplicateOrClash) {
    return { clash: true, turnoCruzado };
  }

  return { success: true };
};
import * as XLSX from 'xlsx-js-style';
import type { DiaEvento, Participante } from '../types';

// Extendemos los tipos localmente
type ParticipanteExcel = Participante & { 
  estado?: string; 
  ubicaciones?: string[]; 
  telefono?: string; 
  notas?: string;
  whatsapp?: string;
  notasDisponibilidad?: string;
  organizacion?: string;
  organization?: string;
  organizationLabel?: string;
};

type DiaEventoExcel = DiaEvento & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cajasEspeciales?: any;
};

interface StatsExport {
  cajas: number;
  horarios: number;
  totales: number;
  disponibles: number;
  participantes: number;
  inactivos: number;
}

export const exportToExcel = (
  seccionName: string,
  dias: DiaEventoExcel[],
  participantes: ParticipanteExcel[],
  stats: StatsExport,
  adminInfo?: { name: string; org: string } | null
) => {
  const wb = XLSX.utils.book_new();

  // =========================================================================
  // 1. DEFINICIÓN DE ESTILOS VISUALES
  // =========================================================================
  
  const borderAll = {
    top: { style: "thin", color: { rgb: "CBD5E1" } },
    bottom: { style: "thin", color: { rgb: "CBD5E1" } },
    left: { style: "thin", color: { rgb: "CBD5E1" } },
    right: { style: "thin", color: { rgb: "CBD5E1" } }
  };

  const headerStyle = { 
    font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, 
    fill: { fgColor: { rgb: "1E293B" } }, 
    border: borderAll,
    alignment: { horizontal: "center", vertical: "center", wrapText: true } 
  };

  const titleStyle = { 
    font: { bold: true, sz: 16, color: { rgb: "0F172A" } },
    alignment: { vertical: "center" }
  };

  const labelStyle = { 
    font: { bold: true, color: { rgb: "475569" }, sz: 11 },
    alignment: { vertical: "center" }
  };

  const normalStyle = {
    font: { sz: 11, color: { rgb: "334155" } }, 
    border: borderAll,
    alignment: { vertical: "center", wrapText: true } 
  };

  const normalCenterStyle = {
    ...normalStyle,
    alignment: { horizontal: "center", vertical: "center", wrapText: true }
  };

  const freeSlotStyle = { 
    fill: { fgColor: { rgb: "DCFCE7" } }, 
    font: { color: { rgb: "166534" }, bold: true, sz: 11 }, 
    border: borderAll,
    alignment: { horizontal: "center", vertical: "center", wrapText: true }
  };

  // NUEVO ESTILO: Para celdas de horarios que no aplican a la caja actual
  const notApplicableStyle = {
    fill: { fgColor: { rgb: "E2E8F0" } }, // Fondo gris
    font: { color: { rgb: "64748B" }, bold: true, sz: 11 }, // Letras en gris oscuro
    border: borderAll,
    alignment: { horizontal: "center", vertical: "center", wrapText: true }
  };

  // NUEVO ESTILO: Para los nombres de los participantes (más resaltados)
  const assignedStyle = {
    fill: { fgColor: { rgb: "FFFFFF" } }, 
    font: { color: { rgb: "0F172A" }, bold: true, sz: 12 }, // Color casi negro y letra más grande
    border: borderAll,
    alignment: { horizontal: "center", vertical: "center", wrapText: true }
  };

  const defaultRowHeight = { hpt: 35 };

  // =========================================================================
  // 2. CEREBRO DE CÁLCULO DE ESTADOS E INACTIVOS
  // =========================================================================
  const participantesAsignadosIds = new Set<string>();
  
  dias.forEach(dia => {
    const cajas = Array.isArray(dia.cajas) ? dia.cajas : Object.values(dia.cajas || {});
    const cajasEspeciales = Array.isArray(dia.cajasEspeciales) ? dia.cajasEspeciales : Object.values(dia.cajasEspeciales || {});
    const todasLasCajas = [...cajas, ...cajasEspeciales];

    todasLasCajas.forEach(caja => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      caja.turnos?.forEach((turno: any) => {
        if (turno.participanteId) {
          participantesAsignadosIds.add(String(turno.participanteId));
        }
      });
    });
  });

  let inactivosReales = 0;
  participantes.forEach(p => {
    if (!participantesAsignadosIds.has(String(p.id))) {
      inactivosReales++;
    }
  });

  // =========================================================================
  // HOJA 1: RESUMEN
  // =========================================================================
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumenData: any[][] = [
    [{ v: "Resumen del Evento", s: titleStyle }, { v: seccionName, s: { font: { sz: 14 }, alignment: { vertical: "center" } } }],
    [{ v: "", s: normalStyle }, { v: "", s: normalStyle }],
  ];

  if (adminInfo) {
    resumenData.push([{ v: "Administrador / Responsable", s: labelStyle }, { v: adminInfo.name, s: normalStyle }]);
    resumenData.push([{ v: "Organización / Congregación", s: labelStyle }, { v: adminInfo.org, s: normalStyle }]);
    resumenData.push([{ v: "", s: normalStyle }, { v: "", s: normalStyle }]);
  }

  resumenData.push([
    { v: "Métrica", s: headerStyle }, 
    { v: "Cantidad", s: headerStyle }
  ]);
  resumenData.push([{ v: "Cajas (Áreas)", s: normalStyle }, { v: stats.cajas || 0, s: normalCenterStyle }]);
  resumenData.push([{ v: "Horarios Únicos", s: normalStyle }, { v: stats.horarios || 0, s: normalCenterStyle }]);
  resumenData.push([{ v: "Total de Turnos", s: normalStyle }, { v: stats.totales || 0, s: normalCenterStyle }]);
  resumenData.push([{ v: "Turnos Libres", s: normalStyle }, { v: stats.disponibles || 0, s: normalCenterStyle }]);
  resumenData.push([{ v: "Total Usuarios", s: normalStyle }, { v: stats.participantes || 0, s: normalCenterStyle }]);
  resumenData.push([{ v: "Usuarios Inactivos", s: normalStyle }, { v: inactivosReales, s: normalCenterStyle }]);

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 35 }, { wch: 45 }]; 
  wsResumen['!rows'] = Array(resumenData.length).fill(defaultRowHeight); 
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  // =========================================================================
  // HOJA 2: DIRECTORIO DE PARTICIPANTES
  // =========================================================================
  const etiquetaOrganizacion = participantes.length > 0 && participantes[0].organizationLabel 
    ? participantes[0].organizationLabel 
    : "Congregación / Empresa";

  const dirHeader = [
    { v: "Nombre", s: headerStyle },
    { v: "Estado", s: headerStyle },
    { v: "Teléfono", s: headerStyle },
    { v: "Notas", s: headerStyle },
    { v: etiquetaOrganizacion.toUpperCase(), s: headerStyle }
  ];
  
  const participantesData = participantes.map(p => {
    const estadoReal = participantesAsignadosIds.has(String(p.id)) ? 'Asignado' : 'Inactivo';
    const organizacionReal = p.organizacion || p.organization || 'Sin registrar';

    return [
      { v: p.nombre, s: normalStyle },
      { v: estadoReal, s: normalCenterStyle },
      { v: p.whatsapp || p.telefono || '', s: normalCenterStyle },
      { v: p.notasDisponibilidad || p.notas || '', s: normalStyle },
      { v: organizacionReal, s: normalStyle }
    ];
  });

  const wsParticipantes = XLSX.utils.aoa_to_sheet([dirHeader, ...participantesData]);
  wsParticipantes['!cols'] = [
    { wch: 30 }, { wch: 18 }, { wch: 20 }, { wch: 40 }, { wch: 35 } 
  ];
  wsParticipantes['!rows'] = Array(participantesData.length + 1).fill(defaultRowHeight);
  XLSX.utils.book_append_sheet(wb, wsParticipantes, "Directorio");

  // =========================================================================
  // HOJA 3: MATRIZ DE TURNOS (POR DÍA)
  // =========================================================================
  dias.forEach((dia, index) => {
    const cajas = Array.isArray(dia.cajas) ? dia.cajas : Object.values(dia.cajas || {});
    const cajasEspeciales = Array.isArray(dia.cajasEspeciales) ? dia.cajasEspeciales : Object.values(dia.cajasEspeciales || {});
    const todasLasCajas = [...cajas, ...cajasEspeciales];

    const horariosSet = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    todasLasCajas.forEach(c => c.turnos.forEach((t: any) => { 
      if (t.horario) horariosSet.add(t.horario); 
    }));
    
    const horarios = Array.from(horariosSet).sort((a, b) => {
      const [hA, mA] = a.split('-')[0].trim().split(':').map(Number);
      const [hB, mB] = b.split('-')[0].trim().split(':').map(Number);
      return ((hA || 0) * 60 + (mA || 0)) - ((hB || 0) * 60 + (mB || 0));
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matriz: any[][] = [];
    const nombreDelDia = dia.nombreDia || `Día ${index + 1}`;

    matriz.push([{ v: nombreDelDia.toUpperCase(), s: titleStyle }]);
    matriz.push([]); 

    const headerRow = [
      { v: "Horario", s: headerStyle }, 
      ...todasLasCajas.map(c => ({ v: c.nombre, s: headerStyle }))
    ];
    matriz.push(headerRow);

    horarios.forEach(h => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: any[] = [{ v: h, s: { ...normalCenterStyle, font: { bold: true, color: { rgb: "0F172A" } } } }];
      
      todasLasCajas.forEach(c => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const turno = c.turnos.find((t: any) => t.horario === h);
        
        if (turno && turno.participanteId) {
          const part = participantes.find(p => p.id === turno.participanteId);
          // APLICAMOS EL ESTILO RESALTADO (Letra oscura y más grande)
          row.push({ v: part ? part.nombre : "ID: " + turno.participanteId, s: assignedStyle });
        } else {
          row.push(
            turno 
              ? { v: `[ LIBRE ]\n${h}`, s: freeSlotStyle } 
              // APLICAMOS EL ESTILO DE BLOQUEO "NO APLICA" (Fondo gris)
              : { v: "⊘ No Aplica", s: notApplicableStyle }
          );
        }
      });
      matriz.push(row);
    });

    const wsDia = XLSX.utils.aoa_to_sheet(matriz);
    wsDia['!cols'] = [{ wch: 18 }, ...todasLasCajas.map(() => ({ wch: 30 }))]; 
    wsDia['!rows'] = Array(matriz.length).fill(defaultRowHeight); 

    const nombreHoja = nombreDelDia.substring(0, 31).replace(/[\[\]*\\/?]/g, '');
    XLSX.utils.book_append_sheet(wb, wsDia, nombreHoja);
  });

  // =========================================================================
  // 3. CONSTRUCCIÓN DEL NOMBRE DEL ARCHIVO
  // =========================================================================
  let finalFileName = `Turnos_${seccionName}`;
  
  if (adminInfo) {
    if (adminInfo.name) {
      finalFileName += `_${adminInfo.name}`;
    }
    if (adminInfo.org && adminInfo.org !== 'Sin Organización' && adminInfo.org !== 'Sin registrar') {
      finalFileName += `_${adminInfo.org}`;
    }
  }

  finalFileName = finalFileName.replace(/[\s/\\?*:|"<>\.]+/g, '_') + ".xlsx";
  XLSX.writeFile(wb, finalFileName);
};
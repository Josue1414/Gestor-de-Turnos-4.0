import * as XLSX from 'xlsx-js-style';
import type { DiaEvento, Participante } from '../types';

// Extendemos los tipos localmente
export type ParticipanteExcel = Participante & { 
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

export type DiaEventoExcel = DiaEvento & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cajasEspeciales?: any;
};

export interface StatsExport {
  cajas: number;
  horarios: number;
  totales: number;
  disponibles: number;
  participantes: number;
  inactivos: number;
}

// Función auxiliar para mantener todos tus estilos organizados y reutilizables
const getExcelStyles = () => {
  const borderAll = {
    top: { style: "thin", color: { rgb: "CBD5E1" } },
    bottom: { style: "thin", color: { rgb: "CBD5E1" } },
    left: { style: "thin", color: { rgb: "CBD5E1" } },
    right: { style: "thin", color: { rgb: "CBD5E1" } }
  };
  return {
    borderAll,
    headerStyle: { 
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, 
      fill: { fgColor: { rgb: "1E293B" } }, 
      border: borderAll,
      alignment: { horizontal: "center", vertical: "center", wrapText: true } 
    },
    titleStyle: { 
      font: { bold: true, sz: 16, color: { rgb: "0F172A" } },
      alignment: { vertical: "center", horizontal: "left", indent: 1 }
    },
    labelStyle: { 
      font: { bold: true, color: { rgb: "475569" }, sz: 11 },
      alignment: { vertical: "center", horizontal: "left", indent: 1 }
    },
    normalStyle: {
      font: { sz: 11, color: { rgb: "334155" } }, 
      border: borderAll,
      alignment: { vertical: "center", wrapText: true, horizontal: "left", indent: 1 } 
    },
    normalCenterStyle: {
      font: { sz: 11, color: { rgb: "334155" } }, 
      border: borderAll,
      alignment: { horizontal: "center", vertical: "center", wrapText: true }
    },
    freeSlotStyle: { 
      fill: { fgColor: { rgb: "DCFCE7" } }, 
      font: { color: { rgb: "166534" }, bold: true, sz: 11 }, 
      border: borderAll,
      alignment: { horizontal: "center", vertical: "center", wrapText: true }
    },
    notApplicableStyle: {
      fill: { fgColor: { rgb: "E2E8F0" } }, 
      font: { color: { rgb: "64748B" }, bold: true, sz: 11 }, 
      border: borderAll,
      alignment: { horizontal: "center", vertical: "center", wrapText: true }
    },
    assignedStyle: {
      fill: { fgColor: { rgb: "FFFFFF" } }, 
      font: { color: { rgb: "0F172A" }, bold: true, sz: 12 }, 
      border: borderAll,
      alignment: { horizontal: "center", vertical: "center", wrapText: true }
    },
    linkStyle: {
      font: { sz: 11, color: { rgb: "2563EB" }, underline: true, bold: true }, 
      border: borderAll,
      alignment: { vertical: "center", wrapText: true, horizontal: "left", indent: 1 }
    },
    // NUEVO ESTILO: Enlace de regreso (sin bordes para que parezca un botón flotante)
    backLinkStyle: {
      font: { sz: 11, color: { rgb: "2563EB" }, underline: true, bold: true },
      alignment: { vertical: "center", horizontal: "left", indent: 1 }
    },
    defaultRowHeight: { hpt: 35 }
  };
};

// =========================================================================
// FUNCIÓN 1: EXPORTAR ADMIN INDIVIDUAL (Intacta)
// =========================================================================
export const exportToExcel = (
  seccionName: string,
  dias: DiaEventoExcel[],
  participantes: ParticipanteExcel[],
  stats: StatsExport,
  adminInfo?: { name: string; org: string } | null
) => {
  const wb = XLSX.utils.book_new();
  const styles = getExcelStyles();

  const participantesAsignadosIds = new Set<string>();
  
  dias.forEach(dia => {
    const cajas = Array.isArray(dia.cajas) ? dia.cajas : Object.values(dia.cajas || {});
    const cajasEspeciales = Array.isArray(dia.cajasEspeciales) ? dia.cajasEspeciales : Object.values(dia.cajasEspeciales || {});
    const todasLasCajas = [...cajas, ...cajasEspeciales];

    todasLasCajas.forEach(caja => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      caja.turnos?.forEach((turno: any) => {
        if (turno.participanteId) participantesAsignadosIds.add(String(turno.participanteId));
      });
    });
  });

  let inactivosReales = 0;
  participantes.forEach(p => {
    if (!participantesAsignadosIds.has(String(p.id))) inactivosReales++;
  });

  // HOJA 1: RESUMEN
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumenData: any[][] = [
    [{ v: "Resumen del Evento", s: styles.titleStyle }, { v: seccionName, s: { font: { sz: 14 }, alignment: { vertical: "center", horizontal: "left", indent: 1 } } }],
    [{ v: "", s: styles.normalStyle }, { v: "", s: styles.normalStyle }],
  ];

  if (adminInfo) {
    resumenData.push([{ v: "Administrador / Responsable", s: styles.labelStyle }, { v: adminInfo.name, s: styles.normalStyle }]);
    resumenData.push([{ v: "Organización / Congregación", s: styles.labelStyle }, { v: adminInfo.org, s: styles.normalStyle }]);
    resumenData.push([{ v: "", s: styles.normalStyle }, { v: "", s: styles.normalStyle }]);
  }

  resumenData.push([
    { v: "Métrica", s: styles.headerStyle }, 
    { v: "Cantidad", s: styles.headerStyle }
  ]);
  resumenData.push([{ v: "Cajas (Áreas)", s: styles.normalStyle }, { v: stats.cajas || 0, s: styles.normalCenterStyle }]);
  resumenData.push([{ v: "Horarios Únicos", s: styles.normalStyle }, { v: stats.horarios || 0, s: styles.normalCenterStyle }]);
  resumenData.push([{ v: "Total de Turnos", s: styles.normalStyle }, { v: stats.totales || 0, s: styles.normalCenterStyle }]);
  resumenData.push([{ v: "Turnos Libres", s: styles.normalStyle }, { v: stats.disponibles || 0, s: styles.normalCenterStyle }]);
  resumenData.push([{ v: "Total Usuarios", s: styles.normalStyle }, { v: stats.participantes || 0, s: styles.normalCenterStyle }]);
  resumenData.push([{ v: "Usuarios Inactivos", s: styles.normalStyle }, { v: inactivosReales, s: styles.normalCenterStyle }]);

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 35 }, { wch: 45 }]; 
  wsResumen['!rows'] = Array(resumenData.length).fill(styles.defaultRowHeight); 
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  // HOJA 2: DIRECTORIO
  const etiquetaOrganizacion = participantes.length > 0 && participantes[0].organizationLabel 
    ? participantes[0].organizationLabel : "Congregación / Empresa";

  const dirHeader = [
    { v: "Nombre", s: styles.headerStyle },
    { v: "Estado", s: styles.headerStyle },
    { v: "Teléfono", s: styles.headerStyle },
    { v: "Notas", s: styles.headerStyle },
    { v: etiquetaOrganizacion.toUpperCase(), s: styles.headerStyle }
  ];
  
  const participantesData = participantes.map(p => {
    const estadoReal = participantesAsignadosIds.has(String(p.id)) ? 'Asignado' : 'Inactivo';
    const organizacionReal = p.organizacion || p.organization || 'Sin registrar';
    return [
      { v: p.nombre, s: styles.normalStyle },
      { v: estadoReal, s: styles.normalCenterStyle },
      { v: p.whatsapp || p.telefono || '', s: styles.normalCenterStyle },
      { v: p.notasDisponibilidad || p.notas || '', s: styles.normalStyle },
      { v: organizacionReal, s: styles.normalStyle }
    ];
  });

  const wsParticipantes = XLSX.utils.aoa_to_sheet([dirHeader, ...participantesData]);
  wsParticipantes['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 20 }, { wch: 40 }, { wch: 35 }];
  wsParticipantes['!rows'] = Array(participantesData.length + 1).fill(styles.defaultRowHeight);
  XLSX.utils.book_append_sheet(wb, wsParticipantes, "Directorio");

  // HOJA 3: MATRICES DE DÍAS
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

    matriz.push([{ v: nombreDelDia.toUpperCase(), s: styles.titleStyle }]);
    matriz.push([]); 

    const headerRow = [
      { v: "Horario", s: styles.headerStyle }, 
      ...todasLasCajas.map(c => ({ v: c.nombre, s: styles.headerStyle }))
    ];
    matriz.push(headerRow);

    horarios.forEach(h => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: any[] = [{ v: h, s: { ...styles.normalCenterStyle, font: { bold: true, color: { rgb: "0F172A" } } } }];
      
      todasLasCajas.forEach(c => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const turno = c.turnos.find((t: any) => t.horario === h);
        if (turno && turno.participanteId) {
          const part = participantes.find(p => p.id === turno.participanteId);
          row.push({ v: part ? part.nombre : "ID: " + turno.participanteId, s: styles.assignedStyle });
        } else {
          row.push(
            turno 
              ? { v: `[ LIBRE ]\n${h}`, s: styles.freeSlotStyle } 
              : { v: "⊘ No Aplica", s: styles.notApplicableStyle }
          );
        }
      });
      matriz.push(row);
    });

    const wsDia = XLSX.utils.aoa_to_sheet(matriz);
    wsDia['!cols'] = [{ wch: 18 }, ...todasLasCajas.map(() => ({ wch: 30 }))]; 
    wsDia['!rows'] = Array(matriz.length).fill(styles.defaultRowHeight); 

    const nombreHoja = nombreDelDia.substring(0, 31).replace(/[\[\]*\\/?]/g, '');
    XLSX.utils.book_append_sheet(wb, wsDia, nombreHoja);
  });

  let finalFileName = `Turnos_${seccionName}`;
  if (adminInfo) {
    if (adminInfo.name) finalFileName += `_${adminInfo.name}`;
    if (adminInfo.org && adminInfo.org !== 'Sin Organización' && adminInfo.org !== 'Sin registrar') finalFileName += `_${adminInfo.org}`;
  }
  finalFileName = finalFileName.replace(/[\s/\\?*:|"<>\.]+/g, '_') + ".xlsx";
  XLSX.writeFile(wb, finalFileName);
};


// =========================================================================
// FUNCIÓN 2: EXPORTAR EXCEL GLOBAL (CON ENLACES DE IDA Y VUELTA)
// =========================================================================
export const exportGlobalToExcel = (
  eventoNombre: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admins: any[],
  diasPorAdmin: Record<string, DiaEventoExcel[]>,
  participantesPorAdmin: Record<string, ParticipanteExcel[]>
) => {
  const wb = XLSX.utils.book_new();
  const styles = getExcelStyles();

  // 1. CÁLCULO DE MÉTRICAS GLOBALES
  let gCajas = 0, gHorarios = 0, gTotales = 0, gDisponibles = 0, gParticipantes = 0, gInactivos = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const directorioGlobal: any[] = []; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datosParaIndice: any[] = []; 

  // Variables para guardar las hojas y su nombre exacto
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hojasAdminsGeneradas: { nombreHoja: string, ws: any }[] = [];
  const adminPrimeraHojaMap: Record<string, string> = {}; 

  admins.forEach(admin => {
    const dias = diasPorAdmin[admin.id] || [];
    const partes = participantesPorAdmin[admin.id] || [];
    
    let localCajas = 0, localTotales = 0, localDisponibles = 0;
    const localHorarios = new Set<string>();
    const asignadosIds = new Set<string>();

    dias.forEach(d => {
      const cajas = Array.isArray(d.cajas) ? d.cajas : Object.values(d.cajas || {});
      const cajasEsp = Array.isArray(d.cajasEspeciales) ? d.cajasEspeciales : Object.values(d.cajasEspeciales || {});
      const todas = [...cajas, ...cajasEsp];
      
      localCajas += todas.length;
      todas.forEach(c => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        c.turnos?.forEach((t: any) => {
          localTotales++;
          if(t.horario) localHorarios.add(t.horario);
          if(t.participanteId) asignadosIds.add(String(t.participanteId));
          else localDisponibles++;
        });
      });
    });

    let localInactivos = 0;
    partes.forEach(p => {
      const isAsignado = asignadosIds.has(String(p.id));
      if(!isAsignado) localInactivos++;

      directorioGlobal.push([
        { v: admin.name || 'Sin Asignar', s: styles.normalCenterStyle },
        { v: p.nombre, s: styles.normalStyle },
        { v: isAsignado ? 'Asignado' : 'Inactivo', s: styles.normalCenterStyle },
        { v: p.whatsapp || p.telefono || '', s: styles.normalCenterStyle },
        { v: p.notasDisponibilidad || p.notas || '', s: styles.normalStyle },
        { v: p.organizacion || p.organization || 'Sin registrar', s: styles.normalStyle }
      ]);
    });

    datosParaIndice.push({
      id: admin.id,
      name: admin.name || 'Sin Asignar',
      org: admin.organization || admin.org || 'Sin registrar',
      diasConfigurados: dias.length,
      cajasTotal: localCajas,
      turnosTotal: localTotales
    });

    gCajas += localCajas;
    gHorarios += localHorarios.size; 
    gTotales += localTotales;
    gDisponibles += localDisponibles;
    gParticipantes += partes.length;
    gInactivos += localInactivos;

    // --- CONSTRUCCIÓN DE LAS HOJAS DE ESTE ADMIN ---
    dias.forEach((dia, idxDia) => {
      const cajas = Array.isArray(dia.cajas) ? dia.cajas : Object.values(dia.cajas || {});
      const cajasEspeciales = Array.isArray(dia.cajasEspeciales) ? dia.cajasEspeciales : Object.values(dia.cajasEspeciales || {});
      const todasLasCajas = [...cajas, ...cajasEspeciales];

      if (todasLasCajas.length === 0) return;

      const horariosSet = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      todasLasCajas.forEach(c => c.turnos.forEach((t: any) => { if (t.horario) horariosSet.add(t.horario); }));
      
      const horarios = Array.from(horariosSet).sort((a, b) => {
        const [hA, mA] = a.split('-')[0].trim().split(':').map(Number);
        const [hB, mB] = b.split('-')[0].trim().split(':').map(Number);
        return ((hA || 0) * 60 + (mA || 0)) - ((hB || 0) * 60 + (mB || 0));
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matriz: any[][] = [];
      const nombreDelDia = dia.nombreDia || `Día`;

      // 1. INYECTAMOS EL BOTÓN DE REGRESO EN LA FILA 1
      matriz.push([{ v: "⬅ Volver al Índice de Áreas", s: styles.backLinkStyle }]);
      // 2. TÍTULO EN LA FILA 2
      matriz.push([{ v: `ÁREA: ${admin.name.toUpperCase()} - ${nombreDelDia.toUpperCase()}`, s: styles.titleStyle }]);
      matriz.push([]); 

      const headerRow = [
        { v: "Horario", s: styles.headerStyle }, 
        ...todasLasCajas.map(c => ({ v: c.nombre, s: styles.headerStyle }))
      ];
      matriz.push(headerRow);

      horarios.forEach(h => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row: any[] = [{ v: h, s: { ...styles.normalCenterStyle, font: { bold: true, color: { rgb: "0F172A" } } } }];
        
        todasLasCajas.forEach(c => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const turno = c.turnos.find((t: any) => t.horario === h);
          if (turno && turno.participanteId) {
            const part = partes.find(p => p.id === turno.participanteId);
            row.push({ v: part ? part.nombre : "ID: " + turno.participanteId, s: styles.assignedStyle });
          } else {
            row.push(
              turno 
                ? { v: `[ LIBRE ]\n${h}`, s: styles.freeSlotStyle } 
                : { v: "⊘ No Aplica", s: styles.notApplicableStyle }
            );
          }
        });
        matriz.push(row);
      });

      const wsDia = XLSX.utils.aoa_to_sheet(matriz);
      wsDia['!cols'] = [{ wch: 18 }, ...todasLasCajas.map(() => ({ wch: 30 }))]; 
      wsDia['!rows'] = Array(matriz.length).fill(styles.defaultRowHeight); 

      // MAGIA: Configuramos la celda A1 para que regrese al índice
      if (wsDia['A1']) {
        wsDia['A1'].l = { Target: "#'Índice de Áreas'!A1", Tooltip: "Regresar al índice principal" };
      }
      
      // Combinamos A1 y B1 para asegurarnos de que el texto del enlace tenga espacio suficiente
      wsDia['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
      ];

      // Excel max sheet name is 31 chars. Make it safe and unique.
      let nombreHojaRaw = `${admin.name.substring(0, 15)} - ${nombreDelDia.substring(0, 10)}`;
      nombreHojaRaw = nombreHojaRaw.replace(/[\[\]*\\/?]/g, ''); 
      
      let count = 1;
      let sheetNameFinal = nombreHojaRaw;
      while (hojasAdminsGeneradas.some(h => h.nombreHoja === sheetNameFinal)) {
        sheetNameFinal = `${nombreHojaRaw.substring(0, 27)} (${count})`;
        count++;
      }

      hojasAdminsGeneradas.push({ nombreHoja: sheetNameFinal, ws: wsDia });
      
      if (idxDia === 0) {
        adminPrimeraHojaMap[admin.id] = sheetNameFinal;
      }
    });
  });

  // --- HOJA 1: RESUMEN GLOBAL ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumenData: any[][] = [
    [{ v: "Resumen Global del Evento", s: styles.titleStyle }, { v: eventoNombre, s: { font: { sz: 14 }, alignment: { vertical: "center", horizontal: "left", indent: 1 } } }],
    [{ v: "Total Administradores", s: styles.labelStyle }, { v: admins.length, s: styles.normalStyle }],
    [{ v: "", s: styles.normalStyle }, { v: "", s: styles.normalStyle }],
    [{ v: "Métrica", s: styles.headerStyle }, { v: "Cantidad Total", s: styles.headerStyle }],
    [{ v: "Cajas Totales (Áreas)", s: styles.normalStyle }, { v: gCajas, s: styles.normalCenterStyle }],
    [{ v: "Turnos Totales Creados", s: styles.normalStyle }, { v: gTotales, s: styles.normalCenterStyle }],
    [{ v: "Turnos Libres Disponibles", s: styles.normalStyle }, { v: gDisponibles, s: styles.normalCenterStyle }],
    [{ v: "Usuarios Totales", s: styles.normalStyle }, { v: gParticipantes, s: styles.normalCenterStyle }],
    [{ v: "Usuarios Inactivos", s: styles.normalStyle }, { v: gInactivos, s: styles.normalCenterStyle }],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 35 }, { wch: 45 }]; 
  wsResumen['!rows'] = Array(resumenData.length).fill(styles.defaultRowHeight); 


  // --- HOJA 2: ÍNDICE DE ÁREAS (DINÁMICO CON ENLACES) ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const indiceData: any[][] = [
    [{ v: "Índice de Administradores y Áreas", s: styles.titleStyle }],
    [{ v: "Da clic en el nombre subrayado para viajar directamente a los turnos de ese administrador.", s: { ...styles.normalStyle, font: { sz: 10, italic: true } } }],
    [],
    [
      { v: "Administrador / Área", s: styles.headerStyle },
      { v: "Organización", s: styles.headerStyle },
      { v: "Días Registrados", s: styles.headerStyle },
      { v: "Total Cajas", s: styles.headerStyle },
      { v: "Total Turnos", s: styles.headerStyle },
      { v: "Ir a Pestaña", s: styles.headerStyle }
    ]
  ];

  datosParaIndice.forEach(info => {
    const primerHojaDelAdmin = adminPrimeraHojaMap[info.id];
    const tieneHoja = !!primerHojaDelAdmin;

    indiceData.push([
      { v: info.name, s: tieneHoja ? styles.linkStyle : styles.normalStyle },
      { v: info.org, s: styles.normalStyle },
      { v: info.diasConfigurados, s: styles.normalCenterStyle },
      { v: info.cajasTotal, s: styles.normalCenterStyle },
      { v: info.turnosTotal, s: styles.normalCenterStyle },
      { v: tieneHoja ? "➡️ Ver Horarios" : "Sin Configurar", s: tieneHoja ? styles.linkStyle : styles.notApplicableStyle }
    ]);
  });

  const wsIndice = XLSX.utils.aoa_to_sheet(indiceData);
  wsIndice['!cols'] = [{ wch: 35 }, { wch: 35 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];
  wsIndice['!rows'] = Array(indiceData.length).fill(styles.defaultRowHeight);
  wsIndice['!merges'] = [{ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }];

  // Inyectamos los hipervínculos en el índice
  datosParaIndice.forEach((info, idx) => {
    const primerHojaDelAdmin = adminPrimeraHojaMap[info.id];
    if (primerHojaDelAdmin) {
      const rowIndex = 4 + idx; 
      const celdaNombre = XLSX.utils.encode_cell({ c: 0, r: rowIndex }); 
      const celdaAccion = XLSX.utils.encode_cell({ c: 5, r: rowIndex }); 
      
      const linkProps = { Target: `#'${primerHojaDelAdmin}'!A1`, Tooltip: `Ver matriz de ${info.name}` };
      
      if (wsIndice[celdaNombre]) wsIndice[celdaNombre].l = linkProps;
      if (wsIndice[celdaAccion]) wsIndice[celdaAccion].l = linkProps;
    }
  });


  // --- HOJA 3: DIRECTORIO GLOBAL ---
  const dirHeader = [
    { v: "Área / Admin", s: styles.headerStyle },
    { v: "Nombre Participante", s: styles.headerStyle },
    { v: "Estado", s: styles.headerStyle },
    { v: "Teléfono", s: styles.headerStyle },
    { v: "Notas", s: styles.headerStyle },
    { v: "Organización", s: styles.headerStyle }
  ];
  
  const wsParticipantes = XLSX.utils.aoa_to_sheet([dirHeader, ...directorioGlobal]);
  wsParticipantes['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 20 }, { wch: 40 }, { wch: 35 }];
  wsParticipantes['!rows'] = Array(directorioGlobal.length + 1).fill(styles.defaultRowHeight);

  // =========================================================================
  // ENSAMBLAJE FINAL DEL ARCHIVO 
  // =========================================================================
  
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Global");
  XLSX.utils.book_append_sheet(wb, wsIndice, "Índice de Áreas"); 
  XLSX.utils.book_append_sheet(wb, wsParticipantes, "Directorio Global");
  
  hojasAdminsGeneradas.forEach(hojaObj => {
    XLSX.utils.book_append_sheet(wb, hojaObj.ws, hojaObj.nombreHoja);
  });

  const finalFileName = `EventoGlobal_${eventoNombre.replace(/[\s/\\?*:|"<>\.]+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, finalFileName);
};
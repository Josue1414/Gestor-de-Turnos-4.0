// src/utils/excelAdminCapitan.ts
import * as XLSX from 'xlsx-js-style';

// 1. Importamos solo los tipos usando "import type"
import type { 
  DiaEventoExcel, 
  ParticipanteExcel, 
  StatsExport 
} from './excelCompartido';

// 2. Importamos las funciones normales
import { 
  getExcelStyles, 
  getDiasActivos 
} from './excelCompartido';

// =========================================================================
// FUNCIÓN 1: EXPORTAR ADMIN / CAPITÁN (Local)
// =========================================================================
export const exportToExcel = (
  seccionName: string,
  dias: DiaEventoExcel[],
  participantes: ParticipanteExcel[],
  _stats: StatsExport, // <-- Agregamos el guion bajo aquí
  adminInfo?: { name: string; org: string } | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  capitanes: any[] = [], 
  isCapitan: boolean = false 
) => {
  const wb = XLSX.utils.book_new();
  const styles = getExcelStyles();
  const diasActivos = getDiasActivos(dias);

  const participantesAsignadosIds = new Set<string>();
  const cajasUnicas = new Set<string>();
  const horariosUnicos = new Set<string>();
  let turnosTotales = 0;
  let turnosLibres = 0;

  diasActivos.forEach(dia => {
    const cajas = Array.isArray(dia.cajas) ? dia.cajas : Object.values(dia.cajas || {});
    const cajasEspeciales = Array.isArray(dia.cajasEspeciales) ? dia.cajasEspeciales : Object.values(dia.cajasEspeciales || {});
    const todasLasCajas = [...cajas, ...cajasEspeciales];

    todasLasCajas.forEach(caja => {
      cajasUnicas.add(caja.nombre);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      caja.turnos?.forEach((turno: any) => {
        turnosTotales++;
        if (turno.horario) horariosUnicos.add(turno.horario);
        if (turno.participanteId) {
          participantesAsignadosIds.add(String(turno.participanteId));
        } else {
          turnosLibres++;
        }
      });
    });
  });

  const participantesUnicosMap = new Map();
  participantes.forEach(p => participantesUnicosMap.set(p.id, p));
  const participantesUnicos = Array.from(participantesUnicosMap.values());

  let inactivosReales = 0;
  participantesUnicos.forEach(p => {
    if (!participantesAsignadosIds.has(String(p.id))) inactivosReales++;
  });

  const tituloReporte = isCapitan ? `REPORTE DE EQUIPO: ${adminInfo?.name?.toUpperCase() || 'CAPITÁN'}` : `REPORTE DE ÁREA: ${seccionName.toUpperCase()}`;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumenData: any[][] = [
    [{ v: tituloReporte, s: styles.titleStyle }, { v: "", s: styles.titleStyle }],
    [{ v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }],
  ];

  if (adminInfo && !isCapitan) {
    resumenData.push([{ v: "Administrador / Responsable", s: styles.labelStyle }, { v: adminInfo.name, s: styles.normalStyle }]);
    resumenData.push([{ v: "Organización / Congregación", s: styles.labelStyle }, { v: adminInfo.org, s: styles.normalStyle }]);
    resumenData.push([{ v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }]);
  }

  resumenData.push([
    { v: "Métrica del Área", s: styles.headerStyle }, 
    { v: "Cantidad Total", s: styles.headerStyle }
  ]);
  resumenData.push([{ v: "Días Activos", s: styles.normalStyle }, { v: diasActivos.length || 0, s: styles.normalCenterStyle }]);
  resumenData.push([{ v: "Cajas Totales (Únicas)", s: styles.normalStyle }, { v: cajasUnicas.size || 0, s: styles.normalCenterStyle }]);
  resumenData.push([{ v: "Horarios Diferentes", s: styles.normalStyle }, { v: horariosUnicos.size || 0, s: styles.normalCenterStyle }]);
  resumenData.push([{ v: "Total de Turnos", s: styles.normalStyle }, { v: turnosTotales || 0, s: styles.normalCenterStyle }]);
  resumenData.push([{ v: "Turnos Libres", s: styles.normalStyle }, { v: turnosLibres || 0, s: styles.normalCenterStyle }]);
  
  if (!isCapitan && capitanes.length > 0) {
    resumenData.push([{ v: "Capitanes a Cargo", s: styles.normalStyle }, { v: capitanes.length, s: styles.normalCenterStyle }]);
  }

  resumenData.push([{ v: "Total Usuarios", s: styles.normalStyle }, { v: participantesUnicos.length || 0, s: styles.normalCenterStyle }]);
  resumenData.push([{ v: "Usuarios Inactivos", s: styles.normalStyle }, { v: inactivosReales, s: styles.normalCenterStyle }]);

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 35 }, { wch: 45 }]; 
  wsResumen['!rows'] = Array(resumenData.length).fill(styles.defaultRowHeight); 
  
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, 
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }  
  ];
  if (adminInfo && !isCapitan) {
    merges.push({ s: { r: 4, c: 0 }, e: { r: 4, c: 1 } }); 
  }
  wsResumen['!merges'] = merges;
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  if (!isCapitan && capitanes.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const capData: any[][] = [
      [{ v: "Lista de Capitanes a Cargo", s: styles.titleStyle }, { v: "", s: styles.titleStyle }, { v: "", s: styles.titleStyle }],
      [{ v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }],
      [
        { v: "Nombre del Capitán", s: styles.headerStyle },
        { v: "Usuario de Acceso", s: styles.headerStyle },
        { v: "Total Cajas Asignadas", s: styles.headerStyle }
      ]
    ];
    
    capitanes.forEach(cap => {
      capData.push([
        { v: cap.nombre, s: styles.normalStyle },
        { v: cap.usuario, s: styles.normalCenterStyle },
        { v: cap.cajasAsignadas?.length || 0, s: styles.normalCenterStyle }
      ]);
    });

    const wsCapitanes = XLSX.utils.aoa_to_sheet(capData);
    wsCapitanes['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 25 }];
    wsCapitanes['!rows'] = Array(capData.length).fill(styles.defaultRowHeight);
    wsCapitanes['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }
    ];
    XLSX.utils.book_append_sheet(wb, wsCapitanes, "Resumen Capitanes");
  }

  const etiquetaOrganizacion = participantesUnicos.length > 0 && participantesUnicos[0].organizationLabel 
    ? participantesUnicos[0].organizationLabel : "Organización";

  const dirHeader = [
    { v: "Nombre", s: styles.headerStyle },
    { v: "Estado", s: styles.headerStyle },
    { v: "Teléfono", s: styles.headerStyle },
    { v: "Notas", s: styles.headerStyle },
    { v: etiquetaOrganizacion.toUpperCase(), s: styles.headerStyle }
  ];

  if (!isCapitan) {
    dirHeader.push({ v: "ORIGEN / CREADOR", s: styles.headerStyle });
  }
  
  const participantesData = participantesUnicos.map(p => {
    const isAsignado = participantesAsignadosIds.has(String(p.id));
    const organizacionReal = p.organizacion || p.organization || 'Sin registrar';
    
    const row = [
      { v: p.nombre, s: styles.normalStyle },
      { v: isAsignado ? 'Asignado' : 'Inactivo', s: isAsignado ? styles.assignedStatusStyle : styles.inactiveStatusStyle },
      { v: p.whatsapp || p.telefono || '', s: styles.normalCenterStyle },
      { v: p.notasDisponibilidad || p.notas || '', s: styles.normalStyle },
      { v: organizacionReal, s: styles.normalStyle }
    ];
    if (!isCapitan) {
      row.push({ v: p.creador || 'Admin', s: styles.normalCenterStyle });
    }
    return row;
  });

  const wsParticipantes = XLSX.utils.aoa_to_sheet([dirHeader, ...participantesData]);
  wsParticipantes['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 20 }, { wch: 40 }, { wch: 35 }];
  if (!isCapitan) wsParticipantes['!cols'].push({ wch: 25 });
  wsParticipantes['!rows'] = Array(participantesData.length + 1).fill(styles.defaultRowHeight);
  wsParticipantes['!autofilter'] = { ref: isCapitan ? "A1:E1" : "A1:F1" };

  XLSX.utils.book_append_sheet(wb, wsParticipantes, "Directorio");

  diasActivos.forEach((dia, index) => {
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

    matriz.push([{ v: `${isCapitan ? 'EQUIPO' : 'ÁREA'}: ${adminInfo?.name?.toUpperCase() || ''} - ${nombreDelDia.toUpperCase()}`, s: styles.titleStyle }]);
    matriz.push([]); 

    const headerRow = [
      { v: "Horario", s: styles.headerStyle }, 
      ...todasLasCajas.map(c => {
        const capitanDueño = capitanes.find(cap => cap.cajasAsignadas?.includes(c.id));
        let headerText = c.nombre;
        if (!isCapitan) {
            headerText += capitanDueño ? `\n(Cap: ${capitanDueño.nombre})` : `\n(Admin)`;
        }
        return { v: headerText, s: styles.headerStyle };
      })
    ];
    matriz.push(headerRow);

    horarios.forEach(h => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: any[] = [{ v: h, s: { ...styles.normalCenterStyle, font: { bold: true, color: { rgb: "0F172A" } } } }];
      
      todasLasCajas.forEach(c => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const turno = c.turnos.find((t: any) => t.horario === h);
        if (turno && turno.participanteId) {
          const part = participantesUnicos.find(p => p.id === turno.participanteId);
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
    wsDia['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: todasLasCajas.length } }]; 

    const nombreHoja = nombreDelDia.substring(0, 31).replace(/[\[\]*\\/?]/g, '');
    XLSX.utils.book_append_sheet(wb, wsDia, nombreHoja);
  });

  let finalFileName = `Turnos_${seccionName}`;
  if (adminInfo && adminInfo.name) {
    finalFileName += `_${adminInfo.name}`;
  }
  finalFileName = finalFileName.replace(/[\s/\\?*:|"<>\.]+/g, '_') + ".xlsx";
  XLSX.writeFile(wb, finalFileName);
};
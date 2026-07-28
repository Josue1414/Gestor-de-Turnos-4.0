// src/utils/excelGlobal.ts
import * as XLSX from 'xlsx-js-style';

// 1. Importamos solo los tipos usando "import type"
import type { 
  DiaEventoExcel, 
  ParticipanteExcel 
} from './excelCompartido';

// 2. Importamos las funciones normales
import { 
  getExcelStyles, 
  getDiasActivos 
} from './excelCompartido';

// =========================================================================
// FUNCIÓN 2: EXPORTAR EXCEL GLOBAL (SUPERVISOR / SUPERADMIN)
// =========================================================================
export const exportGlobalToExcel = (
  eventoNombre: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admins: any[],
  diasPorAdmin: Record<string, DiaEventoExcel[]>,
  participantesPorAdmin: Record<string, ParticipanteExcel[]>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  capitanesPorAdmin: Record<string, any[]> = {},
  participantesPorCapitan: Record<string, ParticipanteExcel[]> = {}
) => {
  const wb = XLSX.utils.book_new();
  const styles = getExcelStyles();

  const globalCajasSet = new Set<string>();
  const globalParticipantesMap = new Map();
  const globalAsignadosIds = new Set<string>();

  let gTotales = 0, gDisponibles = 0, gCapitanes = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const directorioGlobalData: any[] = []; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datosParaIndice: any[] = []; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datosParaCapitanes: any[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hojasGeneradas: { nombreHoja: string, ws: any }[] = [];
  const adminPrimeraHojaMap: Record<string, string> = {}; 
  const capitanPrimeraHojaMap: Record<string, string> = {};

  admins.forEach(admin => {
    const diasRaw = diasPorAdmin[admin.id] || [];
    const diasAdminActivos = getDiasActivos(diasRaw, undefined, admin.diasAsignados);

    const partesAdmin = (participantesPorAdmin[admin.id] || []).map(p => ({ ...p, creador: 'Administrador', adminId: admin.id, adminName: admin.name }));
    const capitanesDelAdmin = capitanesPorAdmin[admin.id] || [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partesCapitanes = capitanesDelAdmin.flatMap((cap: any) => 
      (participantesPorCapitan[cap.id] || []).map((p: any) => ({ ...p, creador: `Capitán: ${cap.nombre}`, adminId: admin.id, adminName: admin.name }))
    );
    const partesCrudos = [...partesAdmin, ...partesCapitanes]; 
    
    gCapitanes += capitanesDelAdmin.length;

    const localCajasNombres = new Set<string>();
    let localTotales = 0;

    diasAdminActivos.forEach(d => {
      const cajas = Array.isArray(d.cajas) ? d.cajas : Object.values(d.cajas || {});
      const cajasEsp = Array.isArray(d.cajasEspeciales) ? d.cajasEspeciales : Object.values(d.cajasEspeciales || {});
      const todas = [...cajas, ...cajasEsp];
      
      todas.forEach(c => {
        localCajasNombres.add(c.nombre);
        globalCajasSet.add(`${admin.id}_${c.nombre}`); 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        c.turnos?.forEach((t: any) => {
          localTotales++;
          gTotales++;
          if(t.participanteId) {
            globalAsignadosIds.add(String(t.participanteId));
          } else {
            gDisponibles++;
          }
        });
      });
    });

    partesCrudos.forEach(p => {
      if (!globalParticipantesMap.has(p.id)) {
        globalParticipantesMap.set(p.id, p);
      }
    });

    datosParaIndice.push({
      id: admin.id,
      name: admin.name || 'Sin Asignar',
      org: admin.organization || admin.org || 'Sin registrar',
      diasConfigurados: diasAdminActivos.length,
      capitanesTotal: capitanesDelAdmin.length,
      cajasTotal: localCajasNombres.size,
      turnosTotal: localTotales
    });

    diasAdminActivos.forEach((dia, idxDia) => {
      const cajas = Array.isArray(dia.cajas) ? dia.cajas : Object.values(dia.cajas || {});
      const cajasEspeciales = Array.isArray(dia.cajasEspeciales) ? dia.cajasEspeciales : Object.values(dia.cajasEspeciales || {});
      const todasLasCajas = [...cajas, ...cajasEspeciales];

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

      matriz.push([{ v: "⬅ Volver al Índice", s: styles.backLinkStyle }]);
      matriz.push([{ v: `ÁREA: ${admin.name.toUpperCase()} - ${nombreDelDia.toUpperCase()}`, s: styles.titleStyle }]);
      matriz.push([]); 

      const headerRow = [
        { v: "Horario", s: styles.headerStyle }, 
        ...todasLasCajas.map(c => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const capitanDueño = capitanesDelAdmin.find((cap: any) => cap.cajasAsignadas?.includes(c.id));
          return { v: capitanDueño ? `${c.nombre}\n(Cap: ${capitanDueño.nombre})` : `${c.nombre}\n(Admin)`, s: styles.headerStyle }
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
            const part = globalParticipantesMap.get(turno.participanteId);
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
      if (wsDia['A1']) wsDia['A1'].l = { Target: "#'Índice de Áreas'!A1", Tooltip: "Regresar al índice principal" };
      wsDia['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, 
        { s: { r: 1, c: 0 }, e: { r: 1, c: todasLasCajas.length } } 
      ];

      let sheetNameFinal = `${admin.name.substring(0, 15)} - ${nombreDelDia.substring(0, 10)}`.replace(/[\[\]*\\/?]/g, '');
      let count = 1;
      while (hojasGeneradas.some(h => h.nombreHoja === sheetNameFinal)) {
        sheetNameFinal = `${sheetNameFinal.substring(0, 27)} (${count})`;
        count++;
      }

      hojasGeneradas.push({ nombreHoja: sheetNameFinal, ws: wsDia });
      if (idxDia === 0) adminPrimeraHojaMap[admin.id] = sheetNameFinal;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    capitanesDelAdmin.forEach((cap: any) => {
      const misCajasIds = cap.cajasAsignadas || [];
      const capDiasActivos = getDiasActivos(diasRaw, misCajasIds, admin.diasAsignados);

      let capCajasTotalesUnicas = new Set<string>();
      let capTurnosTotales = 0;

      capDiasActivos.forEach((dia, idxDia) => {
        const cajas = Array.isArray(dia.cajas) ? dia.cajas : Object.values(dia.cajas || {});
        const cajasEspeciales = Array.isArray(dia.cajasEspeciales) ? dia.cajasEspeciales : Object.values(dia.cajasEspeciales || {});
        const todasMisCajas = [...cajas, ...cajasEspeciales].filter(c => misCajasIds.includes(c.id));

        if (todasMisCajas.length === 0) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        todasMisCajas.forEach(c => {
          capCajasTotalesUnicas.add(c.nombre);
          capTurnosTotales += (c.turnos as any[]).length;
        });

        const horariosSet = new Set<string>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        todasMisCajas.forEach(c => c.turnos.forEach((t: any) => { if (t.horario) horariosSet.add(t.horario); }));
        const horarios = Array.from(horariosSet).sort((a, b) => {
          const [hA, mA] = a.split('-')[0].trim().split(':').map(Number);
          const [hB, mB] = b.split('-')[0].trim().split(':').map(Number);
          return ((hA || 0) * 60 + (mA || 0)) - ((hB || 0) * 60 + (mB || 0));
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matriz: any[][] = [];
        const nombreDelDia = dia.nombreDia || `Día`;

        matriz.push([{ v: "⬅ Volver a Lista de Capitanes", s: styles.backLinkStyle }]);
        matriz.push([{ v: `EQUIPO: ${cap.nombre.toUpperCase()} - ${nombreDelDia.toUpperCase()}`, s: styles.titleStyle }]);
        matriz.push([]); 

        const headerRow = [
          { v: "Horario", s: styles.headerStyle }, 
          ...todasMisCajas.map(c => ({ v: c.nombre, s: styles.headerStyle }))
        ];
        matriz.push(headerRow);

        horarios.forEach(h => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row: any[] = [{ v: h, s: { ...styles.normalCenterStyle, font: { bold: true, color: { rgb: "0F172A" } } } }];
          todasMisCajas.forEach(c => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const turno = c.turnos.find((t: any) => t.horario === h);
            if (turno && turno.participanteId) {
              const part = globalParticipantesMap.get(turno.participanteId);
              row.push({ v: part ? part.nombre : "ID: " + turno.participanteId, s: styles.assignedStyle });
            } else {
              row.push(turno ? { v: `[ LIBRE ]\n${h}`, s: styles.freeSlotStyle } : { v: "⊘ No Aplica", s: styles.notApplicableStyle });
            }
          });
          matriz.push(row);
        });

        const wsDiaCap = XLSX.utils.aoa_to_sheet(matriz);
        wsDiaCap['!cols'] = [{ wch: 18 }, ...todasMisCajas.map(() => ({ wch: 30 }))]; 
        wsDiaCap['!rows'] = Array(matriz.length).fill(styles.defaultRowHeight); 
        if (wsDiaCap['A1']) wsDiaCap['A1'].l = { Target: "#'Lista de Capitanes'!A1", Tooltip: "Regresar a Capitanes" };
        wsDiaCap['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, 
          { s: { r: 1, c: 0 }, e: { r: 1, c: todasMisCajas.length } } 
        ];

        let sheetNameCap = `[C] ${cap.nombre.substring(0, 10)} - ${nombreDelDia.substring(0, 10)}`.replace(/[\[\]*\\/?]/g, '');
        let count = 1;
        while (hojasGeneradas.some(h => h.nombreHoja === sheetNameCap)) {
          sheetNameCap = `${sheetNameCap.substring(0, 27)} (${count})`;
          count++;
        }

        hojasGeneradas.push({ nombreHoja: sheetNameCap, ws: wsDiaCap });
        if (idxDia === 0) capitanPrimeraHojaMap[cap.id] = sheetNameCap;
      });

      if (capCajasTotalesUnicas.size > 0) {
        datosParaCapitanes.push({
          id: cap.id,
          adminName: admin.name,
          capName: cap.nombre,
          cajasTotales: capCajasTotalesUnicas.size, 
          turnosTotales: capTurnosTotales
        });
      }
    });
  });

  let gInactivosCalc = 0;
  globalParticipantesMap.forEach((p) => {
    const isAsignado = globalAsignadosIds.has(String(p.id));
    if (!isAsignado) gInactivosCalc++;

    directorioGlobalData.push([
      { v: p.adminName || 'Sin Asignar', s: styles.normalCenterStyle },
      { v: p.nombre, s: styles.normalStyle },
      { v: isAsignado ? 'Asignado' : 'Inactivo', s: isAsignado ? styles.assignedStatusStyle : styles.inactiveStatusStyle },
      { v: p.whatsapp || p.telefono || '', s: styles.normalCenterStyle },
      { v: p.notasDisponibilidad || p.notas || '', s: styles.normalStyle },
      { v: p.organizacion || p.organization || 'Sin registrar', s: styles.normalStyle },
      { v: p.creador, s: styles.normalCenterStyle } 
    ]);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumenData: any[][] = [
    [{ v: `REPORTE GLOBAL DEL EVENTO`, s: styles.titleStyle }, { v: "", s: styles.titleStyle }],
    [{ v: `Nombre del Evento:`, s: styles.labelStyle }, { v: eventoNombre.toUpperCase(), s: styles.normalStyle }],
    [{ v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }],
    [{ v: "Total Administradores", s: styles.labelStyle }, { v: admins.length, s: styles.normalCenterStyle }],
    [{ v: "Total Capitanes", s: styles.labelStyle }, { v: gCapitanes, s: styles.normalCenterStyle }],
    [{ v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }],
    [{ v: "Métrica Global", s: styles.headerStyle }, { v: "Cantidad Total", s: styles.headerStyle }],
    [{ v: "Cajas Totales (Únicas)", s: styles.normalStyle }, { v: globalCajasSet.size, s: styles.normalCenterStyle }],
    [{ v: "Turnos Totales Creados", s: styles.normalStyle }, { v: gTotales, s: styles.normalCenterStyle }],
    [{ v: "Turnos Libres Disponibles", s: styles.normalStyle }, { v: gDisponibles, s: styles.normalCenterStyle }],
    [{ v: "Usuarios Totales", s: styles.normalStyle }, { v: globalParticipantesMap.size, s: styles.normalCenterStyle }],
    [{ v: "Usuarios Inactivos", s: styles.normalStyle }, { v: gInactivosCalc, s: styles.normalCenterStyle }],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 35 }, { wch: 45 }]; 
  wsResumen['!rows'] = Array(resumenData.length).fill(styles.defaultRowHeight); 
  wsResumen['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, 
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, 
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } }  
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const indiceData: any[][] = [
    [{ v: "Índice de Administradores y Áreas", s: styles.titleStyle }, { v: "", s: styles.titleStyle }, { v: "", s: styles.titleStyle }, { v: "", s: styles.titleStyle }, { v: "", s: styles.titleStyle }, { v: "", s: styles.titleStyle }, { v: "", s: styles.titleStyle }],
    [{ v: "Da clic en el nombre subrayado para viajar directamente a los turnos de ese administrador.", s: { ...styles.normalStyle, font: { sz: 10, italic: true } } }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }],
    [{ v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }],
    [
      { v: "Administrador / Área", s: styles.headerStyle },
      { v: "Organización", s: styles.headerStyle },
      { v: "Capitanes", s: styles.headerStyle },
      { v: "Días Activos", s: styles.headerStyle },
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
      { v: info.capitanesTotal, s: styles.normalCenterStyle },
      { v: info.diasConfigurados, s: styles.normalCenterStyle },
      { v: info.cajasTotal, s: styles.normalCenterStyle },
      { v: info.turnosTotal, s: styles.normalCenterStyle },
      { v: tieneHoja ? "➡️ Ver Horarios" : "Sin Configurar", s: tieneHoja ? styles.linkStyle : styles.notApplicableStyle }
    ]);
  });

  const wsIndice = XLSX.utils.aoa_to_sheet(indiceData);
  wsIndice['!cols'] = [{ wch: 35 }, { wch: 35 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];
  wsIndice['!rows'] = Array(indiceData.length).fill(styles.defaultRowHeight);
  wsIndice['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }
  ];

  datosParaIndice.forEach((info, idx) => {
    const primerHojaDelAdmin = adminPrimeraHojaMap[info.id];
    if (primerHojaDelAdmin) {
      const rowIndex = 4 + idx; 
      const celdaNombre = XLSX.utils.encode_cell({ c: 0, r: rowIndex }); 
      const celdaAccion = XLSX.utils.encode_cell({ c: 6, r: rowIndex }); 
      const linkProps = { Target: `#'${primerHojaDelAdmin}'!A1`, Tooltip: `Ver matriz de ${info.name}` };
      if (wsIndice[celdaNombre]) wsIndice[celdaNombre].l = linkProps;
      if (wsIndice[celdaAccion]) wsIndice[celdaAccion].l = linkProps;
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const capitanesData: any[][] = [
    [{ v: "Índice de Equipos y Capitanes", s: styles.titleStyle }, { v: "", s: styles.titleStyle }, { v: "", s: styles.titleStyle }, { v: "", s: styles.titleStyle }],
    [{ v: "Da clic en el nombre subrayado para viajar directamente a los turnos exclusivos de ese capitán.", s: { ...styles.normalStyle, font: { sz: 10, italic: true } } }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }],
    [{ v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }, { v: "", s: styles.emptyStyle }],
    [
      { v: "Administrador Designado", s: styles.headerStyle },
      { v: "Nombre del Capitán", s: styles.headerStyle },
      { v: "Cajas Únicas a Cargo", s: styles.headerStyle },
      { v: "Total Turnos", s: styles.headerStyle }
    ]
  ];

  datosParaCapitanes.forEach(info => {
    const primerHojaCap = capitanPrimeraHojaMap[info.id];
    const tieneHoja = !!primerHojaCap;

    capitanesData.push([
      { v: info.adminName, s: styles.normalStyle },
      { v: info.capName, s: tieneHoja ? styles.linkStyle : styles.normalStyle }, 
      { v: info.cajasTotales, s: styles.normalCenterStyle },
      { v: info.turnosTotales, s: styles.normalCenterStyle }
    ]);
  });

  const wsListaCapitanes = XLSX.utils.aoa_to_sheet(capitanesData);
  wsListaCapitanes['!cols'] = [{ wch: 35 }, { wch: 35 }, { wch: 25 }, { wch: 20 }];
  wsListaCapitanes['!rows'] = Array(capitanesData.length).fill(styles.defaultRowHeight);
  wsListaCapitanes['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }
  ];

  datosParaCapitanes.forEach((info, idx) => {
    const primerHojaCap = capitanPrimeraHojaMap[info.id];
    if (primerHojaCap) {
      const rowIndex = 4 + idx; 
      const celdaNombre = XLSX.utils.encode_cell({ c: 1, r: rowIndex }); 
      const linkProps = { Target: `#'${primerHojaCap}'!A1`, Tooltip: `Ver equipo de ${info.capName}` };
      if (wsListaCapitanes[celdaNombre]) wsListaCapitanes[celdaNombre].l = linkProps;
    }
  });

  const dirHeader = [
    { v: "Área / Admin", s: styles.headerStyle },
    { v: "Nombre Participante", s: styles.headerStyle },
    { v: "Estado", s: styles.headerStyle },
    { v: "Teléfono", s: styles.headerStyle },
    { v: "Notas", s: styles.headerStyle },
    { v: "Organización", s: styles.headerStyle },
    { v: "Origen / Creador", s: styles.headerStyle }
  ];
  
  const wsParticipantes = XLSX.utils.aoa_to_sheet([dirHeader, ...directorioGlobalData]);
  wsParticipantes['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 20 }, { wch: 40 }, { wch: 35 }, { wch: 25 }];
  wsParticipantes['!rows'] = Array(directorioGlobalData.length + 1).fill(styles.defaultRowHeight);
  wsParticipantes['!autofilter'] = { ref: "A1:G1" }; 
  
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Global");
  XLSX.utils.book_append_sheet(wb, wsIndice, "Índice de Áreas"); 
  if (datosParaCapitanes.length > 0) {
    XLSX.utils.book_append_sheet(wb, wsListaCapitanes, "Lista de Capitanes"); 
  }
  XLSX.utils.book_append_sheet(wb, wsParticipantes, "Directorio Global");
  
  hojasGeneradas.forEach(hojaObj => {
    XLSX.utils.book_append_sheet(wb, hojaObj.ws, hojaObj.nombreHoja);
  });

  const finalFileName = `EventoGlobal_${eventoNombre.replace(/[\s/\\?*:|"<>\.]+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, finalFileName);
};
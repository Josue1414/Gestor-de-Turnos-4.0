import * as XLSX from 'xlsx-js-style';
import type { DiaEvento, Participante } from '../types';

// Extendemos los tipos localmente para evitar errores de TypeScript
type ParticipanteExcel = Participante & { 
  estado?: string; 
  ubicaciones?: string[]; 
  telefono?: string; 
  notas?: string;
  whatsapp?: string;
  notasDisponibilidad?: string;
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

  // --- ESTILOS REUTILIZABLES ---
  const headerStyle = { font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1E293B" } } };
  const titleStyle = { font: { bold: true, sz: 14, color: { rgb: "0F172A" } } };
  const labelStyle = { font: { bold: true, color: { rgb: "475569" } } };
  const freeSlotStyle = { 
    fill: { fgColor: { rgb: "DCFCE7" } }, // Verde muy claro (Tailwind emerald-100)
    font: { color: { rgb: "166534" }, bold: true }, // Verde oscuro (Tailwind emerald-800)
    alignment: { horizontal: "center", vertical: "center" }
  };

  // --- HOJA 1: RESUMEN ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumenData: any[][] = [
    [{ v: "Resumen del Evento", s: titleStyle }, seccionName],
    [""],
  ];

  // Si hay datos del administrador, los agregamos a la cabecera
  if (adminInfo) {
    resumenData.push([{ v: "Administrador / Responsable", s: labelStyle }, adminInfo.name]);
    resumenData.push([{ v: "Organización / Congregación", s: labelStyle }, adminInfo.org]);
    resumenData.push([""]);
  }

  resumenData.push([
    { v: "Métrica", s: headerStyle }, 
    { v: "Cantidad", s: headerStyle }
  ]);
  resumenData.push(["Cajas (Áreas)", stats.cajas || 0]);
  resumenData.push(["Horarios Únicos", stats.horarios || 0]);
  resumenData.push(["Total de Turnos", stats.totales || 0]);
  resumenData.push(["Turnos Libres", stats.disponibles || 0]);
  resumenData.push(["Total Usuarios", stats.participantes || 0]);
  resumenData.push(["Usuarios Inactivos", stats.inactivos || 0]);

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 30 }, { wch: 40 }]; 
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  // --- HOJA 2: DIRECTORIO DE PARTICIPANTES ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dirHeader = [
    { v: "Nombre", s: headerStyle },
    { v: "Estado", s: headerStyle },
    { v: "Teléfono", s: headerStyle },
    { v: "Notas", s: headerStyle },
    { v: "Ubicaciones", s: headerStyle }
  ];
  
  const participantesData = participantes.map(p => ([
    p.nombre,
    p.estado || 'Desconocido',
    p.whatsapp || p.telefono || '',
    p.notasDisponibilidad || p.notas || '',
    (p.ubicaciones || []).join('\n')
  ]));

  const wsParticipantes = XLSX.utils.aoa_to_sheet([dirHeader, ...participantesData]);
  wsParticipantes['!cols'] = [
    { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 55 }
  ];
  XLSX.utils.book_append_sheet(wb, wsParticipantes, "Directorio");

  // --- HOJA 3: MATRIZ DE TURNOS (POR DÍA) ---
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
    const headerRow = [
      { v: "Horario", s: headerStyle }, 
      ...todasLasCajas.map(c => ({ v: c.nombre, s: headerStyle }))
    ];
    matriz.push(headerRow);

    horarios.forEach(h => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: any[] = [{ v: h, s: { font: { bold: true } } }];
      
      todasLasCajas.forEach(c => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const turno = c.turnos.find((t: any) => t.horario === h);
        
        if (turno && turno.participanteId) {
          const part = participantes.find(p => p.id === turno.participanteId);
          row.push(part ? part.nombre : "ID: " + turno.participanteId);
        } else {
          // LÓGICA DE COLOR PARA CELDAS LIBRES
          row.push(
            turno 
              ? { v: `[ LIBRE ]\n${h}`, s: freeSlotStyle } 
              : { v: "---", s: { font: { color: { rgb: "94A3B8" } }, alignment: { horizontal: "center" } } }
          );
        }
      });
      matriz.push(row);
    });

    const wsDia = XLSX.utils.aoa_to_sheet(matriz);
    wsDia['!cols'] = [{ wch: 15 }, ...todasLasCajas.map(() => ({ wch: 25 }))];

    const nombreHoja = (dia.nombreDia || `Dia ${index + 1}`).substring(0, 31).replace(/[\[\]*\\/?]/g, '');
    XLSX.utils.book_append_sheet(wb, wsDia, nombreHoja);
  });

  XLSX.writeFile(wb, `Turnos_${seccionName.replace(/\s+/g, '_')}.xlsx`);
};
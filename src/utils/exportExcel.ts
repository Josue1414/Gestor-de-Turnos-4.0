import * as XLSX from 'xlsx';
import type { DiaEvento, Participante } from '../types';

// 1. Extendemos los tipos localmente para evitar errores de TypeScript
type ParticipanteExcel = Participante & { 
  estado?: string; 
  ubicaciones?: string[]; 
  telefono?: string; 
  notas?: string;
  whatsapp?: string;
  notasDisponibilidad?: string;
};

type DiaEventoExcel = DiaEvento & {
  cajasEspeciales?: any;
};

export const exportToExcel = (
  seccionName: string,
  dias: DiaEventoExcel[],
  participantes: ParticipanteExcel[],
  stats: any
) => {
  const wb = XLSX.utils.book_new();

  // --- HOJA 1: RESUMEN ---
  const resumenData = [
    ["Resumen del Evento", seccionName],
    [""],
    ["Métrica", "Cantidad"],
    ["Cajas (Áreas)", stats.cajas || 0],
    ["Horarios Únicos", stats.horarios || 0],
    ["Total de Turnos", stats.totales || 0],
    ["Turnos Libres", stats.disponibles || 0],
    ["Total Usuarios", stats.participantes || 0],
    ["Usuarios Inactivos", stats.inactivos || 0],
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  
  // Asignamos ancho a las columnas de la hoja Resumen
  wsResumen['!cols'] = [{ wch: 20 }, { wch: 30 }]; 
  
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  // --- HOJA 2: DIRECTORIO DE PARTICIPANTES ---
  const participantesData = participantes.map(p => ({
    Nombre: p.nombre,
    Estado: p.estado || 'Desconocido',
    Teléfono: p.whatsapp || p.telefono || '',
    Notas: p.notasDisponibilidad || p.notas || '',
    // Usamos salto de línea (\n) para que las ubicaciones no se amontonen a lo ancho
    Ubicaciones: (p.ubicaciones || []).join('\n')
  }));
  const wsParticipantes = XLSX.utils.json_to_sheet(participantesData);
  
  // Asignamos ancho a las columnas de la hoja Directorio para que no se vean pegadas
  wsParticipantes['!cols'] = [
    { wch: 25 }, // Columna A: Nombre
    { wch: 15 }, // Columna B: Estado
    { wch: 15 }, // Columna C: Teléfono
    { wch: 30 }, // Columna D: Notas
    { wch: 55 }, // Columna E: Ubicaciones (Más ancha para los textos largos)
  ];

  XLSX.utils.book_append_sheet(wb, wsParticipantes, "Directorio");

  // --- HOJA 3: MATRIZ DE TURNOS (POR DÍA) ---
  dias.forEach((dia, index) => {
    const cajas = Array.isArray(dia.cajas) ? dia.cajas : Object.values(dia.cajas || {});
    const cajasEspeciales = Array.isArray(dia.cajasEspeciales) ? dia.cajasEspeciales : Object.values(dia.cajasEspeciales || {});
    const todasLasCajas = [...cajas, ...cajasEspeciales];

    // Solución al error "implicitly has an 'any' type": tipamos t como (t: any)
    const horariosSet = new Set<string>();
    todasLasCajas.forEach(c => c.turnos.forEach((t: any) => { 
      if (t.horario) horariosSet.add(t.horario); 
    }));
    
    const horarios = Array.from(horariosSet).sort((a, b) => {
      const [hA, mA] = a.split('-')[0].trim().split(':').map(Number);
      const [hB, mB] = b.split('-')[0].trim().split(':').map(Number);
      return ((hA || 0) * 60 + (mA || 0)) - ((hB || 0) * 60 + (mB || 0));
    });

    const matriz: any[][] = [];
    const header = ["Horario", ...todasLasCajas.map(c => c.nombre)];
    matriz.push(header);

    horarios.forEach(h => {
      const row = [h];
      todasLasCajas.forEach(c => {
        // Tipamos explícitamente (t: any) aquí también
        const turno = c.turnos.find((t: any) => t.horario === h);
        if (turno && turno.participanteId) {
          const part = participantes.find(p => p.id === turno.participanteId);
          row.push(part ? part.nombre : "ID: " + turno.participanteId);
        } else {
          row.push(turno ? "Disponible" : "---");
        }
      });
      matriz.push(row);
    });

    const wsDia = XLSX.utils.aoa_to_sheet(matriz);
    
    // Asignamos ancho de columnas a la Matriz (Horario: 15, Resto de Cajas: 25)
    wsDia['!cols'] = [
      { wch: 15 }, 
      ...todasLasCajas.map(() => ({ wch: 25 })) 
    ];

    const nombreHoja = (dia.nombreDia || `Dia ${index + 1}`).substring(0, 31).replace(/[\[\]\*\\\/\?]/g, '');
    XLSX.utils.book_append_sheet(wb, wsDia, nombreHoja);
  });

  // Exportar el archivo final
  XLSX.writeFile(wb, `Turnos_${seccionName.replace(/\s+/g, '_')}.xlsx`);
};
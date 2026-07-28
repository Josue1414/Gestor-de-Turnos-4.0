// src/utils/excelCompartido.ts
import type { DiaEvento, Participante } from '../types';

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
  creador?: string;
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

export const getExcelStyles = () => {
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
      font: { bold: true, sz: 14, color: { rgb: "0F172A" } },
      alignment: { vertical: "center", horizontal: "center", wrapText: true },
      border: borderAll,
      fill: { fgColor: { rgb: "F8FAFC" } }
    },
    labelStyle: { 
      font: { bold: true, color: { rgb: "475569" }, sz: 11 },
      alignment: { vertical: "center", horizontal: "left", indent: 1 },
      border: borderAll
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
    assignedStatusStyle: {
      font: { bold: true, color: { rgb: "2563EB" }, sz: 11 }, // Azul
      border: borderAll,
      alignment: { horizontal: "center", vertical: "center", wrapText: true }
    },
    inactiveStatusStyle: {
      font: { bold: true, color: { rgb: "DC2626" }, sz: 11 }, // Rojo
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
    backLinkStyle: {
      font: { sz: 11, color: { rgb: "2563EB" }, underline: true, bold: true },
      alignment: { vertical: "center", horizontal: "left", indent: 1 }
    },
    defaultRowHeight: { hpt: 35 },
    emptyStyle: { border: borderAll } // Para mantener los bordes en celdas unidas
  };
};

export const getDiasActivos = (dias: DiaEventoExcel[], allowedCajasIds?: string[], diasAsignados?: string[]) => {
  return dias.filter(dia => {
    if (diasAsignados && Array.isArray(diasAsignados) && diasAsignados.length > 0) {
      if (!diasAsignados.includes(dia.nombreDia)) return false;
    }
    const cajas = Array.isArray(dia.cajas) ? dia.cajas : Object.values(dia.cajas || {});
    const cajasEsp = Array.isArray(dia.cajasEspeciales) ? dia.cajasEspeciales : Object.values(dia.cajasEspeciales || {});
    let todas = [...cajas, ...cajasEsp];
    if (allowedCajasIds && allowedCajasIds.length > 0) {
      todas = todas.filter(c => allowedCajasIds.includes(c.id));
    }
    return todas.length > 0;
  });
};
// src/utils/exportExcel.ts

// 📦 Patrón Facade (Índice):
// Este archivo actúa como un puente. Reúne las funciones divididas 
// en los otros archivos y las exporta juntas. De este modo, 
// el resto del proyecto no se entera de que dividimos el código.

export type { ParticipanteExcel, DiaEventoExcel, StatsExport } from './excelCompartido';
export { exportToExcel } from './excelAdminCapitan';
export { exportGlobalToExcel } from './excelGlobal';
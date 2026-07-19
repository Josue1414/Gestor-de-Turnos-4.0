import { z } from 'zod';

// Esquemas Zod para los modelos principales del proyecto

export const TurnoSchema = z.object({
  id: z.string(),
  horario: z.string().min(1), // formato validado por utilidades
  participanteId: z.string().nullable(),
});

export const CajaSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1),
  turnos: z.array(TurnoSchema),
  esEspecial: z.boolean().optional(),
});

export const DiaEventoSchema = z.object({
  id: z.string(),
  fecha: z.string().optional(),
  nombreDia: z.string(),
  // SOLUCIÓN: Hacemos que sea opcional y por defecto asigne un arreglo vacío si Firebase devuelve undefined
  horariosMaestros: z.array(z.string()).optional().default([]),
  cajas: z.array(CajaSchema),
  croquisUrl: z.string().url().optional(),
});

export const ParticipanteSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1),
  linkUnico: z.string().min(1),
  estado: z.string().optional(),
  ubicaciones: z.array(z.string()).optional(),
  whatsapp: z.string().optional(),
  notasDisponibilidad: z.string().optional(),
}).passthrough(); // SOLUCIÓN: passthrough permite que pasen campos adicionales (teléfono, notas, etc.) sin ser eliminados

export const AdministradorSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1),
  nombreEvento: z.string().optional(),
  seccionAsignada: z.string().optional(),
  email: z.string().email().optional(),
  passwordTemporal: z.string().optional(),
  linkAcceso: z.string().optional(),
  estado: z.union([z.literal('Activo'), z.literal('Inactivo')]).optional(),
});

export const EventoSchema = z.object({
  nombre: z.string().min(1),
  passwordGeneral: z.string().optional(),
  metodoGuardado: z.string().optional(),
  admins: z.array(AdministradorSchema).optional(),
  diasPorAdmin: z.record(z.string(), z.array(DiaEventoSchema)).optional(),
  participantesPorAdmin: z.record(z.string(), z.array(ParticipanteSchema)).optional(),
  croquisUrl: z.string().url().optional(),
  createdAt: z.string().optional(),
});

export type Turno = z.infer<typeof TurnoSchema>;
export type Caja = z.infer<typeof CajaSchema>;
export type DiaEvento = z.infer<typeof DiaEventoSchema>;
export type Participante = z.infer<typeof ParticipanteSchema>;
export type Administrador = z.infer<typeof AdministradorSchema>;
export type Evento = z.infer<typeof EventoSchema>;

// Helpers de validación rápida
export const validateTimeRangeString = (s: string) => {
  // Delegar a utilidades si existen
  return s.length > 0;
};
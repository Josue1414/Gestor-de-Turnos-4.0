import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Evento } from './schemas';

/**
 * Normaliza un texto: minúsculas, elimina acentos, puntos y espacios extra.
 * Ej: "María. López" -> "maria lopez"
 */
export const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,]/g, '')
    .toLowerCase()
    .trim();
};

/**
 * Comprueba si un nombre ya existe en un arreglo de objetos que contienen campo `nombre`.
 * Ignora mayúsculas y acentos. Opcionalmente excluye un `currentId`.
 */
export const isNameDuplicate = (
  newName: string,
  existingUsers: { id: string; nombre?: string }[],
  currentId?: string
): boolean => {
  const normalizedNew = normalizeText(newName || '');
  return existingUsers.some(
    (user) => user.id !== currentId && normalizeText(user.nombre || '') === normalizedNew
  );
};

// ----------------------
// UTILIDADES DE HORARIOS
// ----------------------

const timeRegex = /^\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*$/;

const parseTimeToMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map((s) => parseInt(s, 10));
  const H = Number.isFinite(h) ? h : 0;
  const M = Number.isFinite(m) ? m : 0;
  return H * 60 + M;
};

/**
 * Valida formato de rango horario `HH:MM - HH:MM` y que fin > inicio.
 */
export const isValidTimeRange = (range: string): boolean => {
  const m = range.match(timeRegex);
  if (!m) return false;
  const inicio = parseTimeToMinutes(m[1]);
  const fin = parseTimeToMinutes(m[2]);
  return fin > inicio;
};

/**
 * Detecta si dos rangos en formato `HH:MM - HH:MM` se solapan.
 * Devuelve false si alguno de los formatos es inválido.
 */
export const rangesOverlap = (r1: string, r2: string): boolean => {
  const m1 = r1.match(timeRegex);
  const m2 = r2.match(timeRegex);
  if (!m1 || !m2) return false;
  const i1 = parseTimeToMinutes(m1[1]);
  const f1 = parseTimeToMinutes(m1[2]);
  const i2 = parseTimeToMinutes(m2[1]);
  const f2 = parseTimeToMinutes(m2[2]);
  return i1 < f2 && i2 < f1;
};

/**
 * NUEVO: Comprueba si un ID de acceso (para Admin o Supervisor) ya existe globalmente en Firebase.
 */
export const checkGlobalIdAvailable = async (newId: string, currentId?: string): Promise<boolean> => {
  if (newId === currentId) return true;
  // Primero, si existe una colección `accessIds` con documentos por id, consultamos ese índice
  try {
    const accessSnap = await getDoc(doc(db, 'accessIds', newId));
    if (accessSnap.exists()) return false;
  } catch (err) {
    // ignore and fallback to scanning eventos
  }

  const snapshot = await getDocs(collection(db, 'eventos'));
  for (const d of snapshot.docs) {
    const ev = d.data() as Evento | undefined;
    // Revisa si el ID choca con algún Supervisor existente
    if ((ev as any)?.supervisor && (ev as any).supervisor.usuario === newId) return false;
    // Revisa si el ID choca con algún Admin existente
    if (Array.isArray((ev as any)?.admins) && (ev as any).admins.some((a: { id: string }) => a.id === newId)) return false;
  }

  return true;
};

/**
 * Validaciones básicas de strings (nombre, id, etc.)
 */
export const validateName = (name: string, { min = 1, max = 80 } = {}): boolean => {
  const trimmed = name?.trim() || '';
  return trimmed.length >= min && trimmed.length <= max;
};

export const validateAdminId = (id: string): boolean => {
  // Ejemplo simple: letras, números, guiones y guiones bajos, longitud 3-32
  return /^[A-Za-z0-9_-]{3,32}$/.test(id);
};

export default {
  normalizeText,
  isNameDuplicate,
  isValidTimeRange,
  rangesOverlap,
  checkGlobalIdAvailable,
  validateName,
  validateAdminId
};
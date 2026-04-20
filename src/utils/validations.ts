import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Normaliza un texto: lo pasa a minúsculas, quita acentos, puntos y espacios extra.
 * Ej: "María. López" -> "maria lopez"
 */
export const normalizeText = (text: string): string => {
  return text
    .normalize("NFD") // Descompone caracteres con acento
    .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
    .replace(/[.,]/g, "") // <-- ERROR SOLUCIONADO: Se quitó la barra invertida \
    .toLowerCase()
    .trim();
};

/**
 * Comprueba si un nombre ya existe en un arreglo de usuarios, ignorando acentos y mayúsculas.
 */
export const isNameDuplicate = (
  newName: string,
  existingUsers: { id: string; nombre: string }[],
  currentId?: string
): boolean => {
  const normalizedNew = normalizeText(newName);
  
  return existingUsers.some(
    (user) => user.id !== currentId && normalizeText(user.nombre) === normalizedNew
  );
};

/**
 * NUEVO: Comprueba si un ID de acceso (para Admin o Supervisor) ya existe globalmente en Firebase.
 */
export const checkGlobalIdAvailable = async (newId: string, currentId?: string): Promise<boolean> => {
  // Si el usuario simplemente abrió la ventana y le dio "guardar" sin cambiar su propio ID, está bien.
  if (newId === currentId) return true; 
  
  const snapshot = await getDocs(collection(db, 'eventos'));
  
  for (const doc of snapshot.docs) {
    const ev = doc.data();
    
    // Revisa si el ID choca con algún Supervisor existente
    if (ev.supervisor && ev.supervisor.usuario === newId) return false;
    
    // Revisa si el ID choca con algún Admin existente
    if (ev.admins && ev.admins.some((a: { id: string }) => a.id === newId)) return false;
  }
  
  return true; // Si terminó de revisar toda la base de datos y no hubo choque, el ID está libre.
};
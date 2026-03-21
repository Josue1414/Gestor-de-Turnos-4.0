/**
 * Normaliza un texto: lo pasa a minúsculas, quita acentos, puntos y espacios extra.
 * Ej: "María. López" -> "maria lopez"
 */
export const normalizeText = (text: string): string => {
  return text
    .normalize("NFD") // Descompone caracteres con acento
    .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
    .replace(/[\.,]/g, "") // Elimina puntos y comas
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
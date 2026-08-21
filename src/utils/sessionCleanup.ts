// src/utils/sessionCleanup.ts
 
const LOCAL_KEYS = [
  'user_role',
  'current_admin_id',
  'current_capitan_id',
  'current_evento_id',
  'view_capitan_id',
  'saved_capitan_link',
  'saved_participant_url',
  'last_invite_url',
];
 
const SESSION_KEYS = ['visor_externo_tipo', 'return_to_invite'];
 
/**
 * Borra cualquier rastro de sesión guardado en el dispositivo.
 * Se usa cuando el evento ya no existe (finalizó o fue eliminado) para que el
 * usuario no quede atrapado en un panel que ya no puede cargar.
 */
export const limpiarSesionLocal = () => {
  try {
    LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
    SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
  } catch (error) {
    console.warn('No se pudo limpiar la sesión local:', error);
  }
};
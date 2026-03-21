// ==========================================
// 1. CONFIGURACIÓN GLOBAL (SÚPERUSUARIO)
// ==========================================

export interface SuperAdminConfig {
  persistencia: {
    firebase: boolean; // Si es true, guarda en Firebase
    sheets: boolean;   // Si es true, guarda en Sheets (¡pueden ser ambos!)
  };
  plantillaBase: {
    dias: number;
    cajas: number;
    turnosPorCaja: number;
  };
  croquisGlobalUrl?: string; // Para guardar la imagen del mapa principal
}

// ==========================================
// 2. GESTIÓN DE ADMINISTRADORES
// ==========================================

export interface Administrador {
  id: string;
  nombre: string; // Ej: "Josué"
  nombreEvento: string; // Ej: "Convención Anime" (El evento general)
  seccionAsignada: string; // NUEVO: Ej: "Accesos Principales", "Zona de Comida"
  email: string;
  passwordTemporal: string;
  linkAcceso: string;
  estado: 'Activo' | 'Inactivo';
}

// ==========================================
// 3. ESTRUCTURA DEL EVENTO (ADMINISTRADOR)
// ==========================================

export interface Turno {
  id: string;
  horario: string; // Ej: "08:00 - 10:00"
  participanteId: string | null; // null significa que está libre (➕ Ocupar turno)
}

export interface Caja {
  id: string;
  nombre: string; // Ej: "Caja 1", "Kiosco A"
  turnos: Turno[];
}

export interface DiaEvento {
  id: string;
  fecha: string; // Ej: "2026-03-15"
  nombreDia: string; // Ej: "Viernes 15"
  horariosMaestros: string[];
  cajas: Caja[];
  croquisUrl?: string; // El mapa de ese día específico
}

// ==========================================
// 4. PARTICIPANTES (VISTA USUARIO)
// ==========================================

export interface Participante {
  id: string;
  nombre: string; // Se validará que no haya duplicados (case-insensitive)
  linkUnico: string; // El link mágico para que entre sin contraseña
  whatsapp?: string; // Opcional, sugerido en su perfil
  notasDisponibilidad?: string; // Ej: "Disponible de 10 a 12"
  ubicaciones?: string[]
}
// src/types/index.ts

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
  poligonosGlobales?: PoligonoCroquis[]; // <-- NUEVO: Perímetros del mapa global
}

// ==========================================
// 2. GESTIÓN DE ADMINISTRADORES
// ==========================================

export interface Administrador {
  id: string;
  nombre: string; // Ej: "Josué"
  nombreEvento: string; // Ej: "Convención Anime" (El evento general)
  seccionAsignada: string; // Ej: "Accesos Principales", "Zona de Comida"
  email: string;
  passwordTemporal: string;
  linkAcceso: string;
  estado: 'Activo' | 'Inactivo';
}

// ==========================================
// 3. CROQUIS INTERACTIVO (NUEVO)
// ==========================================

export interface Coordenada {
  x: number; // Porcentaje del ancho (0 a 100)
  y: number; // Porcentaje del alto (0 a 100)
}

export interface PoligonoCroquis {
  id: string;
  nombre: string;          // Ej: "Entrada Principal"
  color: string;           // Código Hexadecimal (ej: "#3b82f6")
  puntos: Coordenada[];    // Array de vértices que forman la figura
  notas?: string;          // Instrucciones o detalles del área
  cajaVinculadaId?: string;// ID de la Caja para leer sus turnos al hacer clic
  estado: 'publicado' | 'borrador'; // Control para mostrar u ocultar a los participantes
}

// ==========================================
// 4. ESTRUCTURA DEL EVENTO (ADMINISTRADOR)
// ==========================================

export interface Turno {
  id: string;
  horario: string; // Ej: "08:00 - 10:00"
  participanteId: string | null; // null significa que está libre
  entregada?: boolean; // Para el checkbox 1
  devuelta?: boolean;  // Para el checkbox 2
  solicitaAsistencia?: boolean;
}

export interface Caja {
  id: string;
  nombre: string; // Ej: "Caja 1", "Kiosco A"
  turnos: Turno[];
  esEspecial?: boolean;
}

export interface DiaEvento {
  id: string;
  fecha: string; // Ej: "2026-03-15"
  nombreDia: string; // Ej: "Viernes 15"
  horariosMaestros: string[];
  cajas: Caja[];
  croquisUrl?: string; // El mapa de ese día específico
  poligonos?: PoligonoCroquis[]; // <-- NUEVO: Perímetros dibujados sobre este croquis diario
}

// ==========================================
// 5. PARTICIPANTES (VISTA USUARIO)
// ==========================================

export interface Participante {
  id: string;
  nombre: string; // Se validará que no haya duplicados (case-insensitive)
  linkUnico: string; // El link mágico para que entre sin contraseña
  estado?: string;        
  ubicaciones?: string[]; 
  whatsapp?: string; // Opcional, sugerido en su perfil
  notasDisponibilidad?: string; // Ej: "Disponible de 10 a 12"
}
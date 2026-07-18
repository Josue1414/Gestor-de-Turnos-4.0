# Gestor de Turnos 4.0

Aplicación web (SPA) para **gestionar turnos y horarios de personal en eventos** (convenciones, ferias, congresos, etc.). Permite organizar los **días** del evento, las **cajas** (puestos/estaciones) y los **turnos**, así como asignar **participantes** a cada horario.

## Características

- **Multi-rol:** Súper Admin, Supervisor, Administrador y Participante/Invitado.
- **Estructura por día:** cada día tiene su fecha, horarios maestros y cajas.
- **Cajas normales y especiales** con turnos configurables.
- **Asignación de participantes** a turnos, con detección de choques de horario.
- **Enlaces mágicos:** los participantes acceden por un link único, sin contraseña.
- **Croquis / mapas** por día, con zoom y desplazamiento.
- **Exportación a PNG** de la programación (días y turnos) con `html2canvas`.
- **Estadísticas** de participación.
- **Diseño responsive** (optimizado también para móvil).

## Roles y vistas

| Rol | Descripción |
| --- | --- |
| **Súper Admin** | Configuración global, crea/gestiona administradores y supervisores, define la plantilla base (días, cajas, turnos por caja) y contraseñas. |
| **Supervisor** | Supervisa a los administradores de su ámbito y puede editar sus datos y credenciales. |
| **Administrador** | Arma la estructura de su evento: días, cajas (normales y especiales), horarios maestros, croquis por día, estadísticas y descarga de la programación en imagen. |
| **Participante / Invitado** | Accede por un link único para ver/ocupar sus turnos y consultar los mapas. |

## Stack técnico

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4**
- **Firebase Firestore** (base de datos)
- **React Router v7**
- **lucide-react** (iconos)
- **html2canvas** (exportación a PNG)
- **react-zoom-pan-pinch** (visor de croquis/mapas)
- Despliegue en **Vercel** (ver `vercel.json`)

## Estructura del proyecto

```
src/
  views/        # Vistas por rol: SuperAdmin, Admin, Supervisor, Login, User
  hooks/        # Lógica de cada rol (useSuperAdminLogic, useAdminLogic, useSupervisorLogic)
  components/   # Componentes reutilizables (modales, matriz de turnos, etc.)
  types/        # Definiciones de tipos (Evento, Día, Caja, Turno, Participante...)
  utils/        # Utilidades (cálculo de estadísticas, validaciones)
  firebase.ts   # Inicialización de Firebase
  App.tsx       # Rutas de la aplicación
```

## Requisitos previos

- Node.js 20+
- Un proyecto de **Firebase** con **Firestore** habilitado.

## Configuración

Crea un archivo `.env.local` en la raíz con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Instalación y uso

```bash
# Instalar dependencias
npm install

# Entorno de desarrollo (http://localhost:5173)
npm run dev

# Compilar para producción
npm run build

# Previsualizar el build de producción
npm run preview

# Lint
npm run lint
```

## Rutas principales

| Ruta | Vista |
| --- | --- |
| `/` | Login |
| `/super-admin` | Panel de Súper Admin |
| `/supervisor/:id` | Panel de Supervisor |
| `/admin/:id` | Panel de Administrador |
| `/p/:eventoId/:adminId/:participanteId` | Panel del Participante (link personal) |
| `/invite/:eventoId/:adminId` | Registro de nuevos participantes |

## Roadmap (mejoras futuras)

### Exportar a Excel la información del día

Se planea agregar la posibilidad de **exportar a Excel (`.xlsx`) la información de un día** del evento, con un formato de **tabla de cajas y horarios**:

- Una **fila por horario** y una **columna por caja** (o viceversa), replicando la matriz de turnos.
- En cada celda, el **nombre del participante** asignado a ese turno.
- Los **horarios disponibles** (turnos sin asignar) claramente marcados como libres.
- Encabezado con el **nombre del evento**, el **día/fecha** y la sección correspondiente.

Idea de implementación: usar una librería como [`xlsx` (SheetJS)](https://github.com/SheetJS/sheetjs) o [`exceljs`](https://github.com/exceljs/exceljs) para construir la hoja a partir de la estructura `DiaEvento` (cajas → turnos → participante), reutilizando la misma información que hoy se exporta a PNG. Esto permitiría al administrador descargar la programación de un día en un formato editable e imprimible.

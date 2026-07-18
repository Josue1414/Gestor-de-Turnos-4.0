# Proyecto: Gestor de Turnos 3.0

## Propósito
Esta aplicación gestiona eventos, administradores y turnos en Firebase Firestore. El objetivo principal es mantener la lógica de acceso consistente, evitar conflictos de IDs y optimizar consultas globales.

## Flujo de validación y acceso

1. `src/firebase.ts`
   - Inicializa Firebase desde variables de entorno `VITE_FIREBASE_*`.

2. `src/utils/validations.ts`
   - `normalizeText()` normaliza nombres para comparaciones.
   - `isNameDuplicate()` detecta nombres duplicados ignorando acentos y mayúsculas.
   - `isValidTimeRange()` y `rangesOverlap()` validan rangos horarios.
   - `validateName()` y `validateAdminId()` aplican reglas básicas de formato.
   - `checkGlobalIdAvailable()` verifica la disponibilidad de un ID usando primero `accessIds`, y si es necesario recorre `eventos`.

3. `accessIds`
   - Colección auxiliar para acelerar búsquedas de ID globales.
   - Cada documento usa el ID de acceso como clave y guarda `{ eventoId, type }`.
   - Se escribe en los flujos de creación, edición y eliminación de administradores.

4. `src/hooks/useSuperAdminLogic.ts`
   - `handleCrearEvento()` crea eventos y registra admins en `accessIds`.
   - `handleAddAdmin()` agrega un admin y escribe el índice `accessIds`.
   - `handleConfirmDelete()` borra `accessIds` para admins eliminados.
   - `handleUpdateAdminAccess()` mueve la actualización de `accessIds` dentro de una transacción para evitar inconsistencias.

## Migración de `accessIds`

- `scripts/migrate-accessIds.mjs` recorre todos los documentos de `eventos` y escribe los IDs existentes de admin/supervisor en `accessIds`.
- Ejecutar con:

```bash
npm run migrate:accessIds
```

## Comandos principales

- `npm run dev` — iniciar servidor de desarrollo
- `npm run build` — compilar producción
- `npm run test` — ejecutar pruebas unitarias
- `npm run migrate:accessIds` — poblar la colección `accessIds`

## Expectativas de código

- Todas las operaciones de cambio de ID deben mantener el índice `accessIds` consistente.
- Las validaciones deben prevenir IDs duplicados antes de escribir en Firestore.
- Si `accessIds` falla en escritura en un flujo no crítico, la app debe continuar funcionando, pero avisar en consola.
- Las operaciones transaccionales deben mantener la coherencia en la colección `eventos` y en `accessIds`.

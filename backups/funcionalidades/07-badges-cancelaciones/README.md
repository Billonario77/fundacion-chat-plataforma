# Funcionalidad: Badges de cancelaciones no vistas
Fecha: 2025-03-25

## Descripción
Badges en las pestañas "Cancelados" que indican cuántas cancelaciones nuevas hay sin revisar.
El badge desaparece al entrar a la pestaña y reaparece cuando llega una nueva cancelación.

## Cambios realizados:

### 1. Nuevos estados
- `cancelacionesVistas`: boolean que indica si el usuario ya vio la pestaña de cancelados
- `hayCancelacionesNuevas`: calculado para mostrar el badge solo si hay cancelaciones no vistas

### 2. Lógica de badges
- Al entrar a la pestaña "Cancelados" → `setCancelacionesVistas(true)`
- Al recibir una nueva cancelación (vía socket) → `setCancelacionesVistas(false)`
- El badge solo se muestra si `hayCancelacionesNuevas` es true

### 3. Archivos modificados

#### Backend:
- `turnosController.ts` - funciones `cancelarTurno`, `actualizarEstadoTurno`, `misSolicitudes`, `misTurnos`, `getHistorialTurnos`
- `adminController.ts` - función `asignarGuiaATurno`, `crearTurnoReprogramado`

#### Frontend:
- `UsuarioDashboard.tsx` - badge en pestaña cancelados
- `GuiaDashboard.tsx` - badge en pestaña cancelados
- `HistorialTurnos.tsx` - muestra quién canceló e ícono de reprogramación
- `ModalCancelarTurno.tsx` - advertencia de 48h
- `MensajesNoLeidosContext.tsx` - badges en tiempo real
- `turnosService.ts` - interfaces con `cancelado_por`, `es_reprogramacion`

## Estado: ✅ Funcionando correctamente

## Pruebas realizadas:
- [x] Usuario cancela turno → aparece badge en pestaña "Cancelados"
- [x] Usuario entra a "Cancelados" → badge desaparece
- [x] Usuario sale y vuelve → badge sigue desaparecido
- [x] Llega nueva cancelación → badge reaparece
- [x] Guía cancela turno → badge en pestaña "Cancelados" del guía
- [x] Guía entra a "Cancelados" → badge desaparece
- [x] Guía sale y vuelve → badge sigue desaparecido
- [x] Llega nueva cancelación (por usuario) → badge reaparece en guía
- [x] Historial muestra correctamente quién canceló
- [x] Turnos reprogramados muestran ícono 🔄
- [x] Reprogramaciones funcionan
- [x] Admin asigna guías

## Notas adicionales:
- La columna `cancelado_por` debe existir en tabla `turnos`
- La columna `es_reprogramacion` debe existir en tabla `turnos`
- La tabla `preferencias_usuario` debe existir para guardar preferencias de guía
# Funcionalidad: Historial de cancelaciones y reprogramaciones
Fecha: 2024-03-24

## Cambios realizados:

### 1. Historial muestra quién canceló
- Modificado `HistorialTurnos.tsx` para mostrar texto según `cancelado_por`
- Para usuario: "Cancelado por ti" / "Cancelado por el guía"
- Para guía: "Cancelado por ti" / "Cancelado por el usuario"

### 2. Turnos reprogramados
- Agregado ícono 🔄 junto al nombre del guía/usuario
- Identificación mediante campo `es_reprogramacion`

### 3. Reprogramaciones funcionando
- Usuario ve turnos cancelados por guía en pestaña "Reprogramaciones"
- Botón "Reprogramar" abre modal con opciones
- Admin recibe solicitud y asigna nuevo guía/fecha

### 4. Admin - Nuevos usuarios
- Lista de guías disponibles cargando correctamente
- Asignación de guía a nuevos usuarios funcionando

## Archivos modificados:

### Backend:
- `turnosController.ts` - funciones `cancelarTurno`, `actualizarEstadoTurno`, `misSolicitudes`, `misTurnos`, `getHistorialTurnos`
- `adminController.ts` - función `asignarGuiaATurno`, `crearTurnoReprogramado`

### Frontend:
- `UsuarioDashboard.tsx` - pestañas, reprogramaciones, cancelaciones
- `GuiaDashboard.tsx` - pestaña cancelados solo con sus cancelaciones
- `HistorialTurnos.tsx` - muestra quién canceló e ícono de reprogramación
- `ModalCancelarTurno.tsx` - advertencia de 48h
- `MensajesNoLeidosContext.tsx` - badges en tiempo real
- `turnosService.ts` - interfaces con `cancelado_por`, `es_reprogramacion`

## Estado: ✅ Funcionando correctamente

## Pruebas realizadas:
- [x] Usuario cancela turno → historial muestra "Cancelado por ti"
- [x] Guía cancela turno → historial usuario muestra "Cancelado por el guía"
- [x] Guía cancela turno → guía ve en historial "Cancelado por ti"
- [x] Turno cancelado por guía aparece en "Reprogramaciones"
- [x] Reprogramación funciona y admin puede asignar nuevo guía
- [x] Turno reprogramado muestra ícono 🔄 en historial
- [x] Admin ve guías disponibles para asignar
- [x] Badges de mensajes no leídos en tiempo real
- [x] Videollamada con pantalla completa

## Notas adicionales:
- La columna `cancelado_por` debe existir en tabla `turnos`
- La columna `es_reprogramacion` debe existir en tabla `turnos`
- La tabla `preferencias_usuario` debe existir para guardar preferencias de guía
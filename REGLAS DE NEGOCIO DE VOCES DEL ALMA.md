# REGLAS DE NEGOCIO — Voces del Alma (BIOZYNEX SAS)

**Última actualización:** 13 de octubre de 2026
**Responsable de mantener:** Ludwin Josey Satizabal Ramírez
**Propósito:** Fuente única de verdad para reglas operativas. Cualquier cambio en la plataforma debe reflejarse aquí y viceversa.

---

## 1. Agendamiento

### 1.1. Límites
- Máximo **5 turnos activos** por usuario. Estados activos: `pendiente_admin`, `pendiente_pago`, `pendiente`, `aceptado`, `iniciado`.
- **1 sesión por franja horaria** por usuario (no solapamiento).
- Guía asignado vive en `usuarios.guia_asignado_id` (no en el último turno).

### 1.2. Asignación de guía
- **Primera vez** (`totalTurnosPrevios = 0` AND `guia_asignado_id IS NULL`): requiere asignación por admin (`estado = 'pendiente_admin'`).
- **Turnos siguientes:** se asigna automáticamente el guía del perfil.
- Si el usuario marca "Quiero otro guía": se limpia `guia_asignado_id` y pasa por asignación.

### 1.3. Tarifa por Prioridad (recargo por urgencia)
- **Umbral:** `<= 2 horas` (120 minutos) de anticipación al momento de **agendar**.
- **Valor:** +50% sobre el **costo base** de la sesión. Configurable en `configuracion.horas_recargo_urgencia` y `configuracion.recargo_urgente_porcentaje`.
- **Momento de decisión:** al ejecutar `solicitarApoyo`. Se guarda en `turnos.es_urgente`. **NO se recalcula al pagar.**
- **Exención:** solo suscriptores mensuales activos (PRIORIDAD 2, placeholder hoy).
- **Excepción:** no aplica a usuarios con suscripción. Sí aplica a usuarios con convenio (bolsa o cupón de descuento).
- **Pago:** debe ser **inmediato** para confirmar la reserva.
- **Cálculo (orden):**

- costoBase = (duracionMinutos / 60) * costoPorHora
- descuentoAplicado = costoBase * (descuentoPorcentaje / 100)
- montoRecargo = esUrgente ? costoBase * 0.5 : 0
- total = (costoBase - descuentoAplicado) + montoRecargo + montoMultas

El cupón descuenta **solo sobre la base**, no sobre el recargo.
- **UI:** el total se muestra desglosado en `DetalleTurno.tsx` como "Tarifa por prioridad". El aviso aparece al agendar.

### 1.4. Reprogramación
- Solo para turnos cancelados por el **guía** (no culpa del usuario).
- **Nunca** aplica recargo por urgencia.

---

## 2. Pagos y cobros

### 2.1. Pasarela
- **Wompi** (Bancolombia) — modo Sandbox actualmente.
- Firma de integridad se genera después del cálculo final (con recargo y multas).
- No se almacenan datos de tarjetas.

### 2.2. Estados de cobro
- `pendiente`, `pagado`, `exento`, `consumido_bolsa`, `cancelado`.

### 2.3. Tipos de cobro
- `sesion`: cobro principal del turno.
- `multa`: cobro punitorio por cancelación tardía o impago.
- (Futuro) `suscripcion`: cobro recurrente.

### 2.4. Cobro único por turno
- Un turno solo puede tener **un cobro tipo `sesion` en estado `pendiente`**.
- Al recalcular (ej: aplicar cupón), se **actualiza** el cobro existente, no se duplica.
- Al cancelar el turno, el cobro `sesion` se marca como `cancelado` (no queda huérfano).

### 2.5. Pago manual
- Admin puede registrar pago con comprobante (`cobrosController.registrarPagoManual`).
- Marca también las multas vinculadas como pagadas.

---

## 3. Cancelaciones y multas

### 3.1. Reglas
- Sin costo hasta **2 horas antes** del inicio (`configuracion.horas_limite_cancelacion`).
- Con menos de 2 horas: multa del **50%** del valor de la sesión (`configuracion.multa_cancelacion_porcentaje`).
- Multa se suma a la **próxima sesión**.

### 3.2. Excepciones
- Si el turno es `es_urgente = true`, el usuario **NO** paga multa por cancelación adicional (el +50% ya cubre la prioridad).
- Cancelación por el guía: sin multa para el usuario, habilita reprogramación.

### 3.3. Impago
- Si no se paga **1 hora antes** del inicio → `impagoWorker` cancela el turno y genera multa del 50%.
- En turnos urgentes, el pago debe hacerse de inmediato.

### 3.4. Bloqueo por multas
- Multa pendiente + 0 sesiones activas → puede agendar 1 (que incluirá la multa).
- Multa pendiente + ≥1 sesión activa → debe pagar la multa antes de agendar otra.

### 3.5. Liberación de multas
- Al cancelar el turno que incluía multas vinculadas, estas se liberan (`incluida_en_cobro_id = NULL`) y se suman a la próxima sesión.

### 3.6. Condonación
- Admin puede condonar multas (`cobrosController.condonarMulta`).

---

## 4. Convenios y cupones

### 4.1. Modalidades de convenio
- **`descuento`:** cupón con % de descuento por sesión.
- **`bolsa`:** paquete de horas contratado por la entidad, consumible por sus usuarios.

### 4.2. Vinculación
- **Correo autorizado:** el admin carga la lista (individual o CSV). Al registrarse con ese correo, el usuario queda vinculado automáticamente.
- **Usuario anónimo:** no se vincula (decisión de diseño).
- **Código de bolsa:** se canjea **una vez** desde la pestaña "Mi convenio".

### 4.3. Cupones
- **Tipos:** `porcentaje`, `fijo`, `gratis`, `bolsa`.
- **Un solo uso por usuario** (tabla `cupon_usos`).
- **Automáticos o con código manual** (letras, números, guiones).
- Al agendar con cupón, el cobro se recalcula (idempotente, no duplica).

### 4.4. Exención
- Solo suscriptores mensuales activos (PRIORIDAD 2).
- Usuarios con convenio (bolsa o cupón de descuento) **NO** están exentos del recargo urgente.

### 4.5. Reporte de consumo
- Admin puede generar reporte mensual por entidad (`obtenerConsumoPeriodo`).

### 4.6. Desvinculación
- Manual desde `GestionUsuarios` (admin).

---

## 5. Suscripciones (PENDIENTE — PRIORIDAD 2)

### 5.1. Estado actual
- **No implementado.** La tabla `suscripciones` no existe.
- En `pagoService.ts` hay un placeholder `esSuscriptorActivo = false`.

### 5.2. Modelo propuesto
- Pago fijo mensual.
- X sesiones incluidas por período.
- Requiere integración con Wompi para pagos recurrentes.
- Reglas pendientes de definir: cuántas sesiones, qué pasa al agotarlas, cancelación anticipada.

---

## 6. Testimonios

### 6.1. Reglas
- **1 testimonio pendiente por usuario** (constraint en BD).
- Aprobación/rechazo desde panel admin.
- Aprobados aparecen en `/testimonios` y `HomePage`.

### 6.2. Anonimato
- El testimonio puede ser anónimo (`es_anonimo = true`).
- Se muestra como "🍀" + nombre genérico.

### 6.3. Notificaciones
- Email al aprobar y al rechazar.
- Badge en admin en tiempo real por socket.

---

## 7. Donaciones

### 7.1. Flujo
- Widget externo de Wompi desde `DonarPage`.
- Webhook procesa `transaction.updated`.

### 7.2. Anonimato
- El input de email se muestra **siempre**, incluso si es anónima.
- `emailDonante` se envía siempre.
- Webhook envía email de agradecimiento (inclusive anónimas, mostrando "Donante anónimo").

---

## 8. Configuración en BD

Todas las claves viven en `configuracion (clave, valor)`:

| Clave | Valor actual | Descripción |
|---|---|---|
| `precio_sesion` | 100000 | Precio base de una sesión de 60 min (COP) |
| `duracion_sesion_minutos` | 60 | Duración estándar |
| `horas_limite_cancelacion` | 2 | Horas mínimas para cancelar sin multa |
| `horas_limite_pago` | 1 | Horas mínimas antes del inicio para pagar |
| `horas_recargo_urgencia` | 2 | Umbral para Tarifa por Prioridad |
| `recargo_urgente_porcentaje` | 50 | % de recargo urgente |
| `multa_cancelacion_porcentaje` | 50 | % de multa por cancelación tardía |
| `meta_mensual_donaciones` | 10000000 | Meta para admin dashboard |

---

## 9. Auditoría

- Toda acción relevante se registra en `auditoria_logs`.
- Eventos socket: `cobros-actualizados`, `nuevo-testimonio-pendiente`, `testimonios-actualizados`, `nuevo-turno-cancelado`, `estado-turno-actualizado`, `nuevo-turno-creado`.
- Badges admin: polling de respaldo cada 60s + persistencia "última vista" (con columna por rol).

---

## 10. Pendientes del roadmap

- **PRIORIDAD 1:** ✅ Recargo por urgencia — completado 13-oct-2026.
- **PRIORIDAD 2:** Suscripción mensual (tabla `suscripciones` + Wompi recurrente).
- **PRIORIDAD 3:** Guía de IA 24/7 (LLM + guardrails de crisis + persistencia de conversaciones).

---

**Nota:** Este documento se actualiza con cada regla nueva. Cuando cambie una regla en código, actualizar la sección correspondiente aquí en el mismo commit.
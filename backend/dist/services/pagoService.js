"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagoService = void 0;
class PagoService {
    constructor(pool) {
        this.pool = pool;
    }
    async calcularCosto(params) {
        const { usuarioId, guiaId, turnoId, duracionMinutos, costoPorHora = 100000, codigoCupon } = params;
        const usuarioQuery = await this.pool.query(`SELECT id, entidad_id, es_exento, descuento_personalizado 
       FROM usuarios WHERE id = $1`, [usuarioId]);
        const usuario = usuarioQuery.rows[0];
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        if (usuario.es_exento) {
            const cobro = await this.crearCobro({
                turnoId,
                usuarioId,
                guiaId,
                duracionMinutos,
                costoPorHora,
                descuentoPorcentaje: 100,
                descuentoAplicado: (duracionMinutos / 60) * costoPorHora,
                total: 0,
                estado: 'exento',
                entidadId: usuario.entidad_id
            });
            return {
                total: 0,
                descuentoPorcentaje: 100,
                descuentoAplicado: (duracionMinutos / 60) * costoPorHora,
                esExento: true,
                usaBolsa: false,
                entidadId: usuario.entidad_id || undefined,
                cobroId: cobro.id
            };
        }
        if (usuario.entidad_id) {
            const entidadQuery = await this.pool.query(`SELECT * FROM entidades WHERE id = $1 AND activo = true`, [usuario.entidad_id]);
            const entidad = entidadQuery.rows[0];
            if (entidad && entidad.bolsa_horas_restantes >= (duracionMinutos / 60)) {
                await this.pool.query(`UPDATE entidades SET bolsa_horas_restantes = bolsa_horas_restantes - $1 WHERE id = $2`, [duracionMinutos / 60, usuario.entidad_id]);
                await this.pool.query(`INSERT INTO consumo_bolsa (entidad_id, turno_id, usuario_id, horas_consumidas)
           VALUES ($1, $2, $3, $4)`, [usuario.entidad_id, turnoId, usuarioId, duracionMinutos / 60]);
                const cobro = await this.crearCobro({
                    turnoId,
                    usuarioId,
                    guiaId,
                    duracionMinutos,
                    costoPorHora,
                    descuentoPorcentaje: 0,
                    descuentoAplicado: 0,
                    total: 0,
                    estado: 'consumido_bolsa',
                    entidadId: usuario.entidad_id
                });
                return {
                    total: 0,
                    descuentoPorcentaje: 0,
                    descuentoAplicado: 0,
                    esExento: false,
                    usaBolsa: true,
                    entidadId: usuario.entidad_id,
                    cobroId: cobro.id
                };
            }
        }
        let descuentoPorcentaje = usuario.descuento_personalizado || 0;
        let descuentoAplicado = 0;
        const costoBase = (duracionMinutos / 60) * costoPorHora;
        if (codigoCupon) {
            const cuponQuery = await this.pool.query(`SELECT * FROM cupones 
         WHERE codigo = $1 
         AND activo = true 
         AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
         AND usos_actuales < usos_maximos`, [codigoCupon]);
            const cupon = cuponQuery.rows[0];
            if (cupon) {
                if (cupon.tipo === 'porcentaje') {
                    descuentoPorcentaje = Math.min(100, descuentoPorcentaje + cupon.valor);
                }
                else if (cupon.tipo === 'gratis') {
                    descuentoPorcentaje = 100;
                }
                await this.pool.query(`UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = $1`, [cupon.id]);
            }
        }
        let total = costoBase;
        if (descuentoPorcentaje > 0) {
            descuentoAplicado = costoBase * (descuentoPorcentaje / 100);
            total = costoBase - descuentoAplicado;
        }
        total = Math.round(total * 100) / 100;
        const cobro = await this.crearCobro({
            turnoId,
            usuarioId,
            guiaId,
            duracionMinutos,
            costoPorHora,
            descuentoPorcentaje,
            descuentoAplicado,
            total,
            estado: 'pendiente',
            entidadId: usuario.entidad_id
        });
        return {
            total,
            descuentoPorcentaje,
            descuentoAplicado,
            esExento: false,
            usaBolsa: false,
            entidadId: usuario.entidad_id || undefined,
            cobroId: cobro.id
        };
    }
    async crearCobro(data) {
        const query = `
      INSERT INTO cobros (
        turno_id, usuario_id, guia_id, entidad_id, duracion_minutos,
        costo_por_hora, descuento_porcentaje, descuento_aplicado, total, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
        const result = await this.pool.query(query, [
            data.turnoId,
            data.usuarioId,
            data.guiaId,
            data.entidadId || null,
            data.duracionMinutos,
            data.costoPorHora,
            data.descuentoPorcentaje,
            data.descuentoAplicado,
            data.total,
            data.estado
        ]);
        return result.rows[0];
    }
    async verificarPagoTurno(turnoId) {
        const query = `SELECT * FROM cobros WHERE turno_id = $1`;
        const result = await this.pool.query(query, [turnoId]);
        const cobro = result.rows[0];
        if (!cobro) {
            return { pagado: false, estado: 'sin_cobro' };
        }
        const estadosPagados = ['pagado', 'exento', 'consumido_bolsa'];
        return {
            pagado: estadosPagados.includes(cobro.estado),
            estado: cobro.estado,
            cobro
        };
    }
    async confirmarPago(turnoId, metodoPago) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const cobroQuery = await client.query(`SELECT * FROM cobros WHERE turno_id = $1`, [turnoId]);
            const cobro = cobroQuery.rows[0];
            if (!cobro) {
                throw new Error('Cobro no encontrado');
            }
            if (cobro.estado === 'pagado') {
                return cobro;
            }
            await client.query(`UPDATE cobros SET estado = 'pagado', pagado_at = NOW(), metodo_pago = $1 WHERE id = $2`, [metodoPago, cobro.id]);
            await client.query(`UPDATE turnos SET estado = 'aceptado' WHERE id = $1`, [turnoId]);
            await client.query('COMMIT');
            const result = await client.query(`SELECT * FROM cobros WHERE id = $1`, [cobro.id]);
            return result.rows[0];
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async registrarPagoManual(params) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const { turnoId, metodoPago, comprobanteUrl, adminId } = params;
            const cobroQuery = await client.query(`SELECT * FROM cobros WHERE turno_id = $1`, [turnoId]);
            const cobro = cobroQuery.rows[0];
            if (!cobro) {
                throw new Error('Cobro no encontrado para este turno');
            }
            if (cobro.estado === 'pagado') {
                throw new Error('Este turno ya fue pagado');
            }
            await client.query(`UPDATE cobros SET estado = 'pagado', pagado_at = NOW(), metodo_pago = $1, comprobante_url = $2, creado_por = $3 WHERE id = $4`, [metodoPago, comprobanteUrl || null, adminId, cobro.id]);
            await client.query(`UPDATE turnos SET estado = 'aceptado' WHERE id = $1`, [turnoId]);
            await client.query('COMMIT');
            const result = await client.query(`SELECT * FROM cobros WHERE id = $1`, [cobro.id]);
            return result.rows[0];
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async obtenerCobroPorTurno(turnoId) {
        const query = `SELECT * FROM cobros WHERE turno_id = $1`;
        const result = await this.pool.query(query, [turnoId]);
        return result.rows[0] || null;
    }
}
exports.PagoService = PagoService;
//# sourceMappingURL=pagoService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsignacionService = void 0;
const connection_1 = require("../database/connection");
class AsignacionService {
    static async asignarGuia(usuarioId, esPrimeraVez, fechaProgramada, tipoApoyo = 'apoyo', preferenciaUsuario) {
        if (esPrimeraVez) {
            return {
                guiaId: null,
                requiereAdmin: true,
                razon: 'Primera vez del usuario - requiere asignación manual'
            };
        }
        if (preferenciaUsuario === 'mismo_guia' || await this.tienePreferenciaMismoGuia(usuarioId)) {
            const guiaOriginal = await this.obtenerGuiaOriginal(usuarioId);
            if (guiaOriginal && await this.verificarDisponibilidad(guiaOriginal, fechaProgramada)) {
                const carga = await this.obtenerCargaGuia(guiaOriginal);
                if (carga.turnos_activos < 5) {
                    return {
                        guiaId: guiaOriginal,
                        requiereAdmin: false,
                        razon: 'Mismo guía (preferencia del usuario)'
                    };
                }
            }
        }
        const ultimoGuia = await this.obtenerUltimoGuiaActivo(usuarioId);
        if (ultimoGuia && await this.verificarDisponibilidad(ultimoGuia, fechaProgramada)) {
            const carga = await this.obtenerCargaGuia(ultimoGuia);
            if (carga.turnos_activos < 6) {
                return {
                    guiaId: ultimoGuia,
                    requiereAdmin: false,
                    razon: 'Último guía con turno activo'
                };
            }
        }
        const guiaRecomendado = await this.encontrarGuiaInteligente(tipoApoyo, fechaProgramada);
        if (guiaRecomendado) {
            return {
                guiaId: guiaRecomendado.id,
                requiereAdmin: false,
                razon: `Asignación inteligente - Score: ${guiaRecomendado.score}/100`,
                guiaNombre: guiaRecomendado.nombre
            };
        }
        return {
            guiaId: null,
            requiereAdmin: true,
            razon: 'No hay guías disponibles con capacidad suficiente'
        };
    }
    static async tienePreferenciaMismoGuia(usuarioId) {
        const result = await connection_1.pool.query(`SELECT preferencia FROM preferencias_usuario 
       WHERE usuario_id = $1 AND estado = 'pendiente'
       ORDER BY created_at DESC LIMIT 1`, [usuarioId]);
        return result.rows[0]?.preferencia === 'mismo_guia';
    }
    static async obtenerGuiaOriginal(usuarioId) {
        const result = await connection_1.pool.query(`SELECT guia_id FROM turnos 
       WHERE usuario_id = $1 AND guia_id IS NOT NULL
       ORDER BY created_at ASC LIMIT 1`, [usuarioId]);
        return result.rows[0]?.guia_id || null;
    }
    static async obtenerUltimoGuiaActivo(usuarioId) {
        const result = await connection_1.pool.query(`SELECT guia_id FROM turnos 
       WHERE usuario_id = $1 
       AND guia_id IS NOT NULL
       AND estado IN ('pendiente', 'aceptado', 'iniciado')
       ORDER BY created_at DESC LIMIT 1`, [usuarioId]);
        return result.rows[0]?.guia_id || null;
    }
    static async obtenerCargaGuia(guiaId) {
        const result = await connection_1.pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE estado IN ('pendiente', 'aceptado', 'iniciado')) as turnos_activos,
        COUNT(*) FILTER (WHERE fecha_programada::date = CURRENT_DATE) as turnos_hoy
      FROM turnos 
      WHERE guia_id = $1
    `, [guiaId]);
        return {
            turnos_activos: parseInt(result.rows[0].turnos_activos) || 0,
            turnos_hoy: parseInt(result.rows[0].turnos_hoy) || 0
        };
    }
    static async encontrarGuiaInteligente(tipoApoyo, fechaProgramada) {
        const guias = await this.obtenerGuiasConCarga();
        if (guias.length === 0)
            return null;
        const guiasConScore = guias.map(guia => {
            let score = 100;
            score -= guia.turnos_activos * 10;
            score -= guia.turnos_hoy * 5;
            if (guia.disponible)
                score += 10;
            score = Math.max(0, score);
            return {
                ...guia,
                score
            };
        });
        const mejorGuia = guiasConScore
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .filter(g => g.score && g.score > 20)
            .slice(0, 1)[0];
        if (mejorGuia && mejorGuia.score && mejorGuia.score < 30) {
            return null;
        }
        return mejorGuia || null;
    }
    static async obtenerGuiasConCarga() {
        const result = await connection_1.pool.query(`
      SELECT 
        g.id,
        g.nombre,
        g.email,
        g.disponible,
        COUNT(t.id) FILTER (WHERE t.estado IN ('pendiente', 'aceptado', 'iniciado')) as turnos_activos,
        COUNT(t.id) FILTER (WHERE t.fecha_programada::date = CURRENT_DATE) as turnos_hoy
      FROM usuarios g
      LEFT JOIN turnos t ON t.guia_id = g.id
      WHERE g.rol = 'guia'
      GROUP BY g.id, g.nombre, g.email, g.disponible
      HAVING COUNT(t.id) FILTER (WHERE t.estado IN ('pendiente', 'aceptado', 'iniciado')) < 6
    `);
        return result.rows.map((row) => ({
            id: row.id,
            nombre: row.nombre || 'Sin nombre',
            email: row.email,
            disponible: row.disponible,
            turnos_activos: parseInt(row.turnos_activos) || 0,
            turnos_hoy: parseInt(row.turnos_hoy) || 0
        }));
    }
    static async verificarDisponibilidad(guiaId, fechaProgramada) {
        if (!fechaProgramada)
            return true;
        const duracion = 60;
        const fechaInicio = new Date(fechaProgramada);
        const fechaFin = new Date(fechaProgramada);
        fechaFin.setMinutes(fechaFin.getMinutes() + duracion);
        const result = await connection_1.pool.query(`SELECT id FROM turnos 
       WHERE guia_id = $1 
       AND estado IN ('pendiente', 'aceptado', 'iniciado')
       AND (
         (fecha_programada < $2 AND (fecha_programada + (COALESCE(duracion_minutos, 60) * interval '1 minute')) > $3)
         OR
         (fecha_programada >= $3 AND fecha_programada < $2)
       )`, [guiaId, fechaFin, fechaInicio]);
        return result.rows.length === 0;
    }
    static async getEstadisticasAsignacion() {
        const result = await connection_1.pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE estado = 'pendiente_admin') as pendientes_admin,
        AVG(turnos_activos) as promedio_carga
      FROM (
        SELECT guia_id, COUNT(*) as turnos_activos
        FROM turnos
        WHERE guia_id IS NOT NULL
        AND estado IN ('pendiente', 'aceptado', 'iniciado')
        GROUP BY guia_id
      ) as cargas
    `);
        return {
            pendientes_admin: parseInt(result.rows[0].pendientes_admin) || 0,
            promedio_carga: parseFloat(result.rows[0].promedio_carga) || 0
        };
    }
}
exports.AsignacionService = AsignacionService;
//# sourceMappingURL=asignacionService.js.map
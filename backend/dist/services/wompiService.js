"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WompiService = void 0;
const crypto = __importStar(require("crypto"));
class WompiService {
    constructor() {
        this.privateKey = process.env.WOMPI_PRIVATE_KEY || '';
        this.eventsSecret = process.env.WOMPI_EVENTS_SECRET || '';
        this.integritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';
        this.apiUrl = process.env.WOMPI_API_URL || 'https://sandbox.wompi.co/v1';
        if (!this.privateKey || !this.eventsSecret || !this.integritySecret) {
            console.warn('⚠️ Faltan llaves de Wompi en las variables de entorno');
        }
    }
    generarFirmaIntegridad(referencia, montoEnCentavos, moneda = 'COP') {
        const cadena = `${referencia}${montoEnCentavos}${moneda}${this.integritySecret}`;
        return crypto.createHash('sha256').update(cadena).digest('hex');
    }
    verificarWebhook(payload, signature) {
        try {
            const { checksum, properties } = signature;
            if (!checksum || !properties || !Array.isArray(properties)) {
                console.error('❌ Webhook sin checksum o properties');
                return false;
            }
            const valores = properties.map((prop) => {
                const keys = prop.split('.');
                let valor = payload.data;
                for (const key of keys) {
                    if (valor === undefined || valor === null)
                        return '';
                    valor = valor[key];
                }
                return valor !== undefined && valor !== null ? String(valor) : '';
            }).join('');
            const cadena = `${valores}${payload.timestamp}${this.eventsSecret}`;
            const hashCalculado = crypto.createHash('sha256').update(cadena).digest('hex');
            console.log('🔐 Cadena firma:', cadena.substring(0, 50) + '...');
            console.log('🔐 Hash calculado:', hashCalculado);
            console.log('🔐 Checksum recibido:', checksum);
            return hashCalculado === checksum;
        }
        catch (error) {
            console.error('Error al verificar webhook:', error);
            return false;
        }
    }
    async consultarTransaccion(transactionId) {
        try {
            const response = await fetch(`${this.apiUrl}/transactions/${transactionId}`, {
                headers: {
                    Authorization: `Bearer ${this.privateKey}`
                }
            });
            return await response.json();
        }
        catch (error) {
            console.error('Error al consultar transacción:', error);
            throw error;
        }
    }
    generarReferencia() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `DON-${timestamp}-${random}`;
    }
    getPublicKey() {
        return process.env.WOMPI_PUBLIC_KEY || '';
    }
}
exports.WompiService = WompiService;
//# sourceMappingURL=wompiService.js.map
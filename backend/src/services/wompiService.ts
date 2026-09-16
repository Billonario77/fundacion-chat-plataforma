import * as crypto from 'crypto';

export class WompiService {
  private privateKey: string;
  private eventsSecret: string;
  private integritySecret: string;
  private apiUrl: string;

  constructor() {
    this.privateKey = process.env.WOMPI_PRIVATE_KEY || '';
    this.eventsSecret = process.env.WOMPI_EVENTS_SECRET || '';
    this.integritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';
    this.apiUrl = process.env.WOMPI_API_URL || 'https://sandbox.wompi.co/v1';

    if (!this.privateKey || !this.eventsSecret || !this.integritySecret) {
      console.warn('⚠️ Faltan llaves de Wompi en las variables de entorno');
    }
  }

  /**
   * Genera la firma de integridad para el Widget de Wompi
   * Fórmula: SHA256(referencia + monto_en_centavos + moneda + secreto_integridad)
   */
  generarFirmaIntegridad(referencia: string, montoEnCentavos: number, moneda: string = 'COP'): string {
    const cadena = `${referencia}${montoEnCentavos}${moneda}${this.integritySecret}`;
    return crypto.createHash('sha256').update(cadena).digest('hex');
  }

  /**
   * Verifica la firma de un webhook de Wompi
   * Fórmula: SHA256(propiedades + timestamp + secreto_eventos)
   */
  verificarWebhook(payload: any, signature: any): boolean {
    try {
      const { checksum, properties } = signature;
      
      // Evaluar las propiedades en orden (soporta notación con punto: "transaction.id")
      const valores = properties.map((prop: string) => {
        const keys = prop.split('.');
        let valor: any = payload;
        for (const key of keys) {
          valor = valor[key];
        }
        return valor;
      }).join('');

      const cadena = `${valores}${payload.timestamp}${this.eventsSecret}`;
      const hashCalculado = crypto.createHash('sha256').update(cadena).digest('hex');

      return hashCalculado === checksum;
    } catch (error) {
      console.error('Error al verificar webhook:', error);
      return false;
    }
  }

  /**
   * Consulta el estado de una transacción en Wompi
   */
  async consultarTransaccion(transactionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/transactions/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${this.privateKey}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error al consultar transacción:', error);
      throw error;
    }
  }

  /**
   * Genera una referencia única para la donación
   */
  generarReferencia(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `DON-${timestamp}-${random}`;
  }

  /**
   * Obtiene la llave pública (para el frontend)
   */
  getPublicKey(): string {
    return process.env.WOMPI_PUBLIC_KEY || '';
  }
}
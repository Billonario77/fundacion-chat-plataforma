import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  max: 20,
  // ✅ Forzar la sesión de Postgres en UTC en cada conexión.
  // Esto garantiza que NOW(), CURRENT_TIMESTAMP y cualquier operación
  // de fecha se evalúe en UTC, consistente con la convención del proyecto.
  options: '-c timezone=UTC'
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error al conectar a PostgreSQL:', err.message);
  } else {
    console.log('Conectado a PostgreSQL exitosamente');
    release();
  }
});

export { pool };
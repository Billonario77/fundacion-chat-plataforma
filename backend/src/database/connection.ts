import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000, // 30 segundos
  connectionTimeoutMillis: 10000, // 10 segundos
  max: 20 // máximas conexiones
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
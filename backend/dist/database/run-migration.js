"use strict";
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.production' });
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
async function runMigration() {
    try {
        console.log('🔄 Ejecutando migración de cobros...');
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', '005_cobros_tables.sql'), 'utf8');
        await pool.query(sql);
        console.log('✅ Migración completada exitosamente');
    }
    catch (error) {
        console.error('❌ Error en migración:', error);
    }
    finally {
        await pool.end();
    }
}
runMigration();
//# sourceMappingURL=run-migration.js.map
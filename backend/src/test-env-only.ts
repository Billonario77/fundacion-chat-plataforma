// backend/src/test-env-only.ts
import * as fs from 'fs';
import * as path from 'path';

console.log('=== TEST DE ENTORNO ===');
console.log('Directorio actual:', process.cwd());

// Listar todos los archivos en el directorio actual
console.log('\nArchivos en el directorio actual:');
const files = fs.readdirSync('.');
files.forEach(file => {
    const stats = fs.statSync(file);
    console.log(`  ${file} (${stats.size} bytes)`);
});

// Leer el .env manualmente
const envPath = path.join(process.cwd(), '.env');
console.log('\nIntentando leer .env desde:', envPath);

try {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Archivo .env leído correctamente');
    console.log('Contenido (primeros 50 caracteres):', content.substring(0, 50));
    console.log('Longitud total:', content.length, 'caracteres');
    
    // Mostrar cada línea
    console.log('\nLíneas del archivo:');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
        if (line.trim() && !line.startsWith('#')) {
            console.log(`  Línea ${index + 1}: "${line}"`);
        }
    });
} catch (error) {
    console.error('❌ Error leyendo .env:', error.message);
}

// Probar dotenv directamente
console.log('\n=== Probando dotenv ===');
import dotenv from 'dotenv';
const result = dotenv.config();
console.log('Resultado de dotenv.config():', result.error ? 'Error: ' + result.error.message : 'OK');

console.log('\nVariables después de dotenv.config():');
console.log('DB_HOST:', process.env.DB_HOST || 'NO DEFINIDO');
console.log('DB_USER:', process.env.DB_USER || 'NO DEFINIDO');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'DEFINIDA (longitud: ' + process.env.DB_PASSWORD.length + ')' : 'NO DEFINIDA');
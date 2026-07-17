// backend/src/app.ts
import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import turnosRoutes from './routes/turnosRoutes';
import adminRoutes from './routes/adminRoutes';
import reprogramacionRoutes from './routes/reprogramacionRoutes';
import authRoutes from './routes/authRoutes';
import jwt from 'jsonwebtoken';
import { initSocketService } from './services/socketService';
import estadisticasRoutes from './routes/estadisticasRoutes';
import adminUsuariosRoutes from './routes/adminUsuariosRoutes';
import mensajesRoutes from './routes/mensajesRoutes';
import agoraRoutes from './routes/agoraRoutes';
import emergenciaRoutes from './routes/emergenciaRoutes';
import grabacionRoutes from './routes/grabacionRoutes';

// Configurar zona horaria para toda la aplicación
process.env.TZ = 'America/Bogota';
console.log('🕐 Zona horaria configurada:', process.env.TZ);
console.log('🕐 Hora en backend:', new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
console.log('🕐 Hora actual:', new Date().toString());

dotenv.config();

// Después de dotenv.config();
console.log('🔍 FRONTEND_URL desde env:', process.env.FRONTEND_URL);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

const app = express();
app.set('trust proxy', 1);
app.set('etag', false);
const server = http.createServer(app);

// ============================================
// CONFIGURACIÓN DE ORÍGENES PERMITIDOS (MEJORADA)
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://192.168.3.44:3000'
];

// Agregar FRONTEND_URL desde variables de entorno
if (process.env.FRONTEND_URL) {
  console.log('✅ Agregando FRONTEND_URL a allowedOrigins:', process.env.FRONTEND_URL);
  allowedOrigins.push(process.env.FRONTEND_URL);
} else {
  console.warn('⚠️ FRONTEND_URL no está definida en el entorno');
}

// También agregar la URL de Netlify directamente como fallback
const netlifyUrl = 'https://fundacion-chat-frontend-api.netlify.app';
if (!allowedOrigins.includes(netlifyUrl)) {
  console.log('✅ Agregando URL de Netlify como fallback:', netlifyUrl);
  allowedOrigins.push(netlifyUrl);
}

console.log('📋 Orígenes permitidos finales:', allowedOrigins);

// ============================================
// CONFIGURACIÓN CORS PARA EXPRESS (MEJORADA)
// ============================================
const corsOptions: cors.CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Permitir solicitudes sin origen (ej: Postman, curl, tests)
    if (!origin) {
      return callback(null, true);
    }

    // Verificar si el origen está en la lista de permitidos
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS permitido para: ${origin}`);
      return callback(null, true);
    }

    // En desarrollo, permitir todos los orígenes para facilitar pruebas
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ CORS en desarrollo: permitiendo ${origin} aunque no esté en la lista`);
      return callback(null, true);
    }

    // En producción, bloquear orígenes no autorizados
    console.error(`❌ CORS bloqueado para: ${origin}`);
    console.error(`📋 Orígenes permitidos:`, allowedOrigins);
    return callback(new Error(`Origen ${origin} no permitido por CORS`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Aplicar CORS a Express ANTES de cualquier ruta
app.use(cors(corsOptions));

// ============================================
// MIDDLEWARE DE LOGS PARA CORS (Debug)
// ============================================
app.use((req, res, next) => {
  const origin = req.headers.origin || 'Sin origen';
  console.log(`📥 ${req.method} ${req.path} - Origen: ${origin}`);
  next();
});

// ============================================
// SOCKET.IO CON CONFIGURACIÓN CORS MEJORADA
// ============================================
const io = new SocketServer(server, {
  cors: {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        console.log(`✅ Socket.IO CORS permitido para: ${origin}`);
        return callback(null, true);
      }
      
      console.error(`❌ Socket.IO CORS bloqueado para: ${origin}`);
      return callback(new Error(`Origen ${origin} no permitido por CORS`));
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// ============================================
// INICIALIZAR SERVICIO DE SOCKETS
// ============================================
initSocketService(io);

// ============================================
// MIDDLEWARES DE SEGURIDAD Y UTILIDAD
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// Middleware para logs de todas las solicitudes (útil para debug)
app.use((req, res, next) => {
  console.log(`🚀 ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// RATE LIMITING
// ============================================
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 300, // 300 peticiones por minuto
  message: 'Demasiadas peticiones, por favor intenta de nuevo más tarde',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Saltar rate limiting para health checks
    return req.path === '/health' || req.path === '/';
  }
});
app.use('/api', limiter);

// ============================================
// RUTAS DE LA API
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reprogramaciones', reprogramacionRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/admin/usuarios', adminUsuariosRoutes);
app.use('/api/mensajes', mensajesRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/emergencia', emergenciaRoutes);
app.use('/api/grabacion', grabacionRoutes);

// ============================================
// RUTAS PÚBLICAS
// ============================================
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    corsAllowedOrigins: allowedOrigins,
    frontendUrl: process.env.FRONTEND_URL
  });
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de la Fundación - Servidor funcionando');
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error global:', err.message);
  console.error('📚 Stack:', err.stack);
  
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'Error de CORS',
      message: err.message,
      origin: req.headers.origin
    });
  }
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error'
  });
});

// ============================================
// MAPAS DE USUARIOS CONECTADOS
// ============================================
interface ConnectedUser {
  socketId: string;
  userId: string;
  rol: 'usuario' | 'guia' | 'admin';
}

const connectedUsers = new Map<string, ConnectedUser>();
const userSockets = new Map<string, string>();

// ============================================
// CONFIGURACIÓN DE SOCKETS CON AUTENTICACIÓN
// ============================================
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.token;
    
    if (!token) {
      console.error('❌ Socket sin token de autenticación');
      return next(new Error('Autenticación requerida'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    socket.data.user = {
      id: decoded.id,
      rol: decoded.rol,
      email: decoded.email
    };
    
    console.log(`✅ Socket autenticado: ${decoded.email}`);
    next();
  } catch (error) {
    console.error('❌ Error en autenticación de socket:', error);
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`🟢 Usuario conectado: ${user.email} (${user.rol}) - Socket: ${socket.id}`);

  connectedUsers.set(socket.id, {
    socketId: socket.id,
    userId: user.id,
    rol: user.rol
  });
  userSockets.set(user.id, socket.id);

  socket.join(`user:${user.id}`);
  socket.join(`rol:${user.rol}`);

  socket.on('unirse-a-rooms', (data) => {
    console.log(`📌 ${user.email} se unió a rooms:`, data);
  });

  socket.on('mensaje-privado', (data) => {
    console.log('Mensaje recibido:', data);
    io.to(data.para).emit('mensaje-privado', {
      de: socket.id,
      contenido: data.contenido,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Usuario desconectado: ${user.email} - Socket: ${socket.id}`);
    connectedUsers.delete(socket.id);
    userSockets.delete(user.id);
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Orígenes CORS configurados:`, allowedOrigins);
  console.log(`🔗 FRONTEND_URL: ${process.env.FRONTEND_URL || 'No configurada'}`);
});

export { app, server, io };
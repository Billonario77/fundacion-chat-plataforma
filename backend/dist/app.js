"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const turnosRoutes_1 = __importDefault(require("./routes/turnosRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const reprogramacionRoutes_1 = __importDefault(require("./routes/reprogramacionRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socketService_1 = require("./services/socketService");
const estadisticasRoutes_1 = __importDefault(require("./routes/estadisticasRoutes"));
const adminUsuariosRoutes_1 = __importDefault(require("./routes/adminUsuariosRoutes"));
const mensajesRoutes_1 = __importDefault(require("./routes/mensajesRoutes"));
const agoraRoutes_1 = __importDefault(require("./routes/agoraRoutes"));
const emergenciaRoutes_1 = __importDefault(require("./routes/emergenciaRoutes"));
const grabacionRoutes_1 = __importDefault(require("./routes/grabacionRoutes"));
const recuperacionRoutes_1 = __importDefault(require("./routes/recuperacionRoutes"));
const cobrosRoutes_1 = __importDefault(require("./routes/cobrosRoutes"));
process.env.TZ = 'America/Bogota';
console.log('🕐 Zona horaria configurada:', process.env.TZ);
console.log('🕐 Hora en backend:', new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
console.log('🕐 Hora actual:', new Date().toString());
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv_1.default.config({ path: '.env.production' });
console.log('🔍 FRONTEND_URL desde env:', process.env.FRONTEND_URL);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
const app = (0, express_1.default)();
exports.app = app;
app.set('trust proxy', 1);
app.set('etag', false);
const server = http_1.default.createServer(app);
exports.server = server;
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://192.168.3.44:3000',
    'https://fundacion-chat-frontend-api.netlify.app',
    'https://fundacion-chat-frontend-api.netlify.app/',
    'https://fundacion-chat-frontend-api.netlify.app//',
    'https://fundacion-chat-frontend-api.netlify.app./',
];
if (process.env.FRONTEND_URL) {
    console.log('✅ Agregando FRONTEND_URL:', process.env.FRONTEND_URL);
    allowedOrigins.push(process.env.FRONTEND_URL);
    const sinSlash = process.env.FRONTEND_URL.replace(/\/$/, '');
    if (!allowedOrigins.includes(sinSlash)) {
        allowedOrigins.push(sinSlash);
    }
}
console.log('📋 Orígenes permitidos FINALES:', allowedOrigins);
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        const originSinSlash = origin.replace(/\/$/, '');
        const originConSlash = origin + '/';
        const originConDobleSlash = origin + '//';
        const permitido = allowedOrigins.includes(origin) ||
            allowedOrigins.includes(originSinSlash) ||
            allowedOrigins.includes(originConSlash) ||
            allowedOrigins.includes(originConDobleSlash);
        if (permitido) {
            console.log(`✅ CORS permitido para: ${origin}`);
            return callback(null, true);
        }
        if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ CORS en desarrollo: permitiendo ${origin}`);
            return callback(null, true);
        }
        console.error(`❌ CORS bloqueado para: ${origin}`);
        console.error(`📋 Lista de orígenes permitidos:`, allowedOrigins);
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
        'Access-Control-Request-Headers',
        'cache-control',
        'expires',
        'pragma',
        'if-modified-since',
        'if-none-match'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
};
app.use((0, cors_1.default)(corsOptions));
app.use((req, res, next) => {
    const origin = req.headers.origin || 'Sin origen';
    console.log(`📥 ${req.method} ${req.path} - Origen: ${origin}`);
    next();
});
const io = new socket_io_1.Server(server, {
    cors: {
        origin: function (origin, callback) {
            if (!origin) {
                return callback(null, true);
            }
            const originSinSlash = origin.replace(/\/$/, '');
            const permitido = allowedOrigins.includes(origin) ||
                allowedOrigins.includes(originSinSlash);
            if (permitido || process.env.NODE_ENV === 'development') {
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
exports.io = io;
(0, socketService_1.initSocketService)(io);
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));
app.use((req, res, next) => {
    console.log(`🚀 ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 300,
    message: 'Demasiadas peticiones, por favor intenta de nuevo más tarde',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.path === '/health' || req.path === '/';
    }
});
app.use('/api', limiter);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/turnos', turnosRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/reprogramaciones', reprogramacionRoutes_1.default);
app.use('/api/estadisticas', estadisticasRoutes_1.default);
app.use('/api/admin/usuarios', adminUsuariosRoutes_1.default);
app.use('/api/mensajes', mensajesRoutes_1.default);
app.use('/api/agora', agoraRoutes_1.default);
app.use('/api/emergencia', emergenciaRoutes_1.default);
app.use('/api/grabacion', grabacionRoutes_1.default);
app.use('/api/recuperacion', recuperacionRoutes_1.default);
app.use('/api/cobros', cobrosRoutes_1.default);
app.get('/health', (req, res) => {
    const currentAllowedOrigins = allowedOrigins;
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        corsAllowedOrigins: currentAllowedOrigins,
        frontendUrl: process.env.FRONTEND_URL || 'No configurada',
        allEnvVars: Object.keys(process.env).filter(key => key.includes('URL') || key.includes('FRONTEND'))
    });
});
app.get('/', (req, res) => {
    res.send('API de la Fundación - Servidor funcionando');
});
app.use((err, req, res, next) => {
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
const connectedUsers = new Map();
const userSockets = new Map();
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.token;
        if (!token) {
            console.error('❌ Socket sin token de autenticación');
            return next(new Error('Autenticación requerida'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        socket.data.user = {
            id: decoded.id,
            rol: decoded.rol,
            email: decoded.email
        };
        console.log(`✅ Socket autenticado: ${decoded.email}`);
        next();
    }
    catch (error) {
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
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📋 Orígenes CORS configurados:`, allowedOrigins);
    console.log(`🔗 FRONTEND_URL: ${process.env.FRONTEND_URL || 'No configurada'}`);
});
//# sourceMappingURL=app.js.map
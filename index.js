const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Establecer variables de entorno si no existen
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'tu_secreto_jwt_muy_seguro_aqui_2024';
  process.env.JWT_EXPIRES_IN = '7d';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '3306';
  process.env.DB_NAME = 'dbcsi1';
  process.env.DB_USER = 'root';
  process.env.DB_PASSWORD = '';
  process.env.PORT = '5000';
  process.env.NODE_ENV = 'development';
}

const { testConnection, syncModels } = require('./config/sequelize');
const routes = require('./routes');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', 
  'http://localhost:3001',
  'https://fronted-csi.vercel.app',
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS: Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly for all routes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('OPTIONS request from origin:', origin);
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  res.sendStatus(200);
});

// Universal CORS middleware - applies to ALL routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for ALL requests
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  // Set headers for all methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight request handled for:', req.path);
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (imágenes y PDFs)
app.use('/uploads', express.static('uploads'));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Origin:', req.headers.origin);
  console.log('User-Agent:', req.headers['user-agent']);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas
app.use('/api', routes);

// Final CORS middleware - ensures ALL responses have CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Apply CORS headers to ALL responses
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  
  next();
});

// Middleware para manejo de errores global con CORS
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  // Ensure CORS headers are set even for errors
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Catch-all route for 404 with CORS
app.use('*', (req, res) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for 404 responses
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    await testConnection();
    
    // Sincronizar modelos (crear tablas si no existen)
    await syncModels(false);
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`
🚀 Servidor iniciado exitosamente
📍 URL: http://localhost:${PORT}
🌍 Entorno: ${process.env.NODE_ENV || 'development'}
📚 API Documentation: http://localhost:${PORT}/api

Endpoints disponibles:
📝 POST /api/auth/register - Registro de usuario
🔐 POST /api/auth/login - Inicio de sesión
👤 GET /api/auth/profile - Obtener perfil (requiere token)
✅ GET /api/auth/verify - Verificar token
      `);
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Manejo graceful shutdown
process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = app;
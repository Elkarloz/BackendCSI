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

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:3001',
    'https://fronted-csi.vercel.app',
    'https://alejamamona.codevalcanos.com'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (imágenes y PDFs)
app.use('/uploads', express.static('uploads'));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api', routes);

// Middleware para manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
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
const express = require('express');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const contentRoutes = require('./content');

const router = express.Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de administración
router.use('/admin', adminRoutes);

// Rutas de contenidos
router.use('/contents', contentRoutes);

// Ruta de bienvenida
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Autenticación funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (requiere token)',
        verify: 'GET /api/auth/verify (requiere token)'
      },
      admin: {
        dashboard: 'GET /api/admin/dashboard (requiere token admin)',
        profile: 'PUT /api/admin/profile (requiere token admin)',
        contents: {
          create: 'POST /api/admin/contents (requiere token admin)',
          list: 'GET /api/admin/contents (requiere token admin)',
          get: 'GET /api/admin/contents/:id (requiere token admin)',
          update: 'PUT /api/admin/contents/:id (requiere token admin)',
          delete: 'DELETE /api/admin/contents/:id (requiere token admin)'
        }
      },
      contents: {
        list: 'GET /api/contents',
        get: 'GET /api/contents/:id',
        byType: 'GET /api/contents/type/:type (pdf|video)',
        stats: 'GET /api/contents/stats (requiere token admin)',
        create: 'POST /api/contents (requiere token admin)',
        update: 'PUT /api/contents/:id (requiere token admin)',
        delete: 'DELETE /api/contents/:id (requiere token admin)'
      }
    }
  });
});

// Middleware para rutas no encontradas
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  });
});

module.exports = router;
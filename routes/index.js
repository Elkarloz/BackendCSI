const express = require('express');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const contentRoutes = require('./content');
const planetRoutes = require('./planets');
const levelRoutes = require('./levels');
const exerciseRoutes = require('./exercises');
const studentProgressRoutes = require('./studentProgress');

const router = express.Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de administración
router.use('/admin', adminRoutes);

// Rutas de contenidos
router.use('/contents', contentRoutes);

// Rutas del sistema educativo
router.use('/planets', planetRoutes);
router.use('/levels', levelRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/progress', studentProgressRoutes);

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
      },
      planets: {
        list: 'GET /api/planets',
        get: 'GET /api/planets/:id',
        withLevels: 'GET /api/planets/:id/levels',
        stats: 'GET /api/planets/:id/stats',
        count: 'GET /api/planets/count',
        create: 'POST /api/planets (requiere token admin)',
        update: 'PUT /api/planets/:id (requiere token admin)',
        delete: 'DELETE /api/planets/:id (requiere token admin)',
        reorder: 'PUT /api/planets/reorder (requiere token admin)'
      },
      levels: {
        list: 'GET /api/levels',
        get: 'GET /api/levels/:id',
        withExercises: 'GET /api/levels/:id/exercises',
        stats: 'GET /api/levels/:id/stats',
        count: 'GET /api/levels/count',
        byPlanetAndNumber: 'GET /api/levels/planet/:planetId/number/:levelNumber',
        create: 'POST /api/levels (requiere token admin)',
        update: 'PUT /api/levels/:id (requiere token admin)',
        delete: 'DELETE /api/levels/:id (requiere token admin)',
        reorder: 'PUT /api/levels/reorder (requiere token admin)'
      },
      exercises: {
        list: 'GET /api/exercises',
        get: 'GET /api/exercises/:id',
        byLevel: 'GET /api/exercises/level/:levelId',
        byLevelAndId: 'GET /api/exercises/level/:levelId/exercise/:exerciseId',
        stats: 'GET /api/exercises/:id/stats',
        count: 'GET /api/exercises/count',
        evaluate: 'POST /api/exercises/:id/evaluate',
        create: 'POST /api/exercises (requiere token admin)',
        update: 'PUT /api/exercises/:id (requiere token admin)',
        delete: 'DELETE /api/exercises/:id (requiere token admin)',
        reorder: 'PUT /api/exercises/reorder (requiere token admin)'
      },
      progress: {
        getUserProgress: 'GET /api/progress/user/:userId',
        getLevelProgress: 'GET /api/progress/user/:userId/level/:levelId',
        updateLevelProgress: 'PUT /api/progress/user/:userId/level/:levelId',
        markLevelCompleted: 'POST /api/progress/user/:userId/level/:levelId/complete',
        getUnlockedLevels: 'GET /api/progress/user/:userId/unlocked',
        getUserStats: 'GET /api/progress/user/:userId/stats'
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
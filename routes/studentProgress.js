const express = require('express');
const router = express.Router();
const {
  getUserProgress,
  getLevelProgress,
  updateLevelProgress,
  markLevelCompleted,
  saveExerciseAttempt,
  getUnlockedLevels,
  getUserStats
} = require('../controllers/studentProgressController');

// Middleware de autenticación (opcional, puedes implementarlo según tu sistema)
// const auth = require('../middleware/auth');

// Obtener todo el progreso de un usuario
router.get('/user/:userId', getUserProgress);

// Obtener progreso de un nivel específico
router.get('/user/:userId/level/:levelId', getLevelProgress);

// Actualizar progreso de un nivel
router.put('/user/:userId/level/:levelId', updateLevelProgress);

// Marcar nivel como completado
router.post('/user/:userId/level/:levelId/complete', markLevelCompleted);

// Guardar intento de ejercicio
router.post('/user/:userId/exercise/:exerciseId/attempt', saveExerciseAttempt);

// Obtener niveles desbloqueados para un usuario
router.get('/user/:userId/unlocked', getUnlockedLevels);

// Obtener estadísticas del usuario
router.get('/user/:userId/stats', getUserStats);

module.exports = router;

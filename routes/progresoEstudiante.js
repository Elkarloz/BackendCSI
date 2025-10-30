const express = require('express');
const router = express.Router();
const {
  getUserProgress,
  getLevelProgress,
  updateLevelProgress,
  markLevelCompleted,
  saveExerciseResponse,
  getProgressStats,
  getUnlockedLevels,
  canAnswerExercise,
  getUserResponses,
  getResponseStats,
  getPlanetProgress,
  getCompleteProgressSummary,
  getNextUnlockableLevels,
  getUserAchievements
} = require('../controllers/progresoEstudianteController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Obtener progreso completo de un usuario
router.get('/usuario/:idUsuario', getUserProgress);

// Obtener progreso de un nivel específico
router.get('/usuario/:idUsuario/nivel/:idNivel', getLevelProgress);

// Actualizar progreso de un nivel
router.put('/usuario/:idUsuario/nivel/:idNivel', updateLevelProgress);

// Marcar nivel como completado
router.post('/usuario/:idUsuario/nivel/:idNivel/completar', markLevelCompleted);

// Guardar respuesta de ejercicio
router.post('/usuario/:idUsuario/nivel/:idNivel/ejercicio', saveExerciseResponse);

// Obtener estadísticas de progreso
router.get('/usuario/:idUsuario/estadisticas', getProgressStats);

// Obtener niveles desbloqueados
router.get('/usuario/:idUsuario/niveles-desbloqueados', getUnlockedLevels);

// Verificar si un ejercicio puede ser respondido
router.get('/usuario/:idUsuario/ejercicio/:idEjercicio/puede-responder', canAnswerExercise);

// Obtener respuestas de un usuario
router.get('/usuario/:idUsuario/respuestas', getUserResponses);
router.get('/usuario/:idUsuario/nivel/:idNivel/respuestas', getUserResponses);

// Obtener estadísticas de respuestas
router.get('/usuario/:idUsuario/estadisticas-respuestas', getResponseStats);

// Obtener progreso por planeta
router.get('/usuario/:idUsuario/planeta/:idPlaneta', getPlanetProgress);

// Obtener resumen completo del progreso (todos los planetas)
router.get('/usuario/:idUsuario/resumen-completo', getCompleteProgressSummary);

// Obtener próximos niveles a desbloquear
router.get('/usuario/:idUsuario/proximos-niveles', getNextUnlockableLevels);

// Obtener logros del usuario
router.get('/usuario/:idUsuario/logros', getUserAchievements);

module.exports = router;

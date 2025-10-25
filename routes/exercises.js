const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.get('/', exerciseController.getAllExercises);
router.get('/count', exerciseController.getExercisesCount);
router.get('/:id', exerciseController.getExerciseById);
router.get('/:id/stats', exerciseController.getExerciseStats);
router.get('/level/:levelId', exerciseController.getExercisesByLevel);

// Ruta para evaluar ejercicio (requiere autenticación pero disponible para estudiantes y admins)
router.post('/:id/evaluate', authenticateToken, exerciseController.evaluateExercise);

// Rutas que requieren autenticación y permisos de admin
router.post('/', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, exerciseController.createExercise);

router.put('/:id', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, exerciseController.updateExercise);

router.delete('/:id', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, exerciseController.deleteExercise);

router.delete('/:id/permanent', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, exerciseController.deleteExercisePermanently);

router.put('/reorder', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, exerciseController.reorderExercises);

module.exports = router;

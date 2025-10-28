const express = require('express');
const router = express.Router();
const levelController = require('../controllers/levelController');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.get('/', levelController.getAllLevels);
router.get('/count', levelController.getLevelsCount);
router.get('/:id', levelController.getLevelById);
router.get('/:id/exercises', levelController.getLevelWithExercises);
router.get('/:id/stats', levelController.getLevelStats);

// Rutas que requieren autenticación y permisos de admin
// Temporalmente sin autenticación para debugging en producción
router.post('/test', levelController.testCreateLevel);
router.post('/', levelController.createLevel);

router.put('/:id', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, levelController.updateLevel);

router.delete('/:id', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, levelController.deleteLevel);

router.delete('/:id/permanent', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, levelController.deleteLevelPermanently);

router.put('/reorder', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, levelController.reorderLevels);

module.exports = router;

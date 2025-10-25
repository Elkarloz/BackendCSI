const express = require('express');
const router = express.Router();
const planetController = require('../controllers/planetController');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.get('/', planetController.getAllPlanets);
router.get('/count', planetController.getPlanetsCount);
router.get('/:id', planetController.getPlanetById);
router.get('/:id/levels', planetController.getPlanetWithLevels);
router.get('/:id/stats', planetController.getPlanetStats);

// Rutas que requieren autenticación y permisos de admin
router.post('/', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, planetController.createPlanet);

router.put('/:id', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, planetController.updatePlanet);

router.delete('/:id', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, planetController.deletePlanet);

router.delete('/:id/permanent', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, planetController.deletePlanetPermanently);

router.put('/reorder', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}, planetController.reorderPlanets);

module.exports = router;

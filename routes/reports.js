/**
 * Routes for reports
 * Rutas para reportes de progreso
 */

const express = require('express');
const router = express.Router();
const { getGeneralReport, getStudentsReport, getStudentReport } = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación y permisos de administrador
router.get('/general', authenticateToken, async (req, res) => {
  // Verificar que el usuario sea administrador
  if (req.user && req.user.role === 'admin') {
    return getGeneralReport(req, res);
  }
  return res.status(403).json({
    success: false,
    message: 'Acceso denegado. Se requieren permisos de administrador.'
  });
});

router.get('/students', authenticateToken, async (req, res) => {
  // Verificar que el usuario sea administrador
  if (req.user && req.user.role === 'admin') {
    return getStudentsReport(req, res);
  }
  return res.status(403).json({
    success: false,
    message: 'Acceso denegado. Se requieren permisos de administrador.'
  });
});

router.get('/student/:userId', authenticateToken, async (req, res) => {
  // Verificar que el usuario sea administrador
  if (req.user && req.user.role === 'admin') {
    return getStudentReport(req, res);
  }
  return res.status(403).json({
    success: false,
    message: 'Acceso denegado. Se requieren permisos de administrador.'
  });
});

module.exports = router;


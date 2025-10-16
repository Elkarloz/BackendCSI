const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas de admin
router.use(authenticateToken);

// Dashboard
router.get('/dashboard', AdminController.getDashboard);

// Perfil del admin
router.put('/profile', AdminController.updateProfile);

// CRUD de contenidos
router.post('/contents', AdminController.createContent);
router.get('/contents', AdminController.getContents);
router.get('/contents/:id', AdminController.getContentById);
router.put('/contents/:id', AdminController.updateContent);
router.delete('/contents/:id', AdminController.deleteContent);

module.exports = router;
const express = require('express');
const router = express.Router();
const ContentController = require('../controllers/contentController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas que lo necesiten
// Rutas públicas (solo lectura)
router.get('/', ContentController.getAllContents);
router.get('/stats', authenticateToken, ContentController.getContentStats);
router.get('/type/:type', ContentController.getContentsByType);
router.get('/:id', ContentController.getContentById);

// Rutas protegidas (requieren autenticación y rol admin)
router.post('/', authenticateToken, ContentController.createContent);
router.put('/:id', authenticateToken, ContentController.updateContent);
router.delete('/:id', authenticateToken, ContentController.deleteContent);

// Rutas para subida de archivos PDF
router.post('/:id/upload-pdf', authenticateToken, ContentController.uploadContentPDF);
router.delete('/:id/pdf', authenticateToken, ContentController.deleteContentPDF);
router.get('/:id/download', ContentController.downloadContentPDF);

module.exports = router;
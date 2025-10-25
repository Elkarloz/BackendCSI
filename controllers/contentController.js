const Content = require('../models/Content');

class ContentController {
  // Crear contenido
  static async createContent(req, res) {
    try {
      // Verificar que el usuario sea admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden crear contenidos.'
        });
      }

      const { title, description, resourceType, resourceUrl } = req.body;

      // Validaciones
      if (!title || !resourceType || !resourceUrl) {
        return res.status(400).json({
          success: false,
          message: 'Título, tipo de recurso y URL son requeridos'
        });
      }

      if (!['pdf', 'video'].includes(resourceType)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de recurso debe ser "pdf" o "video"'
        });
      }

      // Validar URL
      try {
        new URL(resourceUrl);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'La URL del recurso no es válida'
        });
      }

      console.log('📄 ContentController.createContent() - Creando contenido con datos:', {
        title: title.trim(),
        description: description ? description.trim() : '',
        resourceType,
        resourceUrl: resourceUrl.trim(),
        createdBy: req.user.id
      });

      const content = await Content.create({
        title: title.trim(),
        description: description ? description.trim() : '',
        resourceType,
        resourceUrl: resourceUrl.trim(),
        createdBy: req.user.id
      });

      console.log('📄 ContentController.createContent() - Contenido creado:', content);

      res.status(201).json({
        success: true,
        message: 'Contenido creado correctamente',
        data: { content: content.toObject() }
      });
    } catch (error) {
      console.error('Error en createContent:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener todos los contenidos
  static async getAllContents(req, res) {
    try {
      const { page = 1, limit = 10, type, search } = req.query;
      const offset = (page - 1) * limit;

      let contents;
      
      // Si se especifica un tipo, filtrar por tipo
      if (type && ['pdf', 'video'].includes(type)) {
        contents = await Content.findByType(type);
      } else {
        contents = await Content.findAll(parseInt(limit), offset);
      }

      // Si hay búsqueda, filtrar por título o descripción
      if (search) {
        const searchTerm = search.toLowerCase();
        contents = contents.filter(content => 
          content.title.toLowerCase().includes(searchTerm) ||
          content.description.toLowerCase().includes(searchTerm)
        );
      }

      const total = await Content.count();

      res.json({
        success: true,
        data: {
          contents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Error en getAllContents:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener contenido por ID
  static async getContentById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de contenido inválido'
        });
      }

      const content = await Content.findById(id);

      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }

      res.json({
        success: true,
        data: { content: content.toObject() }
      });
    } catch (error) {
      console.error('Error en getContentById:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar contenido
  static async updateContent(req, res) {
    try {
      // Verificar que el usuario sea admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden actualizar contenidos.'
        });
      }

      const { id } = req.params;
      const { title, description, resourceType, resourceUrl } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de contenido inválido'
        });
      }

      const content = await Content.findById(id);
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }

      // Validaciones
      if (!title || !resourceType || !resourceUrl) {
        return res.status(400).json({
          success: false,
          message: 'Título, tipo de recurso y URL son requeridos'
        });
      }

      if (!['pdf', 'video'].includes(resourceType)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de recurso debe ser "pdf" o "video"'
        });
      }

      // Validar URL
      try {
        new URL(resourceUrl);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'La URL del recurso no es válida'
        });
      }

      await content.update({
        title: title.trim(),
        description: description ? description.trim() : '',
        resourceType,
        resourceUrl: resourceUrl.trim()
      });

      res.json({
        success: true,
        message: 'Contenido actualizado correctamente',
        data: { content: content.toObject() }
      });
    } catch (error) {
      console.error('Error en updateContent:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Eliminar contenido
  static async deleteContent(req, res) {
    try {
      // Verificar que el usuario sea admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden eliminar contenidos.'
        });
      }

      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de contenido inválido'
        });
      }

      const content = await Content.findById(id);
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }

      await content.delete();

      res.json({
        success: true,
        message: 'Contenido eliminado correctamente'
      });
    } catch (error) {
      console.error('Error en deleteContent:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener contenidos por tipo
  static async getContentsByType(req, res) {
    try {
      const { type } = req.params;

      if (!['pdf', 'video'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de recurso debe ser "pdf" o "video"'
        });
      }

      const contents = await Content.findByType(type);

      res.json({
        success: true,
        data: { 
          contents,
          type,
          count: contents.length
        }
      });
    } catch (error) {
      console.error('Error en getContentsByType:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas de contenidos
  static async getContentStats(req, res) {
    try {
      // Verificar que el usuario sea admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden ver estadísticas.'
        });
      }

      const totalContents = await Content.count();
      const pdfContents = await Content.findByType('pdf');
      const videoContents = await Content.findByType('video');

      res.json({
        success: true,
        data: {
          total: totalContents,
          pdf: pdfContents.length,
          video: videoContents.length,
          breakdown: {
            pdfPercentage: totalContents > 0 ? ((pdfContents.length / totalContents) * 100).toFixed(1) : 0,
            videoPercentage: totalContents > 0 ? ((videoContents.length / totalContents) * 100).toFixed(1) : 0
          }
        }
      });
    } catch (error) {
      console.error('Error en getContentStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = ContentController;
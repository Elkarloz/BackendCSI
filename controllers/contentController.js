const Content = require('../models/Content');
const { uploadContentPDF, handleUploadError, getFileUrl, deleteFile } = require('../middleware/upload');

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

      // Validaciones básicas
      if (!title || !resourceType) {
        return res.status(400).json({
          success: false,
          message: 'Título y tipo de recurso son requeridos'
        });
      }

      if (!['pdf', 'video'].includes(resourceType)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de recurso debe ser "pdf" o "video"'
        });
      }

      // Validar URL solo si es video o si se proporciona una URL
      if (resourceType === 'video' && !resourceUrl) {
        return res.status(400).json({
          success: false,
          message: 'La URL del recurso es requerida para videos'
        });
      }

      // Para PDFs, la URL es opcional inicialmente (se subirá después)
      if (resourceUrl && resourceType === 'pdf') {
        try {
          new URL(resourceUrl);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: 'La URL del recurso no es válida'
          });
        }
      }

      // Para videos, la URL es obligatoria
      if (resourceType === 'video' && resourceUrl) {
        try {
          new URL(resourceUrl);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: 'La URL del recurso no es válida'
          });
        }
      }

      console.log('📄 ContentController.createContent() - Creando contenido con datos:', {
        title: title.trim(),
        description: description ? description.trim() : '',
        resourceType,
        resourceUrl: resourceUrl ? resourceUrl.trim() : null,
        createdBy: req.user.id
      });

      const content = await Content.create({
        title: title.trim(),
        description: description ? description.trim() : '',
        resourceType,
        resourceUrl: resourceUrl ? resourceUrl.trim() : null,
        filePath: null,
        createdBy: req.user.id
      });

      console.log('📄 ContentController.createContent() - Contenido creado:', content);

      res.status(201).json({
        success: true,
        message: 'Contenido creado correctamente',
        data: { 
          id: content.id,
          content: content.toObject() 
        }
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
        resourceUrl: resourceUrl.trim(),
        filePath: content.filePath // Mantener el filePath existente
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

  // Subir PDF a contenido
  static async uploadContentPDF(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el contenido existe
      const content = await Content.findById(id);
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      // Usar middleware de Multer
      uploadContentPDF(req, res, async (err) => {
        if (err) {
          return handleUploadError(err, req, res);
        }
        
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No se ha subido ningún archivo'
          });
        }
        
        try {
          // Generar URL del archivo
          const pdfUrl = getFileUrl(req, req.file.filename, 'pdf');
          const filePath = req.file.path;
          
          // Actualizar contenido con la URL del PDF y ruta del archivo
          await content.update({ 
            resourceUrl: pdfUrl,
            filePath: filePath
          });
          
          res.json({
            success: true,
            data: {
              pdfUrl,
              filePath,
              filename: req.file.filename,
              originalName: req.file.originalname,
              size: req.file.size
            },
            message: 'PDF subido exitosamente'
          });
        } catch (error) {
          console.error('Error al actualizar contenido con PDF:', error);
          res.status(500).json({
            success: false,
            message: 'Error al actualizar contenido con PDF',
            error: error.message
          });
        }
      });
    } catch (error) {
      console.error('Error al subir PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar PDF de contenido
  static async deleteContentPDF(req, res) {
    try {
      const { id } = req.params;
      
      const content = await Content.findById(id);
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      if (!content.filePath) {
        return res.status(400).json({
          success: false,
          message: 'El contenido no tiene PDF'
        });
      }
      
      // Eliminar archivo del sistema de archivos
      const deleted = deleteFile(content.filePath);
      
      // Actualizar contenido para remover la URL y ruta del PDF
      await content.update({ 
        resourceUrl: null,
        filePath: null
      });
      
      res.json({
        success: true,
        message: 'PDF eliminado exitosamente',
        data: { fileDeleted: deleted }
      });
    } catch (error) {
      console.error('Error al eliminar PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Descargar PDF de contenido
  static async downloadContentPDF(req, res) {
    try {
      const { id } = req.params;
      
      const content = await Content.findById(id);
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }
      
      if (!content.filePath) {
        return res.status(400).json({
          success: false,
          message: 'El contenido no tiene PDF'
        });
      }
      
      const fs = require('fs');
      const path = require('path');
      
      // Verificar que el archivo existe
      if (!fs.existsSync(content.filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Archivo PDF no encontrado'
        });
      }
      
      // Enviar archivo
      res.download(content.filePath, content.title + '.pdf');
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = ContentController;
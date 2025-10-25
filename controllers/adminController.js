const User = require('../models/User');
const Content = require('../models/Content');

class AdminController {
  // Obtener información del dashboard
  static async getDashboard(req, res) {
    try {
      // Verificar que el usuario sea admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores.'
        });
      }

      const totalUsers = await User.getAllUsers();
      const totalContents = await Content.count();
      const recentContents = await Content.findAll(5); // Últimos 5 contenidos

      res.json({
        success: true,
        data: {
          stats: {
            totalUsers: totalUsers.length,
            totalContents,
            adminUsers: totalUsers.filter(u => u.role === 'admin').length,
            studentUsers: totalUsers.filter(u => u.role === 'estudiante').length
          },
          recentContents
        }
      });
    } catch (error) {
      console.error('Error en getDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Dashboard de prueba (sin autenticación)
  static async getDashboardTest(req, res) {
    try {
      const totalUsers = await User.getAllUsers();
      const totalContents = await Content.count();
      const recentContents = await Content.findAll(5);

      const stats = {
        totalUsers: totalUsers.length,
        totalContents,
        adminUsers: totalUsers.filter(u => u.role === 'admin').length,
        studentUsers: totalUsers.filter(u => u.role === 'estudiante').length
      };

      res.json({
        success: true,
        data: {
          stats,
          recentContents
        }
      });
    } catch (error) {
      console.error('Error en getDashboardTest:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar perfil del admin
  static async updateProfile(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores.'
        });
      }

      const { name, email } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y email son requeridos'
        });
      }

      // Verificar si el email ya existe (excepto el del usuario actual)
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }

      const user = await User.findById(req.user.id);
      await user.updateUser({ name, email });

      res.json({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: {
          user: user.toSafeObject()
        }
      });
    } catch (error) {
      console.error('Error en updateProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // CRUD de Usuarios

  // Crear usuario
  static async createUser(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores.'
        });
      }

      const { name, email, password, role = 'estudiante' } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, email y contraseña son requeridos'
        });
      }

      if (!['estudiante', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'El rol debe ser "estudiante" o "admin"'
        });
      }

      // Verificar si el email ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }

      const user = await User.createUser({
        name,
        email,
        password,
        role
      });

      res.status(201).json({
        success: true,
        message: 'Usuario creado correctamente',
        data: { user: user.toSafeObject() }
      });
    } catch (error) {
      console.error('Error en createUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener todos los usuarios
  static async getUsers(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores.'
        });
      }

      const { page = 1, limit = 10, role } = req.query;
      const offset = (page - 1) * limit;

      let users;
      if (role && ['estudiante', 'admin'].includes(role)) {
        users = await User.findAll({
          where: { role },
          attributes: ['id', 'email', 'name', 'role', 'isActive', 'created_at'],
          order: [['created_at', 'DESC']],
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
      } else {
        users = await User.findAll({
          attributes: ['id', 'email', 'name', 'role', 'isActive', 'created_at'],
          order: [['created_at', 'DESC']],
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
      }

      const total = await User.count();

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error en getUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener usuario por ID
  static async getUserById(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores.'
        });
      }

      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: { user: user.toSafeObject() }
      });
    } catch (error) {
      console.error('Error en getUserById:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar usuario
  static async updateUser(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores.'
        });
      }

      const { id } = req.params;
      const { name, email, role, isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar si el email ya existe (excepto el del usuario actual)
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'El email ya está en uso'
          });
        }
      }

      await user.update({ name, email, role, isActive });

      res.json({
        success: true,
        message: 'Usuario actualizado correctamente',
        data: { user: user.toSafeObject() }
      });
    } catch (error) {
      console.error('Error en updateUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Eliminar usuario
  static async deleteUser(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores.'
        });
      }

      const { id } = req.params;
      
      // No permitir eliminar el propio usuario
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propio usuario'
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      await user.delete();

      res.json({
        success: true,
        message: 'Usuario eliminado correctamente'
      });
    } catch (error) {
      console.error('Error en deleteUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // CRUD de Contenidos

  // Crear contenido
  static async createContent(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores.'
        });
      }

      const { title, description, resourceType, resourceUrl } = req.body;

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

      const content = await Content.create({
        title,
        description: description || '',
        resourceType,
        resourceUrl,
        createdBy: req.user.id
      });

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
  static async getContents(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores.'
        });
      }

      const { page = 1, limit = 10, type } = req.query;
      const offset = (page - 1) * limit;

      let contents;
      if (type && ['pdf', 'video'].includes(type)) {
        contents = await Content.findByType(type);
      } else {
        contents = await Content.findAll(parseInt(limit), offset);
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
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error en getContents:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener contenido por ID
  static async getContentById(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores.'
        });
      }

      const { id } = req.params;
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
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores.'
        });
      }

      const { id } = req.params;
      const { title, description, resourceType, resourceUrl } = req.body;

      const content = await Content.findById(id);
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Contenido no encontrado'
        });
      }

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

      await content.update({
        title,
        description: description || '',
        resourceType,
        resourceUrl
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
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores.'
        });
      }

      const { id } = req.params;
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
}

module.exports = AdminController;
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Función para generar JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      role: user.role,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Controlador para registro de usuario
const register = async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Crear el usuario
    const newUser = await User.createUser({ email, password, name });

    // Generar token JWT
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: newUser.toSafeObject(),
        token
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    if (error.message === 'El usuario ya existe') {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Controlador para login de usuario
const login = async (req, res) => {
  try {
    console.log('🔐 === INICIO DE PROCESO LOGIN ===');
    console.log('📨 Body recibido:', req.body);
    console.log('📋 Headers:', req.headers);
    
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log('📧 Email a buscar:', email);
    console.log('🔑 Password recibido:', password ? 'Presente' : 'Ausente');

    // Buscar usuario por email
    console.log('🔍 Buscando usuario en la base de datos...');
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('❌ Usuario no encontrado con email:', email);
      return res.status(404).json({
        success: false,
        message: 'No existe una cuenta con este email'
      });
    }

    console.log('✅ Usuario encontrado:', { id: user.id, email: user.email, nombre: user.nombre });

    // Validar contraseña
    console.log('🔐 Validando contraseña...');
    const isValidPassword = await User.validatePassword(password, user.password);
    console.log('🔐 Resultado validación contraseña:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta para usuario:', email);
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    // Generar token JWT
    console.log('🎫 Generando token JWT...');
    const token = generateToken(user);
    console.log('🎫 Token generado exitosamente');

    const response = {
      success: true,
      message: 'Login exitoso',
      data: {
        user: user.toSafeObject(),
        token
      }
    };

    console.log('✅ Respuesta final a enviar:', { 
      success: response.success, 
      message: response.message,
      user: response.data.user,
      tokenPresent: !!response.data.token 
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('💥 Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Controlador para obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      data: {
        user: user.toSafeObject()
      }
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Controlador para verificar token
const verifyToken = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        user: user.toSafeObject()
      }
    });

  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Controlador para actualizar perfil del usuario
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y email son requeridos'
      });
    }

    // Verificar si el email ya existe (excepto el del usuario actual)
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está en uso'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.updateUser({ name, email });

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  verifyToken
};
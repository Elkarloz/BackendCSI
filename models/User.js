const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('estudiante', 'admin'),
    defaultValue: 'estudiante'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

// Métodos de instancia
User.prototype.toSafeObject = function() {
  return {
    id: this.id,
    email: this.email,
    name: this.name,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.created_at
  };
};

// Métodos estáticos
User.createUser = async function({ email, password, name, role = 'estudiante' }) {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    // Encriptar la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el usuario usando Sequelize
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      role
    });

    return newUser;
  } catch (error) {
    throw error;
  }
};

User.findById = async function(id) {
  try {
    const user = await this.findByPk(id, {
      attributes: ['id', 'email', 'name', 'role', 'isActive', 'created_at']
    });
    
    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    throw error;
  }
};

User.findByEmail = async function(email) {
  try {
    console.log('🔍 User.findByEmail() - Buscando email:', email);
    
    const user = await this.findOne({
      where: { email },
      attributes: ['id', 'email', 'password', 'name', 'role', 'created_at']
    });
    
    console.log('🔍 Resultados de la consulta:', user ? 'Usuario encontrado' : 'Usuario no encontrado');
    
    if (!user) {
      console.log('❌ Usuario no encontrado para email:', email);
      return null;
    }

    console.log('✅ Usuario encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.password
    });

    return user;
  } catch (error) {
    console.error('💥 Error en User.findByEmail():', error);
    throw error;
  }
};

User.validatePassword = async function(plainPassword, hashedPassword) {
  try {
    console.log('🔐 User.validatePassword() - Validando contraseña...');
    console.log('🔐 Plain password presente:', !!plainPassword);
    console.log('🔐 Hashed password presente:', !!hashedPassword);
    
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('🔐 Resultado de bcrypt.compare():', isValid);
    
    return isValid;
  } catch (error) {
    console.error('💥 Error en User.validatePassword():', error);
    throw error;
  }
};

User.getAllUsers = async function() {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'role', 'isActive', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    
    return users;
  } catch (error) {
    throw error;
  }
};

User.prototype.updateUser = async function({ email, name }) {
  try {
    await this.update({ email, name });
    return this;
  } catch (error) {
    throw error;
  }
};

User.prototype.delete = async function() {
  try {
    await this.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = User;
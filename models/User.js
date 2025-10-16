const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(id, email, password, name, role, createdAt) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.name = name;
    this.role = role;
    this.createdAt = createdAt;
  }

  // Crear un nuevo usuario
  static async create({ email, password, name }) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new Error('El usuario ya existe');
      }

      // Encriptar la contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insertar el usuario en la base de datos
      const query = `
        INSERT INTO users (email, password, name, role) 
        VALUES (?, ?, ?, 'estudiante')
      `;
      
      const [result] = await pool.execute(query, [email, hashedPassword, name]);
      
      // Obtener el usuario creado (sin contraseña)
      const newUser = await User.findById(result.insertId);
      return newUser;
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    try {
      const query = `
        SELECT id, email, name, role, created_at 
        FROM users 
        WHERE id = ?
      `;
      
      const [rows] = await pool.execute(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      const user = rows[0];
      return new User(
        user.id,
        user.email,
        null, // No devolvemos la contraseña
        user.name,
        user.role,
        user.created_at
      );
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      console.log('🔍 User.findByEmail() - Buscando email:', email);
      
      const query = `
        SELECT id, email, password, name, role, created_at 
        FROM users 
        WHERE email = ?
      `;
      
      const [rows] = await pool.execute(query, [email]);
      console.log('🔍 Resultados de la consulta:', rows.length, 'filas encontradas');
      
      if (rows.length === 0) {
        console.log('❌ Usuario no encontrado para email:', email);
        return null;
      }

      const userData = rows[0];
      console.log('✅ Usuario encontrado:', {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        hasPassword: !!userData.password
      });

      const user = new User(
        userData.id,
        userData.email,
        userData.password,
        userData.name,
        userData.role,
        userData.created_at
      );
      
      return user;
    } catch (error) {
      console.error('💥 Error en User.findByEmail():', error);
      throw error;
    }
  }

  // Validar contraseña
  static async validatePassword(plainPassword, hashedPassword) {
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
  }

  // Obtener todos los usuarios (método adicional para administración)
  static async findAll() {
    try {
      const query = `
        SELECT id, email, name, role, created_at 
        FROM users 
        ORDER BY created_at DESC
      `;
      
      const [rows] = await pool.execute(query);
      
      return rows.map(user => new User(
        user.id,
        user.email,
        null,
        user.name,
        user.role,
        user.created_at
      ));
    } catch (error) {
      throw error;
    }
  }

  // Actualizar usuario
  async update({ email, name }) {
    try {
      const query = `
        UPDATE users 
        SET email = ?, name = ? 
        WHERE id = ?
      `;
      
      await pool.execute(query, [email, name, this.id]);
      
      // Actualizar propiedades del objeto
      this.email = email;
      this.name = name;
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar usuario
  async delete() {
    try {
      const query = 'DELETE FROM users WHERE id = ?';
      await pool.execute(query, [this.id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener datos seguros del usuario (sin contraseña)
  toSafeObject() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      createdAt: this.createdAt
    };
  }
}

module.exports = User;
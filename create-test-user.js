// Script para crear un usuario de prueba
const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createTestUser = async () => {
  try {
    console.log('🔧 Creando usuario de prueba...');
    
    // Datos del usuario de prueba
    const email = 'test@test.com';
    const password = '1234';
    const name = 'Usuario de Prueba';
    
    // Verificar si el usuario ya existe
    const checkQuery = 'SELECT id FROM users WHERE email = ?';
    const [existingUser] = await pool.execute(checkQuery, [email]);
    
    if (existingUser.length > 0) {
      console.log('✅ El usuario de prueba ya existe:', email);
      return;
    }
    
    // Encriptar contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Crear usuario
    const insertQuery = `
      INSERT INTO users (email, password, name, role) 
      VALUES (?, ?, ?, 'estudiante')
    `;
    
    await pool.execute(insertQuery, [email, hashedPassword, name]);
    
    console.log('✅ Usuario de prueba creado exitosamente!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Rol: estudiante');
    
    // Crear un usuario admin también
    const adminEmail = 'admin@test.com';
    const adminPassword = 'admin123';
    const adminName = 'Administrador';
    
    const [existingAdmin] = await pool.execute(checkQuery, [adminEmail]);
    
    if (existingAdmin.length === 0) {
      const hashedAdminPassword = await bcrypt.hash(adminPassword, saltRounds);
      const insertAdminQuery = `
        INSERT INTO users (email, password, name, role) 
        VALUES (?, ?, ?, 'admin')
      `;
      
      await pool.execute(insertAdminQuery, [adminEmail, hashedAdminPassword, adminName]);
      
      console.log('✅ Usuario admin creado exitosamente!');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Password:', adminPassword);
      console.log('👤 Rol: admin');
    } else {
      console.log('✅ El usuario admin ya existe:', adminEmail);
    }
    
  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error);
  } finally {
    process.exit(0);
  }
};

createTestUser();
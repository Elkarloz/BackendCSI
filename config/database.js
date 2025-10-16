const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dbcsi1',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Configuraciones correctas para mysql2
  timeout: 60000,           // Tiempo máximo para obtener una conexión del pool
  idleTimeout: 600000,      // Tiempo antes de cerrar conexiones inactivas
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para verificar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = {
  pool,
  testConnection
};
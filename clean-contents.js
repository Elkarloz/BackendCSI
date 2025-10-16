// Script para limpiar contenidos de prueba
const { pool } = require('./config/database');
require('dotenv').config();

const cleanTestContents = async () => {
  try {
    console.log('🧹 Limpiando contenidos de prueba...');
    
    // Mostrar contenidos actuales
    const [contents] = await pool.execute('SELECT * FROM contents');
    console.log('📋 Contenidos actuales en la base de datos:');
    contents.forEach(content => {
      console.log(`- ID: ${content.id}, Título: "${content.title}", Tipo: ${content.resource_type}`);
    });
    
    if (contents.length === 0) {
      console.log('✅ No hay contenidos en la base de datos');
      return;
    }
    
    // Preguntar si se quiere limpiar
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('¿Deseas eliminar TODOS los contenidos? (y/N): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        try {
          // Eliminar todos los contenidos
          await pool.execute('DELETE FROM contents');
          console.log('✅ Todos los contenidos han sido eliminados');
          
          // Resetear auto increment
          await pool.execute('ALTER TABLE contents AUTO_INCREMENT = 1');
          console.log('✅ ID reiniciado a 1');
          
        } catch (error) {
          console.error('❌ Error eliminando contenidos:', error);
        }
      } else {
        console.log('❌ Operación cancelada');
      }
      
      rl.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error accediendo a la base de datos:', error);
    process.exit(1);
  }
};

cleanTestContents();
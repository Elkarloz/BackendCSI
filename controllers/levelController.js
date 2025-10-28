const Level = require('../models/Level');
const { sequelize } = require('../config/sequelize');

// Función helper para encontrar el siguiente order_index disponible
const findNextAvailableOrderIndex = async (planetId) => {
  try {
    // Buscar todos los order_index existentes para este planeta (activos e inactivos)
    const query = 'SELECT DISTINCT order_index FROM levels WHERE planet_id = ? ORDER BY order_index ASC';
    const results = await sequelize.query(query, {
      replacements: [planetId],
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('🔍 Order indexes existentes para planeta', planetId, ':', results.map(r => r.order_index));
    
    // Encontrar el primer número disponible empezando desde 1
    let nextIndex = 1;
    const existingIndexes = results.map(r => r.order_index);
    
    while (existingIndexes.includes(nextIndex)) {
      nextIndex++;
    }
    
    console.log('✅ Siguiente order_index disponible:', nextIndex);
    return nextIndex;
  } catch (error) {
    console.error('Error finding next available order index:', error);
    return 1; // Fallback
  }
};

// Obtener todos los niveles
const getAllLevels = async (req, res) => {
  try {
    const { includeInactive = false, planetId } = req.query;
    
    let levels;
    if (planetId) {
      levels = await Level.findByPlanet(planetId, includeInactive === 'true');
    } else {
      levels = await Level.findAll(includeInactive === 'true');
    }
    
    res.json({
      success: true,
      data: levels,
      message: 'Niveles obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener niveles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener nivel por ID
const getLevelById = async (req, res) => {
  try {
    const { id } = req.params;
    const level = await Level.findById(id);
    
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Nivel no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: level,
      message: 'Nivel obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener nivel:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener nivel con sus ejercicios
const getLevelWithExercises = async (req, res) => {
  try {
    const { id } = req.params;
    const level = await Level.findByIdWithExercises(id);
    
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Nivel no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: level,
      message: 'Nivel con ejercicios obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener nivel con ejercicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Endpoint de prueba para debugging
const testCreateLevel = async (req, res) => {
  try {
    console.log('🧪 Test endpoint - Datos recibidos:', req.body);
    console.log('🧪 Test endpoint - Headers:', req.headers);
    
    res.status(200).json({
      success: true,
      message: 'Test endpoint funcionando',
      receivedData: req.body
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en test endpoint',
      error: error.message
    });
  }
};

// Crear nuevo nivel
const createLevel = async (req, res) => {
  try {
    const { planetId, title, orderIndex } = req.body;
    
    console.log('📚 Backend createLevel - Datos recibidos:', { planetId, title, orderIndex });
    
    // Validaciones
    if (!planetId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Planeta y título son requeridos'
      });
    }
    
    // Convertir planetId a número si viene como string
    const numericPlanetId = parseInt(planetId);
    if (isNaN(numericPlanetId)) {
      return res.status(400).json({
        success: false,
        message: 'ID del planeta debe ser un número válido'
      });
    }
    
    // Validar que el orderIndex sea válido
    let finalOrderIndex = parseInt(orderIndex) || 1;
    if (finalOrderIndex < 1) {
      return res.status(400).json({
        success: false,
        message: 'El orden del nivel debe ser mayor a 0'
      });
    }
    
    console.log('📚 Backend createLevel - Datos procesados:', { 
      planetId: numericPlanetId, 
      title, 
      orderIndex: finalOrderIndex 
    });
    
    // Intentar crear el nivel con manejo inteligente de duplicados
    let level;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`🔄 Intento ${attempts + 1} - Creando nivel con datos:`, {
          planetId: numericPlanetId,
          title,
          orderIndex: finalOrderIndex
        });
        
        // Verificar si el orderIndex ya existe antes de crear
        const existingLevel = await Level.findByPlanetAndOrderIndex(numericPlanetId, finalOrderIndex);
        if (existingLevel) {
          console.log('❌ Level number duplicado:', finalOrderIndex, 'usado por nivel:', existingLevel.id);
          
          // Buscar el siguiente orderIndex disponible
          const nextAvailableIndex = await findNextAvailableOrderIndex(numericPlanetId);
          console.log(`🔄 Usando siguiente level number disponible:`, nextAvailableIndex);
          finalOrderIndex = nextAvailableIndex;
          attempts++;
          continue;
        }
        
        level = await Level.create({
          planetId: numericPlanetId,
          title,
          orderIndex: finalOrderIndex
        });
        
        console.log('✅ Nivel creado exitosamente:', level);
        break; // Éxito, salir del bucle
        
      } catch (error) {
        console.error(`❌ Intento ${attempts + 1} falló:`, error.name, error.message);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
          attempts++;
          
          if (attempts < maxAttempts) {
            // Buscar el siguiente orderIndex disponible
            const nextAvailableIndex = await findNextAvailableOrderIndex(numericPlanetId);
            console.log(`🔄 Usando siguiente level number disponible:`, nextAvailableIndex);
            finalOrderIndex = nextAvailableIndex;
          } else {
            console.error('❌ Máximo de intentos alcanzado');
            throw new Error('No se pudo crear el nivel después de múltiples intentos');
          }
        } else {
          // Error diferente al constraint único, lanzar inmediatamente
          throw error;
        }
      }
    }
    
    res.status(201).json({
      success: true,
      data: level,
      message: 'Nivel creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear nivel:', error);
    
    // Manejar errores específicos
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un nivel con este orden en este planeta',
        error: error.message
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación incorrectos',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar nivel
const updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, orderIndex, isActive } = req.body;
    
    console.log('📚 Backend updateLevel - Datos recibidos:', { id, title, orderIndex, isActive });
    
    const level = await Level.findById(id);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Nivel no encontrado'
      });
    }
    
    // Validar que el orderIndex no esté duplicado (excepto para el mismo nivel)
    if (orderIndex) {
      const existingLevel = await Level.findByPlanetAndOrderIndex(level.planetId, orderIndex);
      if (existingLevel && String(existingLevel.id) !== String(id)) {
        console.log('❌ Backend updateLevel - Level number duplicado:', orderIndex, 'usado por nivel:', existingLevel.id);
        return res.status(400).json({
          success: false,
          message: `El orden ${orderIndex} ya está ocupado por otro nivel en este planeta. Por favor, elige un orden diferente.`
        });
      }
    }
    
    // Crear una instancia de Level para poder usar el método update
    const levelInstance = new Level(
      level.id,
      level.planetId,
      level.title,
      level.isActive,
      level.orderIndex,
      level.createdAt,
      level.updatedAt
    );
    
    await levelInstance.update({
      title,
      orderIndex: orderIndex || level.orderIndex,
      isActive: isActive !== undefined ? isActive : true
    });
    
    // Obtener el nivel actualizado
    const updatedLevel = await Level.findById(id);
    
    res.json({
      success: true,
      data: updatedLevel,
      message: 'Nivel actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar nivel:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar nivel (soft delete)
const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;
    
    const level = await Level.findById(id);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Nivel no encontrado'
      });
    }
    
    // Crear una instancia de Level para poder usar el método delete
    const levelInstance = new Level(
      level.id,
      level.planetId,
      level.title,
      level.isActive,
      level.orderIndex,
      level.createdAt,
      level.updatedAt
    );
    
    await levelInstance.delete();
    
    res.json({
      success: true,
      message: 'Nivel eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar nivel:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar nivel permanentemente
const deleteLevelPermanently = async (req, res) => {
  try {
    const { id } = req.params;
    
    const level = await Level.findById(id);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Nivel no encontrado'
      });
    }
    
    // Crear una instancia de Level para poder usar el método deletePermanently
    const levelInstance = new Level(
      level.id,
      level.planetId,
      level.title,
      level.isActive,
      level.orderIndex,
      level.createdAt,
      level.updatedAt
    );
    
    await levelInstance.deletePermanently();
    
    res.json({
      success: true,
      message: 'Nivel eliminado permanentemente'
    });
  } catch (error) {
    console.error('Error al eliminar nivel permanentemente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Reordenar niveles
const reorderLevels = async (req, res) => {
  try {
    const { levelOrders } = req.body;
    
    if (!Array.isArray(levelOrders)) {
      return res.status(400).json({
        success: false,
        message: 'levelOrders debe ser un array'
      });
    }
    
    await Level.reorder(levelOrders);
    
    res.json({
      success: true,
      message: 'Niveles reordenados exitosamente'
    });
  } catch (error) {
    console.error('Error al reordenar niveles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas de un nivel
const getLevelStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const level = await Level.findById(id);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Nivel no encontrado'
      });
    }
    
    // Crear una instancia de Level para poder usar el método getStats
    const levelInstance = new Level(
      level.id,
      level.planetId,
      level.title,
      level.isActive,
      level.orderIndex,
      level.createdAt,
      level.updatedAt
    );
    
    const stats = await levelInstance.getStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Estadísticas del nivel obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del nivel:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener conteo de niveles
const getLevelsCount = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    const count = await Level.count(includeInactive === 'true');
    
    res.json({
      success: true,
      data: { count },
      message: 'Conteo de niveles obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener conteo de niveles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};


module.exports = {
  getAllLevels,
  getLevelById,
  getLevelWithExercises,
  testCreateLevel,
  createLevel,
  updateLevel,
  deleteLevel,
  deleteLevelPermanently,
  reorderLevels,
  getLevelStats,
  getLevelsCount,
};

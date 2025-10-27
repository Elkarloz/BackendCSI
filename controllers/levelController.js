const Level = require('../models/Level');

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
    
    // Validar que el orderIndex no esté duplicado para este planeta
    const finalOrderIndex = orderIndex || 1;
    const existingLevel = await Level.findByPlanetAndOrderIndex(planetId, finalOrderIndex);
    if (existingLevel) {
      console.log('❌ Backend createLevel - OrderIndex duplicado:', finalOrderIndex, 'usado por nivel:', existingLevel.id);
      return res.status(400).json({
        success: false,
        message: `El orden ${finalOrderIndex} ya está ocupado por otro nivel en este planeta. Por favor, elige un orden diferente.`
      });
    }
    
    const level = await Level.create({
      planetId,
      title,
      orderIndex: finalOrderIndex
    });
    
    res.status(201).json({
      success: true,
      data: level,
      message: 'Nivel creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear nivel:', error);
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
        console.log('❌ Backend updateLevel - OrderIndex duplicado:', orderIndex, 'usado por nivel:', existingLevel.id);
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
  createLevel,
  updateLevel,
  deleteLevel,
  deleteLevelPermanently,
  reorderLevels,
  getLevelStats,
  getLevelsCount,
};

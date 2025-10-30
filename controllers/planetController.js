const Planet = require('../models/Planet');

// Obtener todos los planetas
const getAllPlanets = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    const planets = await Planet.findAll(includeInactive === 'true');
    
    res.json({
      success: true,
      data: planets,
      message: 'Planetas obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener planetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener planeta por ID
const getPlanetById = async (req, res) => {
  try {
    const { id } = req.params;
    const planet = await Planet.findById(id);
    
    if (!planet) {
      return res.status(404).json({
        success: false,
        message: 'Planeta no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: planet,
      message: 'Planeta obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener planeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener planeta con sus niveles
const getPlanetWithLevels = async (req, res) => {
  try {
    const { id } = req.params;
    const planet = await Planet.findByIdWithLevels(id);
    
    if (!planet) {
      return res.status(404).json({
        success: false,
        message: 'Planeta no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: planet,
      message: 'Planeta con niveles obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener planeta con niveles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear nuevo planeta
const createPlanet = async (req, res) => {
  try {
    const { title, description, orderIndex } = req.body;
    const createdBy = req.user.id; // Asumiendo que el middleware de auth establece req.user
    
    
    // Validaciones
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Título es requerido'
      });
    }
    
    // Validar que el orden no esté duplicado
    const finalOrderIndex = orderIndex || 1;
    const existingPlanet = await Planet.findByOrderIndex(finalOrderIndex);
    if (existingPlanet) {
      console.log('❌ Backend createPlanet - Orden duplicado:', finalOrden, 'usado por planeta:', existingPlanet.id);
      return res.status(400).json({
        success: false,
        message: `El orden ${finalOrderIndex} ya está ocupado por otro planeta. Por favor, elige un orden diferente.`
      });
    }
    
    const planet = await Planet.create({
      title,
      description,
      orderIndex: finalOrderIndex,
      createdBy
    });
    
    res.status(201).json({
      success: true,
      data: planet,
      message: 'Planeta creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear planeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar planeta
const updatePlanet = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, orderIndex, isActive } = req.body;
    
    console.log('🪐 Backend updatePlanet - Datos recibidos:', { id, title, description, orderIndex, isActive });
    
    const planet = await Planet.findById(id);
    if (!planet) {
      return res.status(404).json({
        success: false,
        message: 'Planeta no encontrado'
      });
    }
    
    // Validar que el orden no esté duplicado (excepto para el mismo planeta)
    if (orderIndex) {
      const existingPlanet = await Planet.findByOrderIndex(orderIndex);
      if (existingPlanet && String(existingPlanet.id) !== String(id)) {
        console.log('❌ Backend updatePlanet - Orden duplicado:', orderIndex, 'usado por planeta:', existingPlanet.id);
        return res.status(400).json({
          success: false,
          message: `El orden ${orderIndex} ya está ocupado por otro planeta. Por favor, elige un orden diferente.`
        });
      }
    }
    
    await planet.update({
      title,
      description,
      orderIndex: orderIndex || 1,
      isActive: isActive !== undefined ? isActive : true
    });
    
    res.json({
      success: true,
      data: planet,
      message: 'Planeta actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar planeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar planeta (soft delete)
const deletePlanet = async (req, res) => {
  try {
    const { id } = req.params;
    
    const planet = await Planet.findById(id);
    if (!planet) {
      return res.status(404).json({
        success: false,
        message: 'Planeta no encontrado'
      });
    }
    
    await planet.delete();
    
    res.json({
      success: true,
      message: 'Planeta eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar planeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar planeta permanentemente
const deletePlanetPermanently = async (req, res) => {
  try {
    const { id } = req.params;
    
    const planet = await Planet.findById(id);
    if (!planet) {
      return res.status(404).json({
        success: false,
        message: 'Planeta no encontrado'
      });
    }
    
    await planet.deletePermanently();
    
    res.json({
      success: true,
      message: 'Planeta eliminado permanentemente'
    });
  } catch (error) {
    console.error('Error al eliminar planeta permanentemente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Reordenar planetas
const reorderPlanets = async (req, res) => {
  try {
    const { planetOrders } = req.body;
    
    if (!Array.isArray(planetOrders)) {
      return res.status(400).json({
        success: false,
        message: 'planetOrders debe ser un array'
      });
    }
    
    await Planet.reorder(planetOrders);
    
    res.json({
      success: true,
      message: 'Planetas reordenados exitosamente'
    });
  } catch (error) {
    console.error('Error al reordenar planetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas de un planeta
const getPlanetStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const planet = await Planet.findById(id);
    if (!planet) {
      return res.status(404).json({
        success: false,
        message: 'Planeta no encontrado'
      });
    }
    
    const stats = await planet.getStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Estadísticas del planeta obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del planeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener conteo de planetas
const getPlanetsCount = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    const count = await Planet.count(includeInactive === 'true');
    
    res.json({
      success: true,
      data: { count },
      message: 'Conteo de planetas obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener conteo de planetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getAllPlanets,
  getPlanetById,
  getPlanetWithLevels,
  createPlanet,
  updatePlanet,
  deletePlanet,
  deletePlanetPermanently,
  reorderPlanets,
  getPlanetStats,
  getPlanetsCount
};

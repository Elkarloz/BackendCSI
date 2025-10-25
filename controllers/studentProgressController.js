const StudentProgress = require('../models/StudentProgress');

// Obtener progreso de un usuario
const getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const progress = await StudentProgress.findByUser(userId);
    const stats = await StudentProgress.getUserStats(userId);
    const unlockedLevels = await StudentProgress.getUnlockedLevels(userId);

    res.json({
      success: true,
      data: {
        progress,
        stats,
        unlockedLevels
      }
    });
  } catch (error) {
    console.error('Error al obtener progreso del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener progreso de un nivel específico
const getLevelProgress = async (req, res) => {
  try {
    const { userId, levelId } = req.params;
    
    if (!userId || !levelId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario y nivel requeridos'
      });
    }

    const progress = await StudentProgress.findByUserAndLevel(userId, levelId);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error al obtener progreso del nivel:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar progreso de un nivel
const updateLevelProgress = async (req, res) => {
  try {
    const { userId, levelId } = req.params;
    const { isCompleted, completionPercentage, totalExercises, completedExercises, score, timeSpent } = req.body;
    
    if (!userId || !levelId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario y nivel requeridos'
      });
    }

    const progress = await StudentProgress.upsert({
      userId: parseInt(userId),
      levelId: parseInt(levelId),
      isCompleted: isCompleted || false,
      completionPercentage: completionPercentage || 0,
      totalExercises: totalExercises || 0,
      completedExercises: completedExercises || 0,
      score: score || 0,
      timeSpent: timeSpent || 0
    });

    res.json({
      success: true,
      data: progress,
      message: 'Progreso actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Marcar nivel como completado
const markLevelCompleted = async (req, res) => {
  try {
    const { userId, levelId } = req.params;
    const { score } = req.body;
    
    if (!userId || !levelId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario y nivel requeridos'
      });
    }

    const progress = await StudentProgress.markCompleted(
      parseInt(userId), 
      parseInt(levelId), 
      score || 100
    );

    res.json({
      success: true,
      data: progress,
      message: 'Nivel marcado como completado'
    });
  } catch (error) {
    console.error('Error al marcar nivel como completado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Guardar intento de ejercicio
const saveExerciseAttempt = async (req, res) => {
  try {
    const { userId, exerciseId } = req.params;
    const { isCorrect, score, timeTaken, hintsUsed, userAnswer } = req.body;
    
    if (!userId || !exerciseId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario y ejercicio requeridos'
      });
    }

    // Insertar intento de ejercicio
    const query = `
      INSERT INTO exercise_attempts 
      (user_id, exercise_id, user_answer, is_correct, score, time_taken, hints_used, attempted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const { sequelize } = require('../config/database');
    await sequelize.query(query, {
      replacements: [
        parseInt(userId),
        parseInt(exerciseId),
        userAnswer || '',
        isCorrect ? 1 : 0,
        score || 0,
        timeTaken || 0,
        hintsUsed || 0
      ],
      type: sequelize.QueryTypes.INSERT
    });

    res.json({
      success: true,
      message: 'Intento de ejercicio guardado correctamente'
    });
  } catch (error) {
    console.error('Error al guardar intento de ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener niveles desbloqueados para un usuario
const getUnlockedLevels = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const unlockedLevels = await StudentProgress.getUnlockedLevels(userId);

    res.json({
      success: true,
      data: unlockedLevels
    });
  } catch (error) {
    console.error('Error al obtener niveles desbloqueados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas del usuario
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const stats = await StudentProgress.getUserStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getUserProgress,
  getLevelProgress,
  updateLevelProgress,
  markLevelCompleted,
  saveExerciseAttempt,
  getUnlockedLevels,
  getUserStats
};

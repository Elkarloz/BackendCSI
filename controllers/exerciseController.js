const Exercise = require('../models/Exercise');

// Obtener todos los ejercicios
const getAllExercises = async (req, res) => {
  try {
    const { 
      includeInactive = false, 
      type, 
      levelId, 
      planetId 
    } = req.query;
    
    const filters = {};
    if (type) filters.type = type;
    if (levelId) filters.levelId = levelId;
    if (planetId) filters.planetId = planetId;
    
    const exercises = await Exercise.findAll(includeInactive === 'true', filters);
    
    res.json({
      success: true,
      data: exercises,
      message: 'Ejercicios obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener ejercicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener ejercicio por ID
const getExerciseById = async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findById(id);
    
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: exercise,
      message: 'Ejercicio obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener ejercicios por nivel
const getExercisesByLevel = async (req, res) => {
  try {
    const { levelId } = req.params;
    const { includeInactive = false } = req.query;
    
    const exercises = await Exercise.findByLevel(levelId, includeInactive === 'true');
    
    res.json({
      success: true,
      data: exercises,
      message: 'Ejercicios del nivel obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener ejercicios del nivel:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear nuevo ejercicio
const createExercise = async (req, res) => {
  try {
    const { 
      levelId, 
      question, 
      type, 
      difficulty = 'easy', 
      points = 10, 
      timeLimit = 0, 
      optionA, 
      optionB, 
      optionC, 
      optionD, 
      correctAnswer, 
      explanation = '' 
    } = req.body;
    
    // Validaciones
    if (!levelId || !type || !question || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Nivel, tipo, pregunta y respuesta correcta son requeridos'
      });
    }
    
    const validTypes = ['multiple_choice', 'true_false', 'numeric'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de ejercicio no válido. Tipos permitidos: multiple_choice, true_false, numeric'
      });
    }
    
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: 'Dificultad no válida. Dificultades permitidas: easy, medium, hard'
      });
    }
    
    // Preparar los datos según el tipo de ejercicio
    let exerciseData = {
      levelId,
      question,
      type,
      difficulty,
      points,
      timeLimit,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation
    };

    // Configurar opciones automáticamente según el tipo
    if (type === 'true_false') {
      exerciseData.optionA = 'Verdadero';
      exerciseData.optionB = 'Falso';
      exerciseData.optionC = '';
      exerciseData.optionD = '';
      // Convertir V/F a Verdadero/Falso para la respuesta correcta
      if (correctAnswer === 'V') {
        exerciseData.correctAnswer = 'Verdadero';
      } else if (correctAnswer === 'F') {
        exerciseData.correctAnswer = 'Falso';
      }
    } else if (type === 'numeric') {
      exerciseData.optionA = '';
      exerciseData.optionB = '';
      exerciseData.optionC = '';
      exerciseData.optionD = '';
    }
    
    const exercise = await Exercise.create(exerciseData);
    
    res.status(201).json({
      success: true,
      data: exercise,
      message: 'Ejercicio creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar ejercicio
const updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      question, 
      type, 
      difficulty, 
      points, 
      timeLimit, 
      optionA, 
      optionB, 
      optionC, 
      optionD, 
      correctAnswer, 
      explanation, 
      isActive 
    } = req.body;
    
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
    }
    
    if (type && !['multiple_choice', 'true_false', 'numeric'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de ejercicio no válido. Tipos permitidos: multiple_choice, true_false, numeric'
      });
    }
    
    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: 'Dificultad no válida. Dificultades permitidas: easy, medium, hard'
      });
    }
    
    // Preparar los datos actualizados
    const updateData = {
      question: question || exercise.question,
      type: type || exercise.type,
      difficulty: difficulty || exercise.difficulty,
      points: points !== undefined ? points : exercise.points,
      timeLimit: timeLimit !== undefined ? timeLimit : exercise.timeLimit,
      optionA: optionA !== undefined ? optionA : exercise.optionA,
      optionB: optionB !== undefined ? optionB : exercise.optionB,
      optionC: optionC !== undefined ? optionC : exercise.optionC,
      optionD: optionD !== undefined ? optionD : exercise.optionD,
      correctAnswer: correctAnswer || exercise.correctAnswer,
      explanation: explanation !== undefined ? explanation : exercise.explanation,
      isActive: isActive !== undefined ? isActive : exercise.isActive
    };
    
    await exercise.update(updateData);
    
    res.json({
      success: true,
      data: exercise,
      message: 'Ejercicio actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar ejercicio (soft delete)
const deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
    }
    
    await exercise.delete();
    
    res.json({
      success: true,
      message: 'Ejercicio eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar ejercicio permanentemente
const deleteExercisePermanently = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
    }
    
    await exercise.deletePermanently();
    
    res.json({
      success: true,
      message: 'Ejercicio eliminado permanentemente'
    });
  } catch (error) {
    console.error('Error al eliminar ejercicio permanentemente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Reordenar ejercicios
const reorderExercises = async (req, res) => {
  try {
    const { exerciseOrders } = req.body;
    
    if (!Array.isArray(exerciseOrders)) {
      return res.status(400).json({
        success: false,
        message: 'exerciseOrders debe ser un array'
      });
    }
    
    await Exercise.reorder(exerciseOrders);
    
    res.json({
      success: true,
      message: 'Ejercicios reordenados exitosamente'
    });
  } catch (error) {
    console.error('Error al reordenar ejercicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas de un ejercicio
const getExerciseStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
    }
    
    const stats = await exercise.getStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Estadísticas del ejercicio obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener conteo de ejercicios
const getExercisesCount = async (req, res) => {
  try {
    const { 
      includeInactive = false, 
      type, 
      levelId, 
      planetId 
    } = req.query;
    
    const filters = {};
    if (type) filters.type = type;
    if (levelId) filters.levelId = levelId;
    if (planetId) filters.planetId = planetId;
    
    const count = await Exercise.count(includeInactive === 'true', filters);
    
    res.json({
      success: true,
      data: { count },
      message: 'Conteo de ejercicios obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener conteo de ejercicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Evaluar respuesta de ejercicio
const evaluateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const { userAnswer, timeTaken = 0, hintsUsed = 0 } = req.body;
    
    if (!userAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Respuesta del usuario es requerida'
      });
    }
    
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
    }
    
    const evaluation = await exercise.evaluateAnswer(userAnswer, timeTaken, hintsUsed);
    
    res.json({
      success: true,
      data: evaluation,
      message: 'Ejercicio evaluado exitosamente'
    });
  } catch (error) {
    console.error('Error al evaluar ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};


module.exports = {
  getAllExercises,
  getExerciseById,
  getExercisesByLevel,
  createExercise,
  updateExercise,
  deleteExercise,
  deleteExercisePermanently,
  reorderExercises,
  getExerciseStats,
  getExercisesCount,
  evaluateExercise
};

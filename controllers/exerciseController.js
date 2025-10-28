const Exercise = require('../models/Exercise');
const { uploadExerciseImage, handleUploadError, getFileUrl } = require('../middleware/upload');

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
    
    const validTypes = ['multiple_choice', 'true_false', 'numeric', 'image_multiple_choice'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de ejercicio no válido. Tipos permitidos: multiple_choice, true_false, numeric, image_multiple_choice'
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
      explanation,
      imageUrl: null
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
    
    // Obtener el ejercicio actualizado
    const updatedExercise = await Exercise.findById(id);
    
    res.json({
      success: true,
      data: updatedExercise,
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


// Subir imagen a ejercicio
const uploadExerciseImageController = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el ejercicio existe
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
    }
    
    // Usar middleware de Multer
    const { uploadExerciseImage: multerUpload } = require('../middleware/upload');
    multerUpload(req, res, async (err) => {
      if (err) {
        return handleUploadError(err, req, res);
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se ha subido ningún archivo'
        });
      }
      
      try {
        // Generar URL del archivo
        const imageUrl = getFileUrl(req, req.file.filename, 'image');
        
        // Actualizar ejercicio con la URL de la imagen
        await exercise.update({ imageUrl });
        
        res.json({
          success: true,
          data: {
            imageUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
          },
          message: 'Imagen subida exitosamente'
        });
      } catch (error) {
        console.error('Error al actualizar ejercicio con imagen:', error);
        res.status(500).json({
          success: false,
          message: 'Error al actualizar ejercicio con imagen',
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar imagen de ejercicio
const deleteExerciseImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
    }
    
    if (!exercise.imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'El ejercicio no tiene imagen'
      });
    }
    
    // Extraer nombre del archivo de la URL
    const filename = exercise.imageUrl.split('/').pop();
    const filePath = `uploads/images/${filename}`;
    
    // Eliminar archivo del sistema de archivos
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Actualizar ejercicio para remover la URL de la imagen
    await exercise.update({ imageUrl: null });
    
    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
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
  evaluateExercise,
  uploadExerciseImage: uploadExerciseImageController,
  deleteExerciseImage
};

const ProgresoEstudiante = require('../models/StudentProgress');
const RespuestaEjercicio = require('../models/RespuestaEjercicio');
const { sequelize } = require('../config/database');

// Obtener progreso de un usuario
const getUserProgress = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    if (!idUsuario) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const progreso = await ProgresoEstudiante.findByUser(idUsuario);
    const estadisticas = await ProgresoEstudiante.getUserStats(idUsuario);
    const nivelesDesbloqueados = await ProgresoEstudiante.getUnlockedLevels(idUsuario);

    res.json({
      success: true,
      data: {
        progreso,
        estadisticas,
        nivelesDesbloqueados
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
    const { idUsuario, idNivel } = req.params;
    
    if (!idUsuario || !idNivel) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario y nivel requeridos'
      });
    }

    const progreso = await ProgresoEstudiante.findByUserAndLevel(idUsuario, idNivel);

    if (!progreso) {
      return res.json({
        success: true,
        data: null,
        message: 'No se encontró progreso para este nivel'
      });
    }

    res.json({
      success: true,
      data: progreso.toObject()
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
    const { idUsuario, idNivel } = req.params;
    const { 
      completado, 
      porcentajeCompletado, 
      totalEjercicios, 
      ejerciciosCompletados, 
      puntuacion, 
      tiempoGastado 
    } = req.body;
    
    if (!idUsuario || !idNivel) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario y nivel requeridos'
      });
    }

    const progreso = await ProgresoEstudiante.upsert({
      userId: parseInt(idUsuario),
      levelId: parseInt(idNivel),
      isCompleted: completado || false,
      completionPercentage: porcentajeCompletado || 0,
      totalExercises: totalEjercicios || 0,
      completedExercises: ejerciciosCompletados || 0,
      score: puntuacion || 0,
      timeSpent: tiempoGastado || 0
    });

    res.json({
      success: true,
      data: progreso.toObject(),
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
    const { idUsuario, idNivel } = req.params;
    const { puntuacion = 100 } = req.body;
    
    if (!idUsuario || !idNivel) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario y nivel requeridos'
      });
    }

    const progreso = await ProgresoEstudiante.markCompleted(idUsuario, idNivel, puntuacion);

    res.json({
      success: true,
      data: progreso.toObject(),
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

// Guardar respuesta de ejercicio
const saveExerciseResponse = async (req, res) => {
  try {
    const { idUsuario, idNivel } = req.params;
    const { 
      idEjercicio, 
      respuesta, 
      esCorrecta, 
      puntuacion = 0, 
      tiempoGastado = 0 
    } = req.body;
    
    if (!idUsuario || !idNivel || !idEjercicio) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario, nivel y ejercicio requeridos'
      });
    }

    // Verificar si el usuario ya respondió este ejercicio
    const canAnswer = await RespuestaEjercicio.canUserAnswer(idUsuario, idEjercicio);
    
    if (!canAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Ya has respondido este ejercicio anteriormente',
        code: 'EXERCISE_ALREADY_ANSWERED'
      });
    }

    // Guardar la respuesta específica del ejercicio
    const respuestaEjercicio = await RespuestaEjercicio.saveResponse({
      idUsuario: parseInt(idUsuario),
      idNivel: parseInt(idNivel),
      idEjercicio: parseInt(idEjercicio),
      respuesta,
      esCorrecta: esCorrecta || false,
      puntuacion: parseFloat(puntuacion),
      tiempoGastado: parseInt(tiempoGastado)
    });

    // Actualizar el progreso general del nivel
    const resultado = await ProgresoEstudiante.saveExerciseResponse({
      userId: parseInt(idUsuario),
      levelId: parseInt(idNivel),
      exerciseId: parseInt(idEjercicio),
      respuesta,
      esCorrecta: esCorrecta || false,
      puntuacion: parseFloat(puntuacion),
      tiempoGastado: parseInt(tiempoGastado)
    });

    res.json({
      success: true,
      data: {
        respuestaEjercicio: respuestaEjercicio.toObject(),
        progreso: resultado.progreso,
        respuesta: resultado.respuesta
      },
      message: 'Respuesta guardada correctamente'
    });
  } catch (error) {
    console.error('Error al guardar respuesta:', error);
    
    if (error.message === 'El usuario ya respondió este ejercicio') {
      return res.status(400).json({
        success: false,
        message: 'Ya has respondido este ejercicio anteriormente',
        code: 'EXERCISE_ALREADY_ANSWERED'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas de progreso
const getProgressStats = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    if (!idUsuario) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const estadisticas = await ProgresoEstudiante.getUserStats(idUsuario);

    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener niveles desbloqueados
const getUnlockedLevels = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    if (!idUsuario) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const nivelesDesbloqueados = await ProgresoEstudiante.getUnlockedLevels(idUsuario);

    res.json({
      success: true,
      data: nivelesDesbloqueados
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

// Verificar si un ejercicio puede ser respondido
const canAnswerExercise = async (req, res) => {
  try {
    const { idUsuario, idEjercicio } = req.params;
    
    if (!idUsuario || !idEjercicio) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario y ejercicio requeridos'
      });
    }

    const canAnswer = await RespuestaEjercicio.canUserAnswer(idUsuario, idEjercicio);
    const existingResponse = await RespuestaEjercicio.hasUserAnswered(idUsuario, idEjercicio);

    res.json({
      success: true,
      data: {
        canAnswer,
        alreadyAnswered: !canAnswer,
        existingResponse: existingResponse
      }
    });
  } catch (error) {
    console.error('Error al verificar si puede responder:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener respuestas de un usuario en un nivel
const getUserResponses = async (req, res) => {
  try {
    const { idUsuario, idNivel } = req.params;
    
    if (!idUsuario) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    let respuestas;
    if (idNivel) {
      respuestas = await RespuestaEjercicio.getByUserAndLevel(idUsuario, idNivel);
    } else {
      respuestas = await RespuestaEjercicio.getByUser(idUsuario);
    }

    res.json({
      success: true,
      data: respuestas
    });
  } catch (error) {
    console.error('Error al obtener respuestas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas de respuestas
const getResponseStats = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    if (!idUsuario) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const estadisticas = await RespuestaEjercicio.getUserResponseStats(idUsuario);

    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de respuestas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener progreso por planeta
const getPlanetProgress = async (req, res) => {
  try {
    const { idUsuario, idPlaneta } = req.params;
    
    if (!idUsuario || !idPlaneta) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario y planeta requeridos'
      });
    }

    const query = `
      SELECT 
        pe.*,
        n.orden as numero_nivel,
        n.titulo as titulo_nivel,
        p.titulo as titulo_planeta
      FROM progreso_estudiante pe
      JOIN niveles n ON pe.id_nivel = n.id
      JOIN planetas p ON n.id_planeta = p.id
      WHERE pe.id_usuario = ? AND n.id_planeta = ?
      ORDER BY n.orden
    `;
    
    const results = await sequelize.query(query, {
      replacements: [idUsuario, idPlaneta],
      type: sequelize.QueryTypes.SELECT
    });

    // Calcular estadísticas del planeta
    const totalNiveles = results.length;
    const nivelesCompletados = results.filter(r => r.completado).length;
    const porcentajeCompletado = totalNiveles > 0 ? (nivelesCompletados / totalNiveles) * 100 : 0;
    const puntuacionPromedio = results.length > 0 ? 
      results.reduce((sum, r) => sum + (r.puntuacion || 0), 0) / results.length : 0;

    res.json({
      success: true,
      data: {
        planeta: {
          id: idPlaneta,
          titulo: results[0]?.titulo_planeta || 'Planeta desconocido',
          totalNiveles,
          nivelesCompletados,
          porcentajeCompletado: Math.round(porcentajeCompletado * 100) / 100,
          puntuacionPromedio: Math.round(puntuacionPromedio * 100) / 100
        },
        niveles: results.map(progreso => ({
          id: progreso.id,
          idUsuario: progreso.id_usuario,
          idNivel: progreso.id_nivel,
          numeroNivel: progreso.numero_nivel,
          tituloNivel: progreso.titulo_nivel,
          completado: progreso.completado,
          porcentajeCompletado: progreso.porcentaje_completado,
          totalEjercicios: progreso.total_ejercicios,
          ejerciciosCompletados: progreso.ejercicios_completados,
          puntuacion: progreso.puntuacion,
          tiempoGastado: progreso.tiempo_gastado,
          ultimoAcceso: progreso.ultimo_acceso,
          fechaCompletado: progreso.fecha_completado
        }))
      }
    });
  } catch (error) {
    console.error('Error al obtener progreso del planeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener resumen completo del progreso (todos los planetas)
const getCompleteProgressSummary = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    if (!idUsuario) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const query = `
      SELECT 
        p.id as id_planeta,
        p.titulo as titulo_planeta,
        p.orden,
        COUNT(n.id) as total_niveles,
        COUNT(pe.id) as niveles_iniciados,
        COUNT(CASE WHEN pe.completado = 1 THEN 1 END) as niveles_completados,
        AVG(pe.puntuacion) as puntuacion_promedio,
        SUM(pe.tiempo_gastado) as tiempo_total_gastado
      FROM planetas p
      LEFT JOIN niveles n ON p.id = n.id_planeta AND n.activo = 1
      LEFT JOIN progreso_estudiante pe ON n.id = pe.id_nivel AND pe.id_usuario = ?
      GROUP BY p.id, p.titulo, p.orden
      ORDER BY p.orden
    `;
    
    const results = await sequelize.query(query, {
      replacements: [idUsuario],
      type: sequelize.QueryTypes.SELECT
    });

    const planetas = results.map(planeta => ({
      id: planeta.id_planeta,
      titulo: planeta.titulo_planeta,
      ordenIndice: planeta.orden,
      totalNiveles: parseInt(planeta.total_niveles) || 0,
      nivelesIniciados: parseInt(planeta.niveles_iniciados) || 0,
      nivelesCompletados: parseInt(planeta.niveles_completados) || 0,
      porcentajeCompletado: planeta.total_niveles > 0 ? 
        Math.round((planeta.niveles_completados / planeta.total_niveles) * 10000) / 100 : 0,
      puntuacionPromedio: Math.round((planeta.puntuacion_promedio || 0) * 100) / 100,
      tiempoTotalGastado: parseInt(planeta.tiempo_total_gastado) || 0,
      desbloqueado: planeta.niveles_completados > 0 || planeta.id_planeta === 1
    }));

    // Calcular estadísticas generales
    const totalNiveles = planetas.reduce((sum, p) => sum + p.totalNiveles, 0);
    const totalCompletados = planetas.reduce((sum, p) => sum + p.nivelesCompletados, 0);
    const totalTiempo = planetas.reduce((sum, p) => sum + p.tiempoTotalGastado, 0);
    const puntuacionGeneral = planetas.length > 0 ? 
      planetas.reduce((sum, p) => sum + p.puntuacionPromedio, 0) / planetas.length : 0;

    res.json({
      success: true,
      data: {
        resumenGeneral: {
          totalPlanetas: planetas.length,
          totalNiveles,
          nivelesCompletados: totalCompletados,
          porcentajeCompletado: totalNiveles > 0 ? 
            Math.round((totalCompletados / totalNiveles) * 10000) / 100 : 0,
          puntuacionPromedio: Math.round(puntuacionGeneral * 100) / 100,
          tiempoTotalGastado: totalTiempo
        },
        planetas
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen completo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener próximos niveles a desbloquear
const getNextUnlockableLevels = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    if (!idUsuario) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const query = `
      SELECT 
        n.id,
        n.orden as numero_nivel,
        n.titulo as titulo_nivel,
        p.id as id_planeta,
        p.titulo as titulo_planeta,
        p.orden as orden_indice,
        CASE 
          WHEN n.orden = 1 AND p.id = 1 THEN 'disponible'
          WHEN EXISTS (
            SELECT 1 FROM progreso_estudiante pe2 
            JOIN niveles n2 ON pe2.id_nivel = n2.id 
            WHERE pe2.id_usuario = ? 
            AND pe2.completado = 1 
            AND n2.id_planeta = n.id_planeta 
            AND n2.orden = n.orden - 1
          ) THEN 'disponible'
          WHEN EXISTS (
            SELECT 1 FROM progreso_estudiante pe3 
            JOIN niveles n3 ON pe3.id_nivel = n3.id 
            WHERE pe3.id_usuario = ? 
            AND pe3.completado = 1 
            AND n3.id_planeta = p.id - 1
            AND n3.orden = 5
          ) AND n.orden = 1 THEN 'disponible'
          ELSE 'bloqueado'
        END as estado
      FROM niveles n
      JOIN planetas p ON n.id_planeta = p.id
      WHERE n.activo = 1
      ORDER BY p.orden, n.orden
    `;
    
    const results = await sequelize.query(query, {
      replacements: [idUsuario, idUsuario],
      type: sequelize.QueryTypes.SELECT
    });

    const nivelesDisponibles = results.filter(r => r.estado === 'disponible');
    const proximosNiveles = nivelesDisponibles.slice(0, 5); // Próximos 5 niveles

    res.json({
      success: true,
      data: {
        proximosNiveles: proximosNiveles.map(nivel => ({
          id: nivel.id,
          numeroNivel: nivel.numero_nivel,
          tituloNivel: nivel.titulo_nivel,
          idPlaneta: nivel.id_planeta,
          tituloPlaneta: nivel.titulo_planeta,
          ordenIndice: nivel.orden_indice,
          estado: nivel.estado
        })),
        totalDisponibles: nivelesDisponibles.length,
        totalBloqueados: results.filter(r => r.estado === 'bloqueado').length
      }
    });
  } catch (error) {
    console.error('Error al obtener próximos niveles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener logros del usuario
const getUserAchievements = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    if (!idUsuario) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    // Obtener estadísticas para calcular logros
    const stats = await ProgresoEstudiante.getUserStats(idUsuario);
    const responseStats = await RespuestaEjercicio.getUserResponseStats(idUsuario);

    const logros = [];

    // Logros basados en niveles completados
    if ((stats.levels_completed || 0) >= 1) {
      logros.push({
        id: 'primer_nivel',
        titulo: 'Primer Paso',
        descripcion: 'Completaste tu primer nivel',
        fecha: new Date(),
        tipo: 'nivel'
      });
    }

    if ((stats.levels_completed || 0) >= 5) {
      logros.push({
        id: 'cinco_niveles',
        titulo: 'Explorador',
        descripcion: 'Completaste 5 niveles',
        fecha: new Date(),
        tipo: 'nivel'
      });
    }

    if ((stats.levels_completed || 0) >= 10) {
      logros.push({
        id: 'diez_niveles',
        titulo: 'Aventurero',
        descripcion: 'Completaste 10 niveles',
        fecha: new Date(),
        tipo: 'nivel'
      });
    }

    // Logros basados en respuestas correctas
    if (responseStats.respuestas_correctas >= 10) {
      logros.push({
        id: 'diez_correctas',
        titulo: 'Precisión',
        descripcion: 'Respondiste correctamente 10 ejercicios',
        fecha: new Date(),
        tipo: 'respuesta'
      });
    }

    if (responseStats.respuestas_correctas >= 50) {
      logros.push({
        id: 'cincuenta_correctas',
        titulo: 'Maestro',
        descripcion: 'Respondiste correctamente 50 ejercicios',
        fecha: new Date(),
        tipo: 'respuesta'
      });
    }

    // Logros basados en puntuación
    if ((stats.average_score || 0) >= 80) {
      logros.push({
        id: 'puntuacion_alta',
        titulo: 'Excelencia',
        descripcion: 'Mantienes una puntuación promedio de 80+',
        fecha: new Date(),
        tipo: 'puntuacion'
      });
    }

    res.json({
      success: true,
      data: {
        logros,
        totalLogros: logros.length,
        estadisticas: {
          nivelesCompletados: stats.levels_completed || 0,
          respuestasCorrectas: responseStats.respuestas_correctas,
          puntuacionPromedio: stats.average_score || 0
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener logros:', error);
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
  saveExerciseResponse,
  getProgressStats,
  getUnlockedLevels,
  canAnswerExercise,
  getUserResponses,
  getResponseStats,
  getPlanetProgress,
  getCompleteProgressSummary,
  getNextUnlockableLevels,
  getUserAchievements
};

/**
 * ReportController - Controlador para reportes de progreso
 * Endpoints para obtener estadísticas generales y por estudiante
 */

const { sequelize } = require('../config/database');
const StudentProgress = require('../models/StudentProgress');
const User = require('../models/User');

/**
 * GET /api/reports/general
 * Obtiene reporte general del sistema
 */
const getGeneralReport = async (req, res) => {
  try {
    // Estadísticas generales
    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalPlanets,
      totalLevels,
      totalExercises,
      totalProgress
    ] = await Promise.all([
      sequelize.query('SELECT COUNT(*) as count FROM users', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query("SELECT COUNT(*) as count FROM users WHERE role = 'estudiante'", { type: sequelize.QueryTypes.SELECT }),
      sequelize.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM planets WHERE is_active = 1', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM levels WHERE is_active = 1', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM exercises WHERE is_active = 1', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM student_progress', { type: sequelize.QueryTypes.SELECT })
    ]);

    // Progreso promedio
    const [avgProgress] = await sequelize.query(
      `SELECT 
        AVG(completion_percentage) as avg_completion,
        AVG(score) as avg_score,
        SUM(time_spent) as total_time_spent,
        COUNT(DISTINCT CASE WHEN is_completed = 1 THEN level_id END) as completed_levels
      FROM student_progress`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // Estudiantes activos (con al menos un progreso registrado)
    const [activeStudents] = await sequelize.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM student_progress',
      { type: sequelize.QueryTypes.SELECT }
    );

    // Top 5 estudiantes por puntaje
    const topStudents = await sequelize.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        SUM(sp.score) as total_score,
        COUNT(DISTINCT CASE WHEN sp.is_completed = 1 THEN sp.level_id END) as completed_levels,
        AVG(sp.completion_percentage) as avg_completion
      FROM users u
      JOIN student_progress sp ON u.id = sp.user_id
      WHERE u.role = 'estudiante'
      GROUP BY u.id, u.name, u.email
      ORDER BY total_score DESC
      LIMIT 5`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // Distribución por planetas
    const planetDistribution = await sequelize.query(
      `SELECT 
        p.id,
        p.title,
        COUNT(DISTINCT sp.user_id) as students_count,
        COUNT(DISTINCT CASE WHEN sp.is_completed = 1 THEN sp.level_id END) as completed_levels
      FROM planets p
      LEFT JOIN levels l ON p.id = l.planet_id AND l.is_active = 1
      LEFT JOIN student_progress sp ON l.id = sp.level_id
      WHERE p.is_active = 1
      GROUP BY p.id, p.title
      ORDER BY p.order_index`,
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: parseInt(totalUsers[0].count || 0),
          totalStudents: parseInt(totalStudents[0].count || 0),
          totalAdmins: parseInt(totalAdmins[0].count || 0),
          activeStudents: parseInt(activeStudents.count || 0),
          totalPlanets: parseInt(totalPlanets[0].count || 0),
          totalLevels: parseInt(totalLevels[0].count || 0),
          totalExercises: parseInt(totalExercises[0].count || 0),
          totalProgressRecords: parseInt(totalProgress[0].count || 0)
        },
        averages: {
          avgCompletion: parseFloat(avgProgress.avg_completion || 0).toFixed(2),
          avgScore: parseFloat(avgProgress.avg_score || 0).toFixed(2),
          totalTimeSpent: parseInt(avgProgress.total_time_spent || 0),
          completedLevels: parseInt(avgProgress.completed_levels || 0)
        },
        topStudents: topStudents.map(student => ({
          id: student.id,
          name: student.name,
          email: student.email,
          totalScore: parseInt(student.total_score || 0),
          completedLevels: parseInt(student.completed_levels || 0),
          avgCompletion: parseFloat(student.avg_completion || 0).toFixed(2)
        })),
        planetDistribution: planetDistribution.map(planet => ({
          id: planet.id,
          title: planet.title,
          studentsCount: parseInt(planet.students_count || 0),
          completedLevels: parseInt(planet.completed_levels || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Error en getGeneralReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte general',
      error: error.message
    });
  }
};

/**
 * GET /api/reports/students
 * Obtiene reporte de progreso por estudiante
 */
const getStudentsReport = async (req, res) => {
  try {
    // Obtener todos los estudiantes con su progreso
    const students = await sequelize.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        COUNT(DISTINCT sp.level_id) as levels_started,
        COUNT(DISTINCT CASE WHEN sp.is_completed = 1 THEN sp.level_id END) as levels_completed,
        SUM(sp.score) as total_score,
        AVG(sp.completion_percentage) as avg_completion,
        SUM(sp.time_spent) as total_time_spent,
        MAX(sp.last_accessed) as last_activity
      FROM users u
      LEFT JOIN student_progress sp ON u.id = sp.user_id
      WHERE u.role = 'estudiante'
      GROUP BY u.id, u.name, u.email, u.created_at
      ORDER BY total_score DESC, levels_completed DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // Obtener detalles de progreso por estudiante
    const studentsWithDetails = await Promise.all(
      students.map(async (student) => {
        // Progreso por planeta
        const planetProgress = await sequelize.query(
          `SELECT 
            p.id,
            p.title,
            COUNT(DISTINCT sp.level_id) as levels_started,
            COUNT(DISTINCT CASE WHEN sp.is_completed = 1 THEN sp.level_id END) as levels_completed,
            AVG(sp.completion_percentage) as avg_completion
          FROM planets p
          LEFT JOIN levels l ON p.id = l.planet_id AND l.is_active = 1
          LEFT JOIN student_progress sp ON l.id = sp.level_id AND sp.user_id = ?
          WHERE p.is_active = 1
          GROUP BY p.id, p.title
          ORDER BY p.order_index`,
          {
            replacements: [student.id],
            type: sequelize.QueryTypes.SELECT
          }
        );

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          createdAt: student.created_at,
          summary: {
            levelsStarted: parseInt(student.levels_started || 0),
            levelsCompleted: parseInt(student.levels_completed || 0),
            totalScore: parseInt(student.total_score || 0),
            avgCompletion: parseFloat(student.avg_completion || 0).toFixed(2),
            totalTimeSpent: parseInt(student.total_time_spent || 0),
            lastActivity: student.last_activity
          },
          planetProgress: planetProgress.map(planet => ({
            id: planet.id,
            title: planet.title,
            levelsStarted: parseInt(planet.levels_started || 0),
            levelsCompleted: parseInt(planet.levels_completed || 0),
            avgCompletion: parseFloat(planet.avg_completion || 0).toFixed(2)
          }))
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        students: studentsWithDetails
      }
    });
  } catch (error) {
    console.error('Error en getStudentsReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte de estudiantes',
      error: error.message
    });
  }
};

/**
 * GET /api/reports/student/:userId
 * Obtiene reporte detallado de un estudiante específico
 */
const getStudentReport = async (req, res) => {
  try {
    const { userId } = req.params;

    // Información del estudiante
    const [student] = await sequelize.query(
      `SELECT id, name, email, created_at FROM users WHERE id = ? AND role = 'estudiante'`,
      {
        replacements: [userId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // Estadísticas generales
    const [stats] = await sequelize.query(
      `SELECT 
        COUNT(DISTINCT sp.level_id) as levels_started,
        COUNT(DISTINCT CASE WHEN sp.is_completed = 1 THEN sp.level_id END) as levels_completed,
        SUM(sp.score) as total_score,
        AVG(sp.completion_percentage) as avg_completion,
        SUM(sp.time_spent) as total_time_spent,
        COUNT(DISTINCT p.id) as planets_accessed
      FROM student_progress sp
      JOIN levels l ON sp.level_id = l.id
      JOIN planets p ON l.planet_id = p.id
      WHERE sp.user_id = ?`,
      {
        replacements: [userId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Progreso detallado por nivel
    const levelProgress = await sequelize.query(
      `SELECT 
        sp.*,
        l.title as level_title,
        l.order_index as level_number,
        p.title as planet_title,
        p.order_index as planet_number
      FROM student_progress sp
      JOIN levels l ON sp.level_id = l.id
      JOIN planets p ON l.planet_id = p.id
      WHERE sp.user_id = ?
      ORDER BY p.order_index, l.order_index`,
      {
        replacements: [userId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          createdAt: student.created_at
        },
        stats: {
          levelsStarted: parseInt(stats.levels_started || 0),
          levelsCompleted: parseInt(stats.levels_completed || 0),
          totalScore: parseInt(stats.total_score || 0),
          avgCompletion: parseFloat(stats.avg_completion || 0).toFixed(2),
          totalTimeSpent: parseInt(stats.total_time_spent || 0),
          planetsAccessed: parseInt(stats.planets_accessed || 0)
        },
        levelProgress: levelProgress.map(progress => ({
          id: progress.id,
          levelId: progress.level_id,
          levelTitle: progress.level_title,
          levelNumber: progress.level_number,
          planetTitle: progress.planet_title,
          planetNumber: progress.planet_number,
          isCompleted: Boolean(progress.is_completed),
          completionPercentage: parseFloat(progress.completion_percentage || 0).toFixed(2),
          score: parseInt(progress.score || 0),
          timeSpent: parseInt(progress.time_spent || 0),
          lastAccessed: progress.last_accessed,
          completedAt: progress.completed_at
        }))
      }
    });
  } catch (error) {
    console.error('Error en getStudentReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte del estudiante',
      error: error.message
    });
  }
};

module.exports = {
  getGeneralReport,
  getStudentsReport,
  getStudentReport
};


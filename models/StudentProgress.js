const { sequelize } = require('../config/database');

class StudentProgress {
  constructor(id, userId, levelId, isCompleted, completionPercentage, totalExercises, completedExercises, score, timeSpent, lastAccessed, completedAt, createdAt, updatedAt) {
    this.id = id;
    this.userId = userId;
    this.levelId = levelId;
    this.isCompleted = isCompleted;
    this.completionPercentage = completionPercentage;
    this.totalExercises = totalExercises;
    this.completedExercises = completedExercises;
    this.score = score;
    this.timeSpent = timeSpent;
    this.lastAccessed = lastAccessed;
    this.completedAt = completedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Obtener progreso de un usuario en un nivel específico
  static async findByUserAndLevel(userId, levelId) {
    try {
      const query = `
        SELECT * FROM student_progress 
        WHERE user_id = ? AND level_id = ?
      `;
      
      const results = await sequelize.query(query, {
        replacements: [userId, levelId],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (results.length === 0) {
        return null;
      }

      const progress = results[0];
      return new StudentProgress(
        progress.id,
        progress.user_id,
        progress.level_id,
        progress.is_completed,
        progress.completion_percentage,
        progress.total_exercises,
        progress.completed_exercises,
        progress.score,
        progress.time_spent,
        progress.last_accessed,
        progress.completed_at,
        progress.created_at,
        progress.updated_at
      );
    } catch (error) {
      throw error;
    }
  }

  // Obtener todo el progreso de un usuario
  static async findByUser(userId) {
    try {
      const query = `
        SELECT sp.*, l.level_number, l.title as level_title, p.title as planet_title
        FROM student_progress sp
        JOIN levels l ON sp.level_id = l.id
        JOIN planets p ON l.planet_id = p.id
        WHERE sp.user_id = ?
        ORDER BY p.order_index, l.level_number
      `;
      
      const results = await sequelize.query(query, {
        replacements: [userId],
        type: sequelize.QueryTypes.SELECT
      });
      
      return results.map(progress => ({
        id: progress.id,
        userId: progress.user_id,
        levelId: progress.level_id,
        levelNumber: progress.level_number,
        levelTitle: progress.level_title,
        planetTitle: progress.planet_title,
        isCompleted: progress.is_completed,
        completionPercentage: progress.completion_percentage,
        totalExercises: progress.total_exercises,
        completedExercises: progress.completed_exercises,
        score: progress.score,
        timeSpent: progress.time_spent,
        lastAccessed: progress.last_accessed,
        completedAt: progress.completed_at,
        createdAt: progress.created_at,
        updatedAt: progress.updated_at
      }));
    } catch (error) {
      throw error;
    }
  }

  // Crear o actualizar progreso
  static async upsert({ userId, levelId, isCompleted = false, completionPercentage = 0, totalExercises = 0, completedExercises = 0, score = 0, timeSpent = 0 }) {
    try {
      const query = `
        INSERT INTO student_progress 
        (user_id, level_id, is_completed, completion_percentage, total_exercises, completed_exercises, score, time_spent, last_accessed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        is_completed = VALUES(is_completed),
        completion_percentage = VALUES(completion_percentage),
        total_exercises = VALUES(total_exercises),
        completed_exercises = VALUES(completed_exercises),
        score = VALUES(score),
        time_spent = time_spent + VALUES(time_spent),
        last_accessed = NOW(),
        completed_at = CASE 
          WHEN VALUES(is_completed) = 1 AND is_completed = 0 THEN NOW()
          ELSE completed_at
        END
      `;
      
      await sequelize.query(query, {
        replacements: [userId, levelId, isCompleted, completionPercentage, totalExercises, completedExercises, score, timeSpent],
        type: sequelize.QueryTypes.INSERT
      });
      
      return await StudentProgress.findByUserAndLevel(userId, levelId);
    } catch (error) {
      throw error;
    }
  }

  // Marcar nivel como completado
  static async markCompleted(userId, levelId, score = 100) {
    try {
      const query = `
        INSERT INTO student_progress 
        (user_id, level_id, is_completed, completion_percentage, score, completed_at, last_accessed)
        VALUES (?, ?, 1, 100.00, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        is_completed = 1,
        completion_percentage = 100.00,
        score = GREATEST(score, VALUES(score)),
        completed_at = CASE 
          WHEN is_completed = 0 THEN NOW()
          ELSE completed_at
        END,
        last_accessed = NOW()
      `;
      
      await sequelize.query(query, {
        replacements: [userId, levelId, score],
        type: sequelize.QueryTypes.INSERT
      });
      
      return await StudentProgress.findByUserAndLevel(userId, levelId);
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas de progreso de un usuario
  static async getUserStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT sp.level_id) as levels_started,
          COUNT(DISTINCT CASE WHEN sp.is_completed = 1 THEN sp.level_id END) as levels_completed,
          AVG(sp.score) as average_score,
          SUM(sp.time_spent) as total_time_spent,
          COUNT(DISTINCT p.id) as planets_accessed
        FROM student_progress sp
        JOIN levels l ON sp.level_id = l.id
        JOIN planets p ON l.planet_id = p.id
        WHERE sp.user_id = ?
      `;
      
      const results = await sequelize.query(query, {
        replacements: [userId],
        type: sequelize.QueryTypes.SELECT
      });
      
      return results[0] || {
        levels_started: 0,
        levels_completed: 0,
        average_score: 0,
        total_time_spent: 0,
        planets_accessed: 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener niveles desbloqueados para un usuario
  static async getUnlockedLevels(userId) {
    try {
      const query = `
        SELECT DISTINCT l.id, l.level_number, l.planet_id, p.title as planet_title
        FROM levels l
        JOIN planets p ON l.planet_id = p.id
        WHERE l.is_active = 1 
        AND (
          -- Primer nivel del primer planeta siempre desbloqueado
          (p.id = 1 AND l.level_number = 1)
          OR
          -- Nivel completado desbloquea el siguiente nivel del mismo planeta
          EXISTS (
            SELECT 1 FROM student_progress sp2 
            JOIN levels l2 ON sp2.level_id = l2.id 
            WHERE sp2.user_id = ? 
            AND sp2.is_completed = 1 
            AND l2.planet_id = l.planet_id 
            AND l2.level_number = l.level_number - 1
          )
          OR
          -- Planeta completado desbloquea el primer nivel del siguiente planeta
          (
            l.level_number = 1 
            AND EXISTS (
              SELECT 1 FROM student_progress sp3 
              JOIN levels l3 ON sp3.level_id = l3.id 
              WHERE sp3.user_id = ? 
              AND sp3.is_completed = 1 
              AND l3.planet_id = p.id - 1
              AND l3.level_number = 5
            )
          )
        )
        ORDER BY p.order_index, l.level_number
      `;
      
      const results = await sequelize.query(query, {
        replacements: [userId, userId],
        type: sequelize.QueryTypes.SELECT
      });
      
      return results;
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener datos del progreso
  toObject() {
    return {
      id: this.id,
      userId: this.userId,
      levelId: this.levelId,
      isCompleted: this.isCompleted,
      completionPercentage: this.completionPercentage,
      totalExercises: this.totalExercises,
      completedExercises: this.completedExercises,
      score: this.score,
      timeSpent: this.timeSpent,
      lastAccessed: this.lastAccessed,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = StudentProgress;

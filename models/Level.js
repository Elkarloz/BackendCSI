const { sequelize } = require('../config/database');

class Level {
  constructor(id, planetId, title, isActive, orderIndex, createdAt, updatedAt) {
    this.id = id;
    this.planetId = planetId;
    this.title = title;
    this.isActive = isActive;
    this.orderIndex = orderIndex;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Crear un nuevo nivel
  static async create({ planetId, title, orderIndex = 1 }) {
    try {
      // Calcular el level_number basado en el orderIndex
      // Si orderIndex es 1, level_number será 1, etc.
      const levelNumber = orderIndex;
      
      const query = `
        INSERT INTO levels (planet_id, level_number, title, order_index, created_at, updated_at) 
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      
      const result = await sequelize.query(query, {
        replacements: [planetId, levelNumber, title, orderIndex],
        type: sequelize.QueryTypes.INSERT
      });
      
      // Obtener el nivel creado usando el ID generado
      const newLevel = await Level.findById(result[0]);
      return newLevel;
    } catch (error) {
      throw error;
    }
  }

  // Buscar nivel por ID
  static async findById(id) {
    try {
      const query = `
        SELECT l.*, p.title as planet_title
        FROM levels l
        LEFT JOIN planets p ON l.planet_id = p.id
        WHERE l.id = ?
      `;
      
      const results = await sequelize.query(query, {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (results.length === 0) {
        return null;
      }

      const level = results[0];
      return {
        id: level.id,
        planetId: level.planet_id,
        planetTitle: level.planet_title,
        levelNumber: level.level_number,
        title: level.title,
        isActive: level.is_active,
        orderIndex: level.order_index,
        createdAt: level.created_at,
        updatedAt: level.updated_at
      };
    } catch (error) {
      throw error;
    }
  }


  // Buscar nivel por planeta y orderIndex
  static async findByPlanetAndOrderIndex(planetId, orderIndex) {
    try {
      const query = 'SELECT * FROM levels WHERE planet_id = ? AND order_index = ? AND is_active = 1';
      const results = await sequelize.query(query, {
        replacements: [planetId, orderIndex],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (results.length === 0) {
        return null;
      }

      const level = results[0];
      return {
        id: level.id,
        planetId: level.planet_id,
        planetTitle: level.planet_title,
        levelNumber: level.level_number,
        title: level.title,
        isActive: level.is_active,
        orderIndex: level.order_index,
        createdAt: level.created_at,
        updatedAt: level.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los niveles de un planeta
  static async findByPlanet(planetId, includeInactive = false) {
    try {
      let query = `
        SELECT l.*, p.title as planet_title,
               COUNT(e.id) as exercises_count
        FROM levels l
        LEFT JOIN planets p ON l.planet_id = p.id
        LEFT JOIN exercises e ON l.id = e.level_id AND e.is_active = 1
        WHERE l.planet_id = ?
      `;
      
      const params = [planetId];
      
      if (!includeInactive) {
        query += ' AND l.is_active = 1';
      }
      
      query += ' GROUP BY l.id ORDER BY l.order_index ASC';
      
      const results = await sequelize.query(query, {
        replacements: params,
        type: sequelize.QueryTypes.SELECT
      });
      
      return results.map(level => ({
        id: level.id,
        planetId: level.planet_id,
        planetTitle: level.planet_title,
        levelNumber: level.level_number,
        title: level.title,
        isActive: level.is_active,
        orderIndex: level.order_index,
        exercisesCount: level.exercises_count,
        createdAt: level.created_at,
        updatedAt: level.updated_at
      }));
    } catch (error) {
      throw error;
    }
  }

  // Obtener nivel con sus ejercicios
  static async findByIdWithExercises(id) {
    try {
      const levelQuery = `
        SELECT l.*, p.title as planet_title
        FROM levels l
        LEFT JOIN planets p ON l.planet_id = p.id
        WHERE l.id = ?
      `;
      
      const levelResults = await sequelize.query(levelQuery, {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (levelResults.length === 0) {
        return null;
      }

      const level = levelResults[0];
      
      // Obtener ejercicios del nivel
      const exercisesQuery = `
        SELECT e.*
        FROM exercises e
        WHERE e.level_id = ? AND e.is_active = 1
        ORDER BY e.created_at ASC
      `;
      
      const exercisesResults = await sequelize.query(exercisesQuery, {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      });
      
      return {
        id: level.id,
        planetId: level.planet_id,
        planetTitle: level.planet_title,
        levelNumber: level.level_number,
        title: level.title,
        isActive: level.is_active,
        orderIndex: level.order_index,
        createdAt: level.created_at,
        updatedAt: level.updated_at,
        exercises: exercisesResults.map(exercise => ({
          id: exercise.id,
          exerciseId: exercise.exercise_id,
          type: exercise.type,
          statement: exercise.statement,
          solution: exercise.solution,
          tolerance: exercise.tolerance,
          hints: exercise.hints,
          evaluationCriteria: exercise.evaluation_criteria,
          assets: exercise.assets,
          isActive: exercise.is_active,
          orderIndex: exercise.order_index,
          createdAt: exercise.created_at,
          updatedAt: exercise.updated_at
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los niveles
  static async findAll(includeInactive = false) {
    try {
      let query = `
        SELECT l.*, p.title as planet_title,
               COUNT(e.id) as exercises_count
        FROM levels l
        LEFT JOIN planets p ON l.planet_id = p.id
        LEFT JOIN exercises e ON l.id = e.level_id AND e.is_active = 1
      `;
      
      if (!includeInactive) {
        query += ' WHERE l.is_active = 1';
      }
      
      query += ' GROUP BY l.id ORDER BY l.order_index ASC';
      
      const results = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT
      });
      
      return results.map(level => ({
        id: level.id,
        planetId: level.planet_id,
        planetTitle: level.planet_title,
        levelNumber: level.level_number,
        title: level.title,
        isActive: level.is_active,
        orderIndex: level.order_index,
        exercisesCount: level.exercises_count,
        createdAt: level.created_at,
        updatedAt: level.updated_at
      }));
    } catch (error) {
      throw error;
    }
  }

  // Actualizar nivel
  async update({ title, orderIndex, isActive }) {
    try {
      const query = `
        UPDATE levels 
        SET title = ?, order_index = ?, is_active = ?
        WHERE id = ?
      `;
      
      await sequelize.query(query, {
        replacements: [title, orderIndex, isActive, this.id],
        type: sequelize.QueryTypes.UPDATE
      });
      
      // Actualizar propiedades del objeto
      this.title = title;
      this.orderIndex = orderIndex;
      this.isActive = isActive;
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar nivel (soft delete)
  async delete() {
    try {
      const query = 'UPDATE levels SET is_active = 0 WHERE id = ?';
      await sequelize.query(query, {
        replacements: [this.id],
        type: sequelize.QueryTypes.UPDATE
      });
      this.isActive = false;
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar nivel permanentemente
  async deletePermanently() {
    try {
      const query = 'DELETE FROM levels WHERE id = ?';
      await sequelize.query(query, {
        replacements: [this.id],
        type: sequelize.QueryTypes.DELETE
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Reordenar niveles dentro de un planeta
  static async reorder(levelOrders) {
    try {
      const transaction = await sequelize.transaction();
      
      try {
        for (const { id, orderIndex } of levelOrders) {
          await sequelize.query(
            'UPDATE levels SET order_index = ? WHERE id = ?',
            {
              replacements: [orderIndex, id],
              type: sequelize.QueryTypes.UPDATE,
              transaction
            }
          );
        }
        
        await transaction.commit();
        return true;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  // Contar total de niveles
  static async count(includeInactive = false) {
    try {
      let query = 'SELECT COUNT(*) as total FROM levels';
      const params = [];
      
      if (!includeInactive) {
        query += ' WHERE is_active = 1';
      }
      
      const results = await sequelize.query(query, {
        replacements: params,
        type: sequelize.QueryTypes.SELECT
      });
      return results[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas del nivel
  async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT e.id) as total_exercises,
          COUNT(DISTINCT sp.user_id) as students_started,
          COUNT(DISTINCT CASE WHEN sp.is_completed = 1 THEN sp.user_id END) as students_completed,
          AVG(sp.completion_percentage) as avg_completion,
          AVG(sp.score) as avg_score
        FROM levels l
        LEFT JOIN exercises e ON l.id = e.level_id AND e.is_active = 1
        LEFT JOIN student_progress sp ON l.id = sp.level_id
        WHERE l.id = ?
      `;
      
      const results = await sequelize.query(query, {
        replacements: [this.id],
        type: sequelize.QueryTypes.SELECT
      });
      return results[0];
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener datos del nivel
  toObject() {
    return {
      id: this.id,
      planetId: this.planetId,
      title: this.title,
      isActive: this.isActive,
      orderIndex: this.orderIndex,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Level;
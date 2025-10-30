const { sequelize } = require('../config/database');

class Planet {
  constructor(id, title, description, orderIndex, isActive, createdBy, createdAt, updatedAt) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.orderIndex = orderIndex;
    this.isActive = isActive;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Crear un nuevo planeta
  static async create({ title, description = null, orderIndex = 0, createdBy }) {
    try {
      // Generar un planet_id único
      const planetId = `planet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const query = `
        INSERT INTO planets (planet_id, title, description, order_index, is_active, created_at, updated_at) 
        VALUES (?, ?, ?, ?, 1, ?, ?)
      `;
      
      const result = await sequelize.query(query, {
        replacements: [planetId, title, description || null, orderIndex, now, now],
        type: sequelize.QueryTypes.INSERT
      });
      
      // Obtener el planeta creado
      const newPlanet = await Planet.findById(result[0]);
      return newPlanet;
    } catch (error) {
      throw error;
    }
  }

  // Buscar planeta por ID
  static async findById(id) {
    try {
      const query = `
        SELECT p.*
        FROM planets p
        WHERE p.id = ?
      `;
      
      const results = await sequelize.query(query, {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (results.length === 0) {
        return null;
      }

      const planet = results[0];
      return new Planet(
        planet.id,
        planet.title,
        planet.description,
        planet.order_index,
        planet.is_active,
        null,
        planet.created_at,
        planet.updated_at
      );
    } catch (error) {
      throw error;
    }
  }

  // Buscar planeta por orden
  static async findByOrderIndex(orderIndex) {
    try {
      const query = `
        SELECT p.*
        FROM planets p
        WHERE p.order_index = ? AND p.is_active = 1
      `;
      
      const results = await sequelize.query(query, {
        replacements: [orderIndex],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (results.length === 0) {
        return null;
      }

      const planet = results[0];
      return new Planet(
        planet.id,
        planet.title,
        planet.description,
        planet.order_index,
        planet.is_active,
        null,
        planet.created_at,
        planet.updated_at
      );
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los planetas
  static async findAll(includeInactive = false) {
    try {
      let query = `
        SELECT p.*, 
               COUNT(l.id) as levels_count
        FROM planets p
        LEFT JOIN levels l ON p.id = l.planet_id AND l.is_active = 1
      `;
      
      if (!includeInactive) {
        query += ' WHERE p.is_active = 1';
      }
      query += ' GROUP BY p.id ORDER BY p.order_index ASC, p.created_at ASC';
      
      const results = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT
      });
      
      return results.map(planet => {
        const planetData = {
          id: planet.id,
          title: planet.title,
          description: planet.description,
          order_index: planet.order_index,
          is_active: planet.is_active,
          levelsCount: planet.levels_count,
          created_at: planet.created_at,
          updated_at: planet.updated_at
        };
        
        // Agregar campos opcionales si existen
        if (planet.planet_id) planetData.planetId = planet.planet_id;
        if (planet.icon) planetData.icon = planet.icon;
        if (planet.color) planetData.color = planet.color;
        if (planet.total_levels) planetData.totalLevels = planet.total_levels;
        if (planet.estimated_time) planetData.estimatedTime = planet.estimated_time;
        
        return planetData;
      });
    } catch (error) {
      throw error;
    }
  }

  // Obtener planeta con sus niveles
  static async findByIdWithLevels(id) {
    try {
      const planetQuery = `
        SELECT p.*
        FROM planets p
        WHERE p.id = ?
      `;
      
      const planetResults = await sequelize.query(planetQuery, {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (planetResults.length === 0) {
        return null;
      }

      const planet = planetResults[0];
      
      // Obtener niveles del planeta usando id numérico
      const levelsQuery = `
        SELECT l.*, 
               COUNT(e.id) as exercises_count
        FROM levels l
        LEFT JOIN exercises e ON l.id = e.level_id AND e.is_active = 1
        WHERE l.planet_id = ?
        GROUP BY l.id
        ORDER BY l.order_index ASC
      `;
      
      const levelsResults = await sequelize.query(levelsQuery, {
        replacements: [id], // Usar id numérico directamente
        type: sequelize.QueryTypes.SELECT
      });
      
      return {
        id: planet.id,
        title: planet.title,
        description: planet.description,
        order_index: planet.order_index,
        is_active: planet.is_active,
        createdBy: planet.created_by || null,
        creatorName: null,
        created_at: planet.created_at,
        updated_at: planet.updated_at,
        levels: levelsResults.map(level => ({
          id: level.id,
          title: level.title,
          is_active: level.is_active,
          order_index: level.order_index,
          exercises_count: level.exercises_count,
          created_at: level.created_at,
          updated_at: level.updated_at
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  // Actualizar planeta
  async update({ title, description = null, orderIndex, isActive }) {
    try {
      const query = `
        UPDATE planets 
        SET title = ?, description = ?, order_index = ?, is_active = ?
        WHERE id = ?
      `;
      
      await sequelize.query(query, {
        replacements: [title, description || null, orderIndex, isActive, this.id],
        type: sequelize.QueryTypes.UPDATE
      });
      
      // Actualizar propiedades del objeto
      this.title = title;
      this.description = description;
      this.orderIndex = orderIndex;
      this.isActive = isActive;
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar planeta (soft delete)
  async delete() {
    try {
      const query = 'UPDATE planets SET is_active = 0 WHERE id = ?';
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

  // Eliminar planeta permanentemente
  async deletePermanently() {
    try {
      const query = 'DELETE FROM planets WHERE id = ?';
      await sequelize.query(query, {
        replacements: [this.id],
        type: sequelize.QueryTypes.DELETE
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Reordenar planetas
  static async reorder(planetOrders) {
    try {
      const transaction = await sequelize.transaction();
      
      try {
        for (const { id, orderIndex } of planetOrders) {
          await sequelize.query(
            'UPDATE planets SET order_index = ? WHERE id = ?',
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

  // Contar total de planetas
  static async count(includeInactive = false) {
    try {
      let query = 'SELECT COUNT(*) as total FROM planets';
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

  // Obtener estadísticas del planeta
  async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT l.id) as total_levels,
          COUNT(DISTINCT e.id) as total_exercises,
          COUNT(DISTINCT sp.user_id) as students_started,
          COUNT(DISTINCT CASE WHEN sp.is_completed = 1 THEN sp.user_id END) as students_completed
        FROM planets p
        LEFT JOIN levels l ON p.id = l.planet_id AND l.is_active = 1
        LEFT JOIN exercises e ON l.id = e.level_id AND e.is_active = 1
        LEFT JOIN student_progress sp ON l.id = sp.level_id
        WHERE p.id = ?
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

  // Método para obtener datos del planeta
  toObject() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      orderIndex: this.orderIndex,
      isActive: this.isActive,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Planet;

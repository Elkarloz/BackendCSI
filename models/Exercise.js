const { sequelize } = require('../config/database');

class Exercise {
  constructor(id, levelId, question, type, difficulty, points, timeLimit, optionA, optionB, optionC, optionD, correctAnswer, explanation, imageUrl, isActive, createdAt, updatedAt) {
    this.id = id;
    this.levelId = levelId;
    this.question = question;
    this.type = type;
    this.difficulty = difficulty;
    this.points = points;
    this.timeLimit = timeLimit;
    this.optionA = optionA;
    this.optionB = optionB;
    this.optionC = optionC;
    this.optionD = optionD;
    this.correctAnswer = correctAnswer;
    this.explanation = explanation;
    this.imageUrl = imageUrl;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Helper method to safely parse JSON fields
  static parseJsonField(field, defaultValue = '[]') {
    if (!field) return defaultValue === '[]' ? [] : {};
    
    // If it's already an object or array, return it as is
    if (typeof field === 'object') {
      return field;
    }
    
    // If it's a string, try to parse it
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (error) {
        // If it's not valid JSON, try to fix common issues
        try {
          // Replace single quotes with double quotes for JSON compatibility
          let fixedField = field.replace(/'/g, '"');
          return JSON.parse(fixedField);
        } catch (secondError) {
          console.warn('Failed to parse JSON field:', field, 'Error:', secondError.message);
          return defaultValue === '[]' ? [] : {};
        }
      }
    }
    
    // Fallback to default value
    return defaultValue === '[]' ? [] : {};
  }

  // Crear un nuevo ejercicio
  static async create({ levelId, question, type, difficulty = 'easy', points = 10, timeLimit = 0, optionA, optionB, optionC, optionD, correctAnswer, explanation, imageUrl = null }) {
    try {
      const query = `
        INSERT INTO exercises (level_id, question, type, difficulty, points, time_limit, option_a, option_b, option_c, option_d, correct_answer, explanation, image_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await sequelize.query(query, {
        replacements: [
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
          imageUrl
        ],
        type: sequelize.QueryTypes.INSERT
      });
      
      // Obtener el ejercicio creado
      const newExercise = await Exercise.findById(result[0]);
      return newExercise;
    } catch (error) {
      throw error;
    }
  }

  // Buscar ejercicio por ID
  static async findById(id) {
    try {
      const query = `
        SELECT e.*, l.title as level_title, l.order_index as level_number, p.title as planet_title
        FROM exercises e
        LEFT JOIN levels l ON e.level_id = l.id
        LEFT JOIN planets p ON l.planet_id = p.id
        WHERE e.id = ?
      `;
      
      const results = await sequelize.query(query, {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (results.length === 0) {
        return null;
      }

      const exercise = results[0];
      return new Exercise(
        exercise.id,
        exercise.level_id,
        exercise.question,
        exercise.type,
        exercise.difficulty,
        exercise.points,
        exercise.time_limit,
        exercise.option_a,
        exercise.option_b,
        exercise.option_c,
        exercise.option_d,
        exercise.correct_answer,
        exercise.explanation,
        exercise.image_url,
        exercise.is_active,
        exercise.created_at,
        exercise.updated_at
      );
    } catch (error) {
      throw error;
    }
  }


  // Obtener todos los ejercicios de un nivel
  static async findByLevel(levelId, includeInactive = false) {
    try {
      let query = `
        SELECT e.*, l.title as level_title, l.order_index as level_number, p.title as planet_title
        FROM exercises e
        LEFT JOIN levels l ON e.level_id = l.id
        LEFT JOIN planets p ON l.planet_id = p.id
        WHERE e.level_id = ?
      `;
      
      const params = [levelId];
      
      if (!includeInactive) {
        query += ' AND e.is_active = 1';
      }
      
      query += ' ORDER BY e.created_at ASC';
      
      const results = await sequelize.query(query, {
        replacements: params,
        type: sequelize.QueryTypes.SELECT
      });
      
      return results.map(exercise => ({
        id: exercise.id,
        levelId: exercise.level_id,
        levelTitle: exercise.level_title,
        levelNumber: exercise.level_number,
        planetTitle: exercise.planet_title,
        question: exercise.question,
        type: exercise.type,
        difficulty: exercise.difficulty,
        points: exercise.points,
        timeLimit: exercise.time_limit,
        optionA: exercise.option_a,
        optionB: exercise.option_b,
        optionC: exercise.option_c,
        optionD: exercise.option_d,
        correctAnswer: exercise.correct_answer,
        explanation: exercise.explanation,
        imageUrl: exercise.image_url,
        isActive: exercise.is_active,
        createdAt: exercise.created_at,
        updatedAt: exercise.updated_at
      }));
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los ejercicios
  static async findAll(includeInactive = false, filters = {}) {
    try {
      let query = `
        SELECT e.*, l.title as level_title, l.order_index as level_number, p.title as planet_title
        FROM exercises e
        LEFT JOIN levels l ON e.level_id = l.id
        LEFT JOIN planets p ON l.planet_id = p.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (!includeInactive) {
        query += ' AND e.is_active = 1';
      }
      
      if (filters.type) {
        query += ' AND e.type = ?';
        params.push(filters.type);
      }
      
      if (filters.levelId) {
        query += ' AND e.level_id = ?';
        params.push(filters.levelId);
      }
      
      if (filters.planetId) {
        query += ' AND l.planet_id = ?';
        params.push(filters.planetId);
      }
      
      query += ' ORDER BY l.order_index ASC';
      
      const results = await sequelize.query(query, {
        replacements: params,
        type: sequelize.QueryTypes.SELECT
      });
      
      return results.map(exercise => ({
        id: exercise.id,
        levelId: exercise.level_id,
        levelTitle: exercise.level_title,
        levelNumber: exercise.level_number,
        planetTitle: exercise.planet_title,
        question: exercise.question,
        type: exercise.type,
        difficulty: exercise.difficulty,
        points: exercise.points,
        timeLimit: exercise.time_limit,
        optionA: exercise.option_a,
        optionB: exercise.option_b,
        optionC: exercise.option_c,
        optionD: exercise.option_d,
        correctAnswer: exercise.correct_answer,
        explanation: exercise.explanation,
        imageUrl: exercise.image_url,
        isActive: exercise.is_active,
        createdAt: exercise.created_at,
        updatedAt: exercise.updated_at
      }));
    } catch (error) {
      throw error;
    }
  }

  // Actualizar ejercicio
  async update({ question, type, difficulty, points, timeLimit, optionA, optionB, optionC, optionD, correctAnswer, explanation, imageUrl, isActive }) {
    try {
      const query = `
        UPDATE exercises 
        SET question = ?, type = ?, difficulty = ?, points = ?, time_limit = ?, 
            option_a = ?, option_b = ?, option_c = ?, option_d = ?, 
            correct_answer = ?, explanation = ?, image_url = ?, is_active = ?
        WHERE id = ?
      `;
      
      await sequelize.query(query, {
        replacements: [
          question || this.question, 
          type || this.type, 
          difficulty || this.difficulty, 
          points !== undefined ? points : this.points, 
          timeLimit !== undefined ? timeLimit : this.timeLimit, 
          optionA !== undefined ? optionA : this.optionA, 
          optionB !== undefined ? optionB : this.optionB, 
          optionC !== undefined ? optionC : this.optionC, 
          optionD !== undefined ? optionD : this.optionD, 
          correctAnswer || this.correctAnswer, 
          explanation !== undefined ? explanation : this.explanation, 
          imageUrl !== undefined ? imageUrl : this.imageUrl,
          isActive !== undefined ? isActive : this.isActive, 
          this.id
        ],
        type: sequelize.QueryTypes.UPDATE
      });
      
      // Actualizar propiedades del objeto
      this.question = question || this.question;
      this.type = type || this.type;
      this.difficulty = difficulty || this.difficulty;
      this.points = points !== undefined ? points : this.points;
      this.timeLimit = timeLimit !== undefined ? timeLimit : this.timeLimit;
      this.optionA = optionA !== undefined ? optionA : this.optionA;
      this.optionB = optionB !== undefined ? optionB : this.optionB;
      this.optionC = optionC !== undefined ? optionC : this.optionC;
      this.optionD = optionD !== undefined ? optionD : this.optionD;
      this.correctAnswer = correctAnswer || this.correctAnswer;
      this.explanation = explanation !== undefined ? explanation : this.explanation;
      this.imageUrl = imageUrl !== undefined ? imageUrl : this.imageUrl;
      this.isActive = isActive !== undefined ? isActive : this.isActive;
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar ejercicio (soft delete)
  async delete() {
    try {
      const query = 'UPDATE exercises SET is_active = 0 WHERE id = ?';
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

  // Eliminar ejercicio permanentemente
  async deletePermanently() {
    try {
      const query = 'DELETE FROM exercises WHERE id = ?';
      await sequelize.query(query, {
        replacements: [this.id],
        type: sequelize.QueryTypes.DELETE
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Reordenar ejercicios dentro de un nivel
  static async reorder(exerciseOrders) {
    try {
      const transaction = await sequelize.transaction();
      
      try {
        for (const { id, orderIndex } of exerciseOrders) {
          await sequelize.query(
            'UPDATE exercises SET order_index = ? WHERE id = ?',
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

  // Contar total de ejercicios
  static async count(includeInactive = false, filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM exercises e LEFT JOIN levels l ON e.level_id = l.id WHERE 1=1';
      const params = [];
      
      if (!includeInactive) {
        query += ' AND e.is_active = 1';
      }
      
      if (filters.type) {
        query += ' AND e.type = ?';
        params.push(filters.type);
      }
      
      if (filters.levelId) {
        query += ' AND e.level_id = ?';
        params.push(filters.levelId);
      }
      
      if (filters.planetId) {
        query += ' AND l.planet_id = ?';
        params.push(filters.planetId);
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

  // Obtener estadísticas del ejercicio
  async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT ea.id) as total_attempts,
          COUNT(DISTINCT ea.user_id) as unique_students,
          COUNT(DISTINCT CASE WHEN ea.is_correct = 1 THEN ea.id END) as correct_attempts,
          AVG(ea.score) as avg_score,
          AVG(ea.time_taken) as avg_time_taken,
          AVG(ea.hints_used) as avg_hints_used
        FROM exercises e
        LEFT JOIN exercise_attempts ea ON e.id = ea.exercise_id
        WHERE e.id = ?
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

  // Evaluar respuesta del estudiante - siempre comparación de texto con trim
  async evaluateAnswer(userAnswer, timeTaken = 0, hintsUsed = 0) {
    try {
      let isCorrect = false;
      let score = 0;
      let feedback = '';

      // Todos los ejercicios se evalúan como texto con trim
      isCorrect = this.evaluateTextAnswer(userAnswer);

      // Calcular puntuación basada en criterios de evaluación
      if (isCorrect) {
        score = this.calculateScore(timeTaken, hintsUsed);
      }

      // Generar retroalimentación
      feedback = this.generateFeedback(isCorrect, userAnswer);

      return {
        isCorrect,
        score,
        feedback,
        timeTaken,
        hintsUsed
      };
    } catch (error) {
      throw error;
    }
  }

  // Evaluar respuesta de texto - método principal para todos los ejercicios
  evaluateTextAnswer(userAnswer) {
    try {
      // Para ejercicios de imagen con opciones múltiples, comparar directamente
      if (this.type === 'image_multiple_choice') {
        return userAnswer.toString() === this.solution;
      }
      
      // Para otros tipos, comparación de texto con trim y case insensitive
      return userAnswer.toString().trim().toLowerCase() === this.solution.trim().toLowerCase();
    } catch (error) {
      return false;
    }
  }

  // Métodos legacy (mantenidos para compatibilidad pero no se usan)
  evaluateNumericAnswer(userAnswer) {
    return this.evaluateTextAnswer(userAnswer);
  }

  evaluateSymbolicAnswer(userAnswer) {
    return this.evaluateTextAnswer(userAnswer);
  }

  evaluateMultipleChoiceAnswer(userAnswer) {
    return this.evaluateTextAnswer(userAnswer);
  }

  evaluateGraphAnswer(userAnswer) {
    return this.evaluateTextAnswer(userAnswer);
  }

  // Calcular puntuación
  calculateScore(timeTaken, hintsUsed) {
    const baseScore = this.evaluationCriteria.score || 100;
    const timeBonus = this.evaluationCriteria.timeBonus || 0;
    const hintsPenalty = this.evaluationCriteria.hintsPenalty || 10;
    
    let score = baseScore;
    
    // Penalización por pistas usadas
    score -= hintsUsed * hintsPenalty;
    
    // Bonus por tiempo (si se especifica)
    if (timeBonus > 0 && timeTaken < this.evaluationCriteria.maxTime) {
      score += timeBonus;
    }
    
    return Math.max(0, score);
  }

  // Generar retroalimentación
  generateFeedback(isCorrect, userAnswer) {
    if (isCorrect) {
      return '¡Correcto! Excelente trabajo.';
    } else {
      return `Incorrecto. La respuesta correcta es: ${this.solution}`;
    }
  }

  // Método para obtener datos del ejercicio
  toObject() {
    return {
      id: this.id,
      levelId: this.levelId,
      question: this.question,
      type: this.type,
      difficulty: this.difficulty,
      points: this.points,
      timeLimit: this.timeLimit,
      optionA: this.optionA,
      optionB: this.optionB,
      optionC: this.optionC,
      optionD: this.optionD,
      correctAnswer: this.correctAnswer,
      explanation: this.explanation,
      imageUrl: this.imageUrl,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Exercise;
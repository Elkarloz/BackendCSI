const { sequelize } = require('../config/database');

class RespuestaEjercicio {
  constructor(id, idUsuario, idNivel, idEjercicio, respuesta, esCorrecta, puntuacion, tiempoGastado, intentos, fechaRespuesta, fechaCreacion, fechaActualizacion) {
    this.id = id;
    this.idUsuario = idUsuario;
    this.idNivel = idNivel;
    this.idEjercicio = idEjercicio;
    this.respuesta = respuesta;
    this.esCorrecta = esCorrecta;
    this.puntuacion = puntuacion;
    this.tiempoGastado = tiempoGastado;
    this.intentos = intentos;
    this.fechaRespuesta = fechaRespuesta;
    this.fechaCreacion = fechaCreacion;
    this.fechaActualizacion = fechaActualizacion;
  }

  // Verificar si un usuario ya respondió un ejercicio
  static async hasUserAnswered(idUsuario, idEjercicio) {
    try {
      const query = `
        SELECT id, es_correcta, puntuacion, fecha_respuesta
        FROM respuestas_ejercicios 
        WHERE id_usuario = ? AND id_ejercicio = ?
      `;
      
      const results = await sequelize.query(query, {
        replacements: [idUsuario, idEjercicio],
        type: sequelize.QueryTypes.SELECT
      });
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Guardar respuesta de ejercicio
  static async saveResponse({ idUsuario, idNivel, idEjercicio, respuesta, esCorrecta, puntuacion = 0, tiempoGastado = 0 }) {
    try {
      // Verificar si ya existe una respuesta
      const existingResponse = await RespuestaEjercicio.hasUserAnswered(idUsuario, idEjercicio);
      
      if (existingResponse) {
        throw new Error('El usuario ya respondió este ejercicio');
      }

      const query = `
        INSERT INTO respuestas_ejercicios 
        (id_usuario, id_nivel, id_ejercicio, respuesta, es_correcta, puntuacion, tiempo_gastado, intentos)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `;
      
      const result = await sequelize.query(query, {
        replacements: [idUsuario, idNivel, idEjercicio, respuesta, esCorrecta, puntuacion, tiempoGastado],
        type: sequelize.QueryTypes.INSERT
      });
      
      return await RespuestaEjercicio.findById(result[0]);
    } catch (error) {
      throw error;
    }
  }

  // Obtener respuesta por ID
  static async findById(id) {
    try {
      const query = `
        SELECT * FROM respuestas_ejercicios WHERE id = ?
      `;
      
      const results = await sequelize.query(query, {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (results.length === 0) {
        return null;
      }

      const response = results[0];
      return new RespuestaEjercicio(
        response.id,
        response.id_usuario,
        response.id_nivel,
        response.id_ejercicio,
        response.respuesta,
        response.es_correcta,
        response.puntuacion,
        response.tiempo_gastado,
        response.intentos,
        response.fecha_respuesta,
        response.fecha_creacion,
        response.fecha_actualizacion
      );
    } catch (error) {
      throw error;
    }
  }

  // Obtener respuestas de un usuario en un nivel
  static async getByUserAndLevel(idUsuario, idNivel) {
    try {
      const query = `
        SELECT re.*, e.pregunta as titulo_ejercicio, e.tipo as tipo_ejercicio
        FROM respuestas_ejercicios re
        JOIN ejercicios e ON re.id_ejercicio = e.id
        WHERE re.id_usuario = ? AND re.id_nivel = ?
        ORDER BY re.fecha_respuesta ASC
      `;
      
      const results = await sequelize.query(query, {
        replacements: [idUsuario, idNivel],
        type: sequelize.QueryTypes.SELECT
      });
      
      return results.map(response => ({
        id: response.id,
        idUsuario: response.id_usuario,
        idNivel: response.id_nivel,
        idEjercicio: response.id_ejercicio,
        tituloEjercicio: response.titulo_ejercicio,
        tipoEjercicio: response.tipo_ejercicio,
        respuesta: response.respuesta,
        esCorrecta: response.es_correcta,
        puntuacion: response.puntuacion,
        tiempoGastado: response.tiempo_gastado,
        intentos: response.intentos,
        fechaRespuesta: response.fecha_respuesta,
        fechaCreacion: response.fecha_creacion,
        fechaActualizacion: response.fecha_actualizacion
      }));
    } catch (error) {
      throw error;
    }
  }

  // Obtener todas las respuestas de un usuario
  static async getByUser(idUsuario) {
    try {
      const query = `
        SELECT re.*, e.pregunta as titulo_ejercicio, e.tipo as tipo_ejercicio, n.titulo as titulo_nivel, p.titulo as titulo_planeta
        FROM respuestas_ejercicios re
        JOIN ejercicios e ON re.id_ejercicio = e.id
        JOIN niveles n ON re.id_nivel = n.id
        JOIN planetas p ON n.id_planeta = p.id
        WHERE re.id_usuario = ?
        ORDER BY p.orden, n.orden, re.fecha_respuesta ASC
      `;
      
      const results = await sequelize.query(query, {
        replacements: [idUsuario],
        type: sequelize.QueryTypes.SELECT
      });
      
      return results.map(response => ({
        id: response.id,
        idUsuario: response.id_usuario,
        idNivel: response.id_nivel,
        idEjercicio: response.id_ejercicio,
        tituloEjercicio: response.titulo_ejercicio,
        tituloNivel: response.titulo_nivel,
        tituloPlaneta: response.titulo_planeta,
        tipoEjercicio: response.tipo_ejercicio,
        respuesta: response.respuesta,
        esCorrecta: response.es_correcta,
        puntuacion: response.puntuacion,
        tiempoGastado: response.tiempo_gastado,
        intentos: response.intentos,
        fechaRespuesta: response.fecha_respuesta,
        fechaCreacion: response.fecha_creacion,
        fechaActualizacion: response.fecha_actualizacion
      }));
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas de respuestas de un usuario
  static async getUserResponseStats(idUsuario) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_respuestas,
          COUNT(CASE WHEN es_correcta = 1 THEN 1 END) as respuestas_correctas,
          COUNT(CASE WHEN es_correcta = 0 THEN 1 END) as respuestas_incorrectas,
          AVG(puntuacion) as puntuacion_promedio,
          SUM(tiempo_gastado) as tiempo_total_gastado,
          COUNT(DISTINCT id_nivel) as niveles_con_respuestas,
          COUNT(DISTINCT id_ejercicio) as ejercicios_respondidos
        FROM respuestas_ejercicios 
        WHERE id_usuario = ?
      `;
      
      const results = await sequelize.query(query, {
        replacements: [idUsuario],
        type: sequelize.QueryTypes.SELECT
      });
      
      return results[0] || {
        total_respuestas: 0,
        respuestas_correctas: 0,
        respuestas_incorrectas: 0,
        puntuacion_promedio: 0,
        tiempo_total_gastado: 0,
        niveles_con_respuestas: 0,
        ejercicios_respondidos: 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Verificar si un ejercicio puede ser respondido (no ha sido respondido antes)
  static async canUserAnswer(idUsuario, idEjercicio) {
    try {
      const existingResponse = await RespuestaEjercicio.hasUserAnswered(idUsuario, idEjercicio);
      return !existingResponse;
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener datos de la respuesta
  toObject() {
    return {
      id: this.id,
      idUsuario: this.idUsuario,
      idNivel: this.idNivel,
      idEjercicio: this.idEjercicio,
      respuesta: this.respuesta,
      esCorrecta: this.esCorrecta,
      puntuacion: this.puntuacion,
      tiempoGastado: this.tiempoGastado,
      intentos: this.intentos,
      fechaRespuesta: this.fechaRespuesta,
      fechaCreacion: this.fechaCreacion,
      fechaActualizacion: this.fechaActualizacion
    };
  }
}

module.exports = RespuestaEjercicio;

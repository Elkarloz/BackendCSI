const { sequelize } = require('../config/database');

class Content {
  constructor(id, title, description, resourceType, resourceUrl, createdBy, createdAt, updatedAt) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.resourceType = resourceType;
    this.resourceUrl = resourceUrl;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Crear un nuevo contenido
  static async create({ title, description, resourceType, resourceUrl, createdBy }) {
    try {
      console.log('📄 Content.create() - Datos recibidos:', { title, description, resourceType, resourceUrl, createdBy });
      
      const query = `
        INSERT INTO contents (title, description, resource_type, resource_url, created_by) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      console.log('📄 Content.create() - Ejecutando query:', query);
      console.log('📄 Content.create() - Con replacements:', [title, description, resourceType, resourceUrl, createdBy]);
      
      const [result] = await sequelize.query(query, {
        replacements: [title, description, resourceType, resourceUrl, createdBy],
        type: sequelize.QueryTypes.INSERT
      });
      
      console.log('📄 Content.create() - Resultado del INSERT:', result);
      console.log('📄 Content.create() - Tipo de result:', typeof result);
      console.log('📄 Content.create() - result[0]:', result[0]);
      
      // Obtener el ID del contenido creado
      // En Sequelize, el resultado del INSERT es directamente el ID
      const contentId = result;
      console.log('📄 Content.create() - ID del contenido creado:', contentId);
      
      // Obtener el contenido creado
      const newContent = await Content.findById(contentId);
      console.log('📄 Content.create() - Contenido obtenido:', newContent);
      
      return newContent;
    } catch (error) {
      console.error('📄 Content.create() - Error:', error);
      throw error;
    }
  }

  // Buscar contenido por ID
  static async findById(id) {
    try {
      console.log('📄 Content.findById() - Buscando contenido con ID:', id);
      
      const query = `
        SELECT c.*, u.name as creator_name
        FROM contents c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.id = ?
      `;
      
      console.log('📄 Content.findById() - Query:', query);
      console.log('📄 Content.findById() - Replacements:', [id]);
      
      const results = await sequelize.query(query, {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      });
      
      console.log('📄 Content.findById() - Resultados:', results);
      
      if (results.length === 0) {
        return null;
      }

      const content = results[0];
      return new Content(
        content.id,
        content.title,
        content.description,
        content.resource_type,
        content.resource_url,
        content.created_by,
        content.created_at,
        content.updated_at
      );
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los contenidos
  static async findAll(limit = null, offset = 0) {
    try {
      let query = `
        SELECT c.*, u.name as creator_name
        FROM contents c
        LEFT JOIN users u ON c.created_by = u.id
        ORDER BY c.created_at DESC
      `;
      
      if (limit) {
        query += ' LIMIT ? OFFSET ?';
      }
      
      const results = await sequelize.query(query, {
        replacements: limit ? [limit, offset] : [],
        type: sequelize.QueryTypes.SELECT
      });
      
      return results.map(content => ({
        id: content.id,
        title: content.title,
        description: content.description,
        resourceType: content.resource_type,
        resourceUrl: content.resource_url,
        createdBy: content.created_by,
        creatorName: content.creator_name,
        createdAt: content.created_at,
        updatedAt: content.updated_at
      }));
    } catch (error) {
      throw error;
    }
  }

  // Buscar contenidos por tipo
  static async findByType(resourceType) {
    try {
      const query = `
        SELECT c.*, u.name as creator_name
        FROM contents c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.resource_type = ?
        ORDER BY c.created_at DESC
      `;
      
      const results = await sequelize.query(query, {
        replacements: [resourceType],
        type: sequelize.QueryTypes.SELECT
      });
      
      return results.map(content => ({
        id: content.id,
        title: content.title,
        description: content.description,
        resourceType: content.resource_type,
        resourceUrl: content.resource_url,
        createdBy: content.created_by,
        creatorName: content.creator_name,
        createdAt: content.created_at,
        updatedAt: content.updated_at
      }));
    } catch (error) {
      throw error;
    }
  }

  // Actualizar contenido
  async update({ title, description, resourceType, resourceUrl }) {
    try {
      const query = `
        UPDATE contents 
        SET title = ?, description = ?, resource_type = ?, resource_url = ?
        WHERE id = ?
      `;
      
      await sequelize.query(query, {
        replacements: [title, description, resourceType, resourceUrl, this.id],
        type: sequelize.QueryTypes.UPDATE
      });
      
      // Actualizar propiedades del objeto
      this.title = title;
      this.description = description;
      this.resourceType = resourceType;
      this.resourceUrl = resourceUrl;
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar contenido
  async delete() {
    try {
      const query = 'DELETE FROM contents WHERE id = ?';
      await sequelize.query(query, {
        replacements: [this.id],
        type: sequelize.QueryTypes.DELETE
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Contar total de contenidos
  static async count() {
    try {
      const query = 'SELECT COUNT(*) as total FROM contents';
      const results = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT
      });
      return results[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener datos del contenido
  toObject() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      resourceType: this.resourceType,
      resourceUrl: this.resourceUrl,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Content;
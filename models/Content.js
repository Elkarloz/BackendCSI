const { pool } = require('../config/database');

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
      const query = `
        INSERT INTO contents (title, description, resource_type, resource_url, created_by) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const [result] = await pool.execute(query, [title, description, resourceType, resourceUrl, createdBy]);
      
      // Obtener el contenido creado
      const newContent = await Content.findById(result.insertId);
      return newContent;
    } catch (error) {
      throw error;
    }
  }

  // Buscar contenido por ID
  static async findById(id) {
    try {
      const query = `
        SELECT c.*, u.name as creator_name
        FROM contents c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.id = ?
      `;
      
      const [rows] = await pool.execute(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      const content = rows[0];
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
      
      const params = [];
      if (limit) {
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
      }
      
      const [rows] = await pool.execute(query, params);
      
      return rows.map(content => ({
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
      
      const [rows] = await pool.execute(query, [resourceType]);
      
      return rows.map(content => ({
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
      
      await pool.execute(query, [title, description, resourceType, resourceUrl, this.id]);
      
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
      await pool.execute(query, [this.id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Contar total de contenidos
  static async count() {
    try {
      const query = 'SELECT COUNT(*) as total FROM contents';
      const [rows] = await pool.execute(query);
      return rows[0].total;
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
-- Script para crear la base de datos y tabla de usuarios
-- Ejecutar este script en MySQL antes de iniciar la aplicación

-- Crear base de datos (opcional, si no existe)
CREATE DATABASE IF NOT EXISTS dbcsi1 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE dbcsi1;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('estudiante', 'admin') DEFAULT 'estudiante',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para optimizar consultas
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
);

-- Crear tabla de contenidos
CREATE TABLE IF NOT EXISTS contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type ENUM('pdf', 'video') NOT NULL,
    resource_url VARCHAR(500) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Clave foránea
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_resource_type (resource_type),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
);

-- Verificar que las tablas se crearon correctamente
DESCRIBE users;
DESCRIBE contents;

-- Consultas para verificar que las tablas están vacías
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_contents FROM contents;

-- Script para agregar columna role a usuarios existentes (migración)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('estudiante', 'admin') DEFAULT 'estudiante' AFTER name;
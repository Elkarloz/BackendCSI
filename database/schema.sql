-- Esquema de base de datos para el sistema educativo de planetas
-- Sistema de gestión de contenido educativo con planetas, niveles y ejercicios

-- Tabla de usuarios (ya existe, pero la incluimos para referencia)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('estudiante', 'admin') DEFAULT 'estudiante',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de planetas (temas de integrales)
CREATE TABLE IF NOT EXISTS planets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de niveles (5 niveles por planeta)
CREATE TABLE IF NOT EXISTS levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    planet_id INT NOT NULL,
    level_number INT NOT NULL CHECK (level_number BETWEEN 1 AND 5),
    title VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (planet_id) REFERENCES planets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_planet_level (planet_id, level_number)
);

-- Tabla de ejercicios
CREATE TABLE IF NOT EXISTS exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level_id INT NOT NULL,
    question TEXT NOT NULL,
    type ENUM('multiple_choice', 'true_false', 'numeric') DEFAULT 'multiple_choice',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    points INT DEFAULT 10,
    time_limit INT DEFAULT 0, -- en segundos
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer VARCHAR(10),
    explanation TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
);

-- Tabla de progreso del estudiante
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    level_id INT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_exercises INT DEFAULT 0,
    completed_exercises INT DEFAULT 0,
    score DECIMAL(5,2) DEFAULT 0.00,
    time_spent INT DEFAULT 0, -- Tiempo en segundos
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_level (user_id, level_id)
);

-- Tabla de intentos de ejercicios (ELIMINADA - Simplificación del esquema)

-- Tabla de contenido existente (para compatibilidad)
CREATE TABLE IF NOT EXISTS contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(100),
    resource_url VARCHAR(500),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para optimizar consultas
CREATE INDEX idx_planets_order ON planets(order_index);
CREATE INDEX idx_levels_planet ON levels(planet_id);
CREATE INDEX idx_levels_number ON levels(level_number);
CREATE INDEX idx_exercises_level ON exercises(level_id);
CREATE INDEX idx_exercises_type ON exercises(type);
CREATE INDEX idx_progress_user ON student_progress(user_id);
CREATE INDEX idx_progress_level ON student_progress(level_id);
-- Índices de exercise_attempts eliminados (tabla eliminada)

-- Datos de ejemplo para planetas
INSERT INTO planets (title, description, order_index, created_by) VALUES
('Conceptos Básicos', 'Introducción a las integrales definidas, notación y definición fundamental', 1, 1),
('Propiedades', 'Propiedades básicas de las integrales: linealidad, aditividad y signo', 2, 1),
('Métodos de Integración', 'Técnicas de integración: sustitución, por partes, fracciones parciales', 3, 1),
('Aplicaciones', 'Aplicaciones de las integrales: áreas, volúmenes, trabajo y física', 4, 1),
('Evaluación Numérica', 'Métodos numéricos para aproximar integrales: trapecio, Simpson, Romberg', 5, 1);

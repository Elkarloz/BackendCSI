# Backend API - Sistema de Autenticación

API REST desarrollada con Node.js, Express y MySQL para manejo de autenticación de usuarios.

## 🚀 Características

- ✅ Registro de usuarios con validación
- ✅ Login con JWT
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Validación de datos con express-validator
- ✅ Middleware de autenticación
- ✅ Conexión con MySQL usando pool de conexiones
- ✅ Manejo de errores robusto
- ✅ CORS configurado

## 📋 Requisitos

- Node.js (v14 o superior)
- MySQL (v5.7 o superior)
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio e instalar dependencias:**
   ```bash
   cd Backend
   npm install
   ```

2. **Configurar base de datos:**
   - Crear una base de datos MySQL llamada `auth_system`
   - Ejecutar el script `database/schema.sql` en MySQL

3. **Configurar variables de entorno:**
   - Copiar `.env.example` a `.env`
   - Configurar las variables según tu entorno:
   ```env
   DB_HOST=localhost
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   DB_NAME=auth_system
   DB_PORT=3306
   JWT_SECRET=tu_clave_secreta_muy_segura
   JWT_EXPIRES_IN=7d
   PORT=3000
   ```

4. **Iniciar el servidor:**
   ```bash
   # Modo desarrollo
   npm run dev
   
   # Modo producción
   npm start
   ```

## 📚 API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Registrar nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| GET | `/api/auth/profile` | Obtener perfil del usuario | Sí |
| GET | `/api/auth/verify` | Verificar token | Sí |

### Ejemplos de uso

#### Registro de usuario
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "MiPassword123"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@ejemplo.com",
  "password": "MiPassword123"
}
```

#### Obtener perfil (requiere token)
```bash
GET /api/auth/profile
Authorization: Bearer tu_jwt_token_aqui
```

## 📁 Estructura del proyecto

```
Backend/
├── config/
│   └── database.js          # Configuración MySQL
├── controllers/
│   └── authController.js    # Controladores de autenticación
├── middleware/
│   └── auth.js              # Middleware de autenticación JWT
├── models/
│   └── User.js              # Modelo de usuario
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   └── index.js             # Rutas principales
├── database/
│   └── schema.sql           # Script de base de datos
├── .env                     # Variables de entorno
├── .gitignore
├── index.js                 # Servidor principal
├── package.json
└── README.md
```

## 🔐 Seguridad

- Contraseñas encriptadas con bcrypt (12 rounds)
- JWT con expiración configurable
- Validación de datos de entrada
- Headers de seguridad con CORS
- Variables de entorno para datos sensibles

## 🧪 Testing

Para probar la API puedes usar:

- **Postman**: Importa la colección de endpoints
- **curl**: Ver ejemplos en la documentación
- **Thunder Client** (extensión de VS Code)

### Ejemplo con curl:

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"Password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Password123"}'
```

## 🚨 Solución de problemas

### Error de conexión a MySQL
- Verificar que MySQL esté ejecutándose
- Comprobar credenciales en `.env`
- Asegurarse de que la base de datos existe

### Error de token inválido
- Verificar que el token se envíe en el header Authorization
- Formato: `Bearer tu_token_aqui`
- Comprobar que JWT_SECRET coincida

### Puerto ocupado
- Cambiar PORT en `.env`
- Verificar procesos en el puerto: `netstat -ano | findstr :3000`

## 📝 Notas de desarrollo

- El servidor reinicia automáticamente en modo desarrollo
- Los logs incluyen timestamp y método HTTP
- Manejo graceful de SIGTERM y SIGINT
- Validaciones robustas con express-validator

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request
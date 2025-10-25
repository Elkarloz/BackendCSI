const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = '';
    
    // Determinar la carpeta de destino según el tipo de archivo
    if (file.fieldname === 'image') {
      uploadPath = 'uploads/images/';
    } else if (file.fieldname === 'pdf') {
      uploadPath = 'uploads/pdfs/';
    } else {
      uploadPath = 'uploads/';
    }
    
    // Crear la carpeta si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    cb(null, filename);
  }
});

// Filtro de archivos para imágenes
const imageFilter = (req, file, cb) => {
  // Verificar que sea una imagen
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, GIF, etc.)'), false);
  }
};

// Filtro de archivos para PDFs
const pdfFilter = (req, file, cb) => {
  // Verificar que sea un PDF
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false);
  }
};

// Configuración de Multer para imágenes
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 1 // Solo un archivo por vez
  }
});

// Configuración de Multer para PDFs
const uploadPDF = multer({
  storage: storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 1 // Solo un archivo por vez
  }
});

// Middleware para subir imagen de ejercicio
const uploadExerciseImage = uploadImage.single('image');

// Middleware para subir PDF de contenido
const uploadContentPDF = uploadPDF.single('pdf');

// Middleware para manejar errores de Multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Demasiados archivos'
      });
    }
  }
  
  if (error.message.includes('Solo se permiten')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Función para eliminar archivo
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    return false;
  }
};

// Función para obtener la URL del archivo
const getFileUrl = (req, filename, type) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const uploadPath = type === 'image' ? 'uploads/images' : 'uploads/pdfs';
  return `${baseUrl}/${uploadPath}/${filename}`;
};

module.exports = {
  uploadExerciseImage,
  uploadContentPDF,
  handleUploadError,
  deleteFile,
  getFileUrl
};

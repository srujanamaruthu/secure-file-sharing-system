const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure temp upload directory exists
const tempDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Multer Storage Configuration (for temporary files before encryption)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique temp filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File validator for allowed types (Security: MIME-type + extension validation)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|doc|docx|ppt|pptx|zip|jpeg|jpg|png|gif/i;
  
  // Check extension
  const extName = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );

  // Check MIME-type
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];
  
  const mimeTypeMatch = allowedMimeTypes.includes(file.mimetype);

  if (extName && mimeTypeMatch) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Allowed formats: PDF, DOCX, PPT, JPEG, PNG, GIF, ZIP.'
      ),
      false
    );
  }
};

// Configured multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB size limit
  },
});

module.exports = upload;

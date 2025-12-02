import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/submissions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: originalname-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

// File filter - allow common file types for assignments
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf', // PDF
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-powerpoint', // PPT
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'application/vnd.ms-excel', // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'text/plain', // TXT
    'image/jpeg', // JPG
    'image/png', // PNG
    'image/gif', // GIF
    'application/zip', // ZIP
    'application/x-rar-compressed', // RAR
    'video/mp4', // MP4
    'video/mpeg', // MPEG
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}. Allowed types: PDF, DOC, PPT, XLS, TXT, Images, ZIP, RAR, Videos`));
  }
};

// Configure multer upload
export const uploadSubmission = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
}).single('file'); // Field name: 'file'

// Error handling middleware
export const handleUploadError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 100MB',
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next();
};

const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {

  const allowedTypes = [

    'image/jpeg', 'image/png', 'image/gif', 'image/webp',

    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',

    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

const uploadEducation = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

module.exports = uploadEducation;


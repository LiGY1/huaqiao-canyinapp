const { uploadFile } = require('../../config/minio');
const { success, error } = require('../../utils/responseFormatter');

exports.uploadEducationFile = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, '请选择要上传的文件', 400);
    }

    let folder = 'education';
    if (req.file.mimetype.startsWith('image/')) {
      folder = 'education/images';
    } else if (req.file.mimetype.includes('pdf')) {
      folder = 'education/pdfs';
    } else if (req.file.mimetype.includes('presentation') || req.file.mimetype.includes('powerpoint')) {
      folder = 'education/ppts';
    } else if (req.file.mimetype.includes('video')) {
      folder = 'education/videos';
    }

    const fileUrl = await uploadFile(req.file, folder);

    success(res, {
      url: fileUrl,
      fileName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      folder: folder
    }, '文件上传成功');
  } catch (err) {
    console.error('文件上传失败:', err);
    error(res, err.message || '文件上传失败', 500);
  }
};

exports.uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return error(res, '请选择要上传的文件', 400);
    }

    const uploadPromises = req.files.map(file => {
      let folder = 'education';
      if (file.mimetype.startsWith('image/')) {
        folder = 'education/images';
      } else if (file.mimetype.includes('pdf')) {
        folder = 'education/pdfs';
      } else if (file.mimetype.includes('presentation')) {
        folder = 'education/ppts';
      } else if (file.mimetype.includes('video')) {
        folder = 'education/videos';
      }
      return uploadFile(file, folder);
    });

    const fileUrls = await Promise.all(uploadPromises);

    const result = fileUrls.map((url, index) => ({
      url,
      fileName: req.files[index].originalname,
      size: req.files[index].size,
      mimeType: req.files[index].mimetype
    }));

    success(res, result, '文件上传成功');
  } catch (err) {
    console.error('文件上传失败:', err);
    error(res, err.message || '文件上传失败', 500);
  }
};


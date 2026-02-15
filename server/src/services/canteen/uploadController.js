const { uploadFile } = require('../../config/minio');
const { success, error } = require('../../utils/responseFormatter');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, '请选择要上传的图片', 400);
    }

    const imageUrl = await uploadFile(req.file, 'dishes');

    success(res, {
      url: imageUrl,
      fileName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    }, '图片上传成功');
  } catch (err) {
    console.error(err);
    error(res, err.message || '图片上传失败', 500);
  }
};

exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return error(res, '请选择要上传的图片', 400);
    }

    const uploadPromises = req.files.map(file => uploadFile(file, 'dishes'));
    const imageUrls = await Promise.all(uploadPromises);

    const result = imageUrls.map((url, index) => ({
      url,
      fileName: req.files[index].originalname,
      size: req.files[index].size,
      mimeType: req.files[index].mimetype
    }));

    success(res, result, '图片上传成功');
  } catch (err) {
    console.error(err);
    error(res, err.message || '图片上传失败', 500);
  }
};


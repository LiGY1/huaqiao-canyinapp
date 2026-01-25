const chalk = require('chalk');
const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'canteen-images';

const initBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');

      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      };

      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(chalk.green(`[存储] MinIO 存储桶已创建: ${BUCKET_NAME} (公开访问)`));
    } else {
      console.log(chalk.blue(`[存储] MinIO 已连接: ${BUCKET_NAME} @ ${process.env.MINIO_ENDPOINT || 'localhost'}`));
    }
  } catch (err) {
    console.error(chalk.red('[存储] MinIO 初始化失败:'), err.message);
    console.log('警告: MinIO 不可用，文件上传功能将无法使用');
  }
};

const uploadFile = async (file, folder = 'dishes') => {
  try {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const metadata = {
      'Content-Type': file.mimetype
    };

    await minioClient.putObject(
      BUCKET_NAME,
      fileName,
      file.buffer,
      file.size,
      metadata
    );

    const url = `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${fileName}`;
    return url;
  } catch (err) {
    console.error('File upload error:', err);
    throw new Error('文件上传失败');
  }
};

const deleteFile = async (fileName) => {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileName);
    return true;
  } catch (err) {
    console.error('File delete error:', err);
    throw new Error('文件删除失败');
  }
};

const getFileUrl = (fileName) => {
  return `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${fileName}`;
};

module.exports = {
  minioClient,
  BUCKET_NAME,
  initBucket,
  uploadFile,
  deleteFile,
  getFileUrl
};


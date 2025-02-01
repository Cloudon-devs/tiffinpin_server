const AWS = require('aws-sdk');
const multer = require('multer');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
require('dotenv').config();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Set up Multer for file uploads
const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: { fileSize: 15 * 1024 * 1024 }, // 10 MB file size limit
// }).single('image');
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/heic'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new AppError('Invalid file type', 400), false);
    }
    cb(null, true);
  },
}).single('image');

exports.uploadImage = catchAsync(async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return next(new AppError('Error uploading file', 500));
    }

    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/${Date.now()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    try {
      // Upload the file to S3
      const data = await s3.upload(params).promise();

      // Generate a pre-signed URL for accessing the uploaded file
      const signedUrlParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: data.Key,
        Expires: 60 * 5000, // URL expires in 500 minutes
      };
      const uploadUrl = s3.getSignedUrl('getObject', signedUrlParams);

      res.status(200).json({
        status: 'success',
        imageUrl: data.Location,
        key: data.Key,
        uploadUrl,
      });
    } catch (err) {
      console.error('S3 upload error:', err);
      return next(new AppError('Error uploading file to S3', 500));
    }
  });
});

exports.getImages = catchAsync(async (req, res, next) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix: 'uploads/',
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const imageUrls = data.Contents.map((item) => {
      return s3.getSignedUrl('getObject', {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: item.Key,
        Expires: 60 * 10000, // URL expires in 10000 minutes
      });
    });
    res.status(200).json({
      status: 'success',
      images: imageUrls,
    });
  } catch (err) {
    console.error('S3 listObjectsV2 error:', err);
    return next(new AppError('Error retrieving images from S3', 500));
  }
});

exports.getPresignedUrl = catchAsync(async (req, res, next) => {
  const { key } = req.query;

  if (!key) {
    return next(new AppError('No key provided', 400));
  }

  try {
    const signedUrlParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Expires: 60 * 5, // URL expires in 5 minutes
    };
    const presignedUrl = s3.getSignedUrl('getObject', signedUrlParams);

    res.status(200).json({
      status: 'success',
      presignedUrl,
    });
  } catch (err) {
    console.error('S3 getSignedUrl error:', err);
    return next(new AppError('Error generating pre-signed URL', 500));
  }
});

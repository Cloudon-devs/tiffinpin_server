const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const generatePresignedUrl = (url, expiresIn = 60 * 5) => {
  // Extract the key from the URL
  const key = url.split('.com/')[1].split('?')[0];
  const signedUrlParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: 'uploads/1739050992559-image-0.png',
    Expires: expiresIn, // URL expires in 5 minutes by default
  };
  const uploadUrl = s3.getSignedUrl('getObject', signedUrlParams);
  console.log(uploadUrl);
  return uploadUrl;
};

module.exports = { generatePresignedUrl };

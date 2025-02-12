const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const generatePresignedUrl = (key, expiresIn = 60 * 5) => {
  const signedUrlParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Expires: expiresIn, // URL expires in 5 minutes by default
  };
  const uploadUrl = s3.getSignedUrl('getObject', signedUrlParams);

  console.log('Generated pre-signed URL:', uploadUrl);
  return uploadUrl;
};

module.exports = { generatePresignedUrl };

// src/utils/s3Service.js (Final CJS Version)

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

// !!! IMPORTANT: Use the correct region (ap-south-1 based on your previous input)
const REGION = 'ap-south-1'; 
const S3_BUCKET_NAME = 'auction-media-ty4b';

// Initialize S3 Client. 
const s3Client = new S3Client({ region: REGION });

/**
 * Uploads a file stream to the designated media bucket.
 * NOTE: This function MUST be defined WITHOUT the 'export' keyword.
 * @param {object} file - The file object from your server's upload middleware.
 * @returns {string} The URL of the uploaded object.
 */
async function uploadMediaFile(file) {
    const fileStream = fs.createReadStream(file.path);
    const key = `media/${Date.now()}-${file.originalname}`; 

    const uploadParams = {
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype,
        ACL: 'public-read' 
    };

    try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        
        // Return the public URL
        return `https://${S3_BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
    } catch (error) {
        console.error('S3 Upload Error:', error);
        throw new Error('Failed to upload file to S3. Check EC2 IAM role permissions.');
    } finally {
        // Clean up the temporary file created by the upload middleware
        fs.unlink(file.path, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
        });
    }
}

// FIX: Export the function using the CJS syntax
module.exports = { uploadMediaFile };

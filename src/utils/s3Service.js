// src/utils/s3Service.js (CONVERTED TO ESM)

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

// !!! IMPORTANT: The REGION is already set to 'ap-south-1' as per your input. !!!
const REGION = 'ap-south-1'; 

const S3_BUCKET_NAME = 'auction-media-ty4b';

// Initialize S3 Client. 
const s3Client = new S3Client({ region: REGION });

/**
 * Uploads a file stream to the designated media bucket.
 * @param {object} file - The file object from your server's upload middleware (e.g., Multer).
 * @returns {string} The URL of the uploaded object.
 */
export async function uploadMediaFile(file) {
    // Note: fs.createReadStream is available in ESM Node environments.
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
        
        // Use the defined REGION variable in the URL construction
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

// Export the function using ESM syntax
// module.exports = { uploadMediaFile };  <-- This line is removed/replaced
// The 'export async function' above handles the export.
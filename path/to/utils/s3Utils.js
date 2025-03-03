import AWS from "aws-sdk";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Function to upload a file to S3
export const uploadFileToS3 = async (filePath, bucketName, key, contentType) => {
  try {
    const fileContent = fs.readFileSync(filePath);

    // S3 upload parameters
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
    };

    // Upload the file
    const data = await s3.upload(params).promise();
    console.log("File uploaded successfully:", data.Location);
    return data.Location; // Return the file location
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error; // Rethrow the error for handling in the calling function
  }
}; 
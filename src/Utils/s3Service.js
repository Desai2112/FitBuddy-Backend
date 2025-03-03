import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const uploadToS3 = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }

    const fileStream = fs.createReadStream(localFilePath);
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Body: fileStream,
      Key: `pdfs/${Date.now().toString()}-${path.basename(localFilePath)}`,
      ContentType: "application/pdf", 
    };

    const response = await s3.upload(uploadParams).promise();

    // Remove the file from local storage after successful upload
    fs.unlinkSync(localFilePath);

    return response.Location; // Return the URL of the uploaded file
  } catch (error) {
    console.error("Error uploading to S3:", error);

    // Optionally, remove the file if an upload error occurs
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up local file:", cleanupError);
    }

    return null;
  }
};

export { uploadToS3 };
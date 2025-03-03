import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = './public/temp'; // Define the upload directory
    console.log(`Uploading to: ${uploadPath}`); // Print the upload directory path
    cb(null, uploadPath); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    console.log(`File uploaded: ${file.originalname}`); // Print the filename
    cb(null, file.originalname); // Customize the filename as needed
  }
});

export const upload = multer({ storage: storage });

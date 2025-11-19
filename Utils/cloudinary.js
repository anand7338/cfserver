import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;


// cloudinary.config({
//   cloud_name: 'dal5nhow2',
//   api_key: '366134243799841',
//   api_secret: 'QkG4ORsF11HzTBe4-YPKhwCzADM',
// });


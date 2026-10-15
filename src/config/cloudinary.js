import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();
cloudinary.config({
    cloud_name:"ntqf8ho9",
    api_key:"115986187488685",
    api_secret:"I9Fpe4gY77H5f1Yb8btMDDwtINY"
});
export default cloudinary;
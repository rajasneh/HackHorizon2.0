import multer from "multer";

// const storage = multer.diskStorage({ 
//  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname) 
// });

// If you want, you can use memoryStorage:
// console.log("Multer memory storage initialized.");
const storage = multer.memoryStorage();

export const upload = multer({ storage });

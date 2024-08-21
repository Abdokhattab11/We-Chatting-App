const AppError = require("../utils/CustomError");
const multer = require("multer");
const storage = multer.memoryStorage();
const multerOptions = () => {
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[0] === "image") {
      cb(null, true);
    } else cb(new AppError("only images is allowed", 400), false);
  };

  const upload = multer({ storage: storage, fileFilter: fileFilter });
  return upload;
};
exports.uploadSingleImage = (fieldName) =>
  multerOptions().single(`${fieldName}`);

exports.uploadImages = (array) =>
  multerOptions().fields([
    { name: "imageCover", maxCount: 1 },
    { name: "images", maxCount: 8 },
  ]);

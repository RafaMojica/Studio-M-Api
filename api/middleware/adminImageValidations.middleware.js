const { check } = require("express-validator");
const {
  validateFileUpload,
  validateFileExtension,
} = require("./imageValidate.middleware");

const validateUploadCourse = [
  validateFileUpload,
  validateFileExtension,
  check("id", "id is not type mongo").isMongoId(),
];
const validateUploadUser = [
  validateFileUpload,
  validateFileExtension,
  check("mail", "The email is not valid").isEmail(),
];

module.exports = { validateUploadCourse, validateUploadUser };

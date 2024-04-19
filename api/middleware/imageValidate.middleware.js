const validateFileUpload = (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }
  next();
};

const validateFileExtension = (req, res, next) => {
  const validateExtensions = ["png", "jpg", "jpeg", "gif", "avif"];
  const { archivo } = req.files;
  const extension = archivo.name.split(".").pop();

  if (!validateExtensions.includes(extension.toLowerCase())) {
    return res.status(400).send("Invalid extension");
  }
  next();
};

module.exports = { validateFileUpload, validateFileExtension };

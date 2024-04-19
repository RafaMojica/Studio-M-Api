const path = require("path");
const { v4: uuidv4 } = require("uuid");
uuidv4();
const subirArchivo = (
  files,
  extesionesValidas = ["png", "jpg", "jpeg", "gif", "avif"],
  carpeta = ""
) => {
  return new Promise((resolve, reject) => {
    const { archivo } = files;
    const extension = archivo.name.split(".").pop();

    if (!extesionesValidas.includes(extension)) {
      reject("las extensiones validas son " + extesionesValidas);
    }
    const nameTemp = uuidv4() + "." + extension;
    const uploadPath = path.join(
      __dirname + "../../../uploads/" + carpeta + "/" + nameTemp
    );
    archivo.mv(uploadPath, function (err) {
      if (err) reject(err);

      resolve(nameTemp);
    });
  });
};

module.exports = {
  subirArchivo,
};

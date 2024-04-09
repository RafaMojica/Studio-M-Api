const {
  User,
  Token,
  Course,
  Certificate,
  Project,
  Favorite,
} = require("../models");
const { generateToken } = require("../config/token");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");
const path = require("path");
const cloudinary = require("cloudinary").v2;
cloudinary.config(process.env.CLOUDINARY_URL);

//Logearse
exports.loginUser = async (req, res) => {
  const { mail, password } = req.body;

  try {
    const user = await User.findOne({ mail });
    if (!user) return res.status(404).send("user not found");
    const password_check = await user.validatorPassword(password);
    if (!password_check) return res.status(401).send("Invalid password");
    const { name, lastname, dni, _id, isAdmin } = user;

    const token = generateToken({ name, lastname, mail, dni, _id, isAdmin });
    res.cookie("token", token);

    const userFav = await Favorite.findOne({ userId: user._id });
    if (!userFav) {
      const newFav = new Favorite({ userId: user._id });
      await newFav.save();
    }
    res.status(200).send({ token, user });
  } catch (error) {
    res.sendStatus(500);
  }
};

//Registrarse
exports.addUser = async (req, res) => {
  const { mail } = req.body;
  try {
    const email = await User.findOne({ mail });
    if (email) return res.status(400).send("Email is already registered");

    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.sendStatus(500);
  }
};

exports.userPersistence = (req, res) => {
  res.send(req.user);
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.sendStatus(204);
};

// Este controlador hay que verlo cuando definamos lo de cloudinary
exports.updateUserData = async (req, res) => {
  const { userId } = req.params;
  const payload = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, payload, { new: true });
    if (!user) return res.status(404).send("User not found");
    return res.status(200).send("User updated successfully");
  } catch (error) {
    res.sendStatus(500);
  }
};

//controlador que actuliza la contrasena del usuario
exports.updateUserPassword = async (req, res) => {
  const { userId } = req.params;
  const { firstpassword, secondpassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");
    if (firstpassword != secondpassword)
      return res.status(404).send("Invalid Password");
    user.password = secondpassword;
    await user.save();
    res.send(user);
  } catch (error) {
    res.sendStatus(500);
  }
};

// Ruta para poner el mail y que te envien un correo con un link de recuperacion de contraseña.
exports.forgotPassword = async (req, res) => {
  const { mail } = req.body;

  try {
    const userMail = await User.findOne({ mail });
    if (!userMail) return res.status(404).send("user not found");

    let token = await Token.findOne({ userId: userMail._id });
    if (token) await token.deleteOne();

    let resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, 10);

    await new Token({
      userId: userMail._id,
      token: hash,
      createdAt: Date.now(),
    }).save();

    const link = `${process.env.STUDIO_M_CLIENT_HOST}/reset-password?token=${resetToken}&id=${userMail._id}`;

    sendEmail(
      userMail.mail,
      "Recuperar contraseña",
      {
        name: userMail.name,
        link: link,
      },
      `./template/requestResetPassword.handlebars`
    );
    res.status(200).send(link);
  } catch (error) {
    res.sendStatus(500);
  }
};

// Ruta para recuperar la contraseña.
exports.resetPassword = async (req, res) => {
  const { userId, token, password } = req.body;

  try {
    let passwordResetToken = await Token.findOne({ userId });
    if (!passwordResetToken)
      return res.status(404).send("Invalid or expired password reset token");

    const isValid = await bcrypt.compare(token, passwordResetToken.token);
    if (!isValid)
      return res.status(404).send("Invalid or expired password reset token");

    const user = await User.findById({ _id: userId });
    if (!user) return res.status(404).send("user not found");

    const hash = await bcrypt.hash(password, user.salt);
    await User.updateOne(
      { _id: userId },
      { $set: { password: hash } },
      { new: true }
    );

    sendEmail(
      user.mail,
      "Contraseña recuperada exitosamente",
      {
        name: user.name,
        link: "https://api.whatsapp.com/qr/D4K4N3P4NR4CL1?autoload=1&app_absent=0",
      },
      "./template/resetPassword.handlebars"
    );
    await passwordResetToken.deleteOne();

    res.status(200).send("Password reset was successful");
  } catch (error) {
    res.sendStatus(500);
  }
};

//Controlador para actualizar la imagen
exports.updateImgUser = async (req, res) => {
  try {
    const { mail } = req.body;
    const user = await User.findOne({ mail });
    if (!user) return res.status(404).send("User not found");
    if (user.profileImg) {
      const nameFile = user.profileImg.split("/").pop();
      const [public_id] = nameFile.split(".");
      await cloudinary.uploader.destroy(public_id);
    }

    const { tempFilePath } = req.files.archivo;
    const { secure_url } = await cloudinary.uploader.upload(tempFilePath);
    user.profileImg = secure_url;

    await user.save();
    res.status(200).send(user);
  } catch (err) {
    res.status(500).send(err);
  }
};

// controlador que devuelve la info de los cursos de un usuario y su avance
exports.userCourses = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("user not found");

    const userCourses = user.course.map(async (userCourse) => {
      const seenClasses = userCourse.classes.filter(
        (viewClass) => viewClass.status == true
      ).length;

      const courseInfo = await Course.findById({ _id: userCourse.courseId });
      if (!courseInfo) return res.status(404).send("Course not found");

      const progress = Math.round(
        (seenClasses / userCourse.classes.length) * 100
      );

      return {
        courseInfo,
        progress,
      };
    });

    const courses = await Promise.all(userCourses);
    res.status(200).send(courses);
  } catch (error) {
    res.sendStatus(500);
  }
};

exports.classUsers = async (req, res) => {
  const { userId, courseId, classId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("user not found");
    const course = user.course.find((idem) => idem.courseId == courseId);
    const courseClass = course.classes.find((idem) => idem.classId == classId);
    res.send(courseClass);
  } catch (error) {
    res.sendStatus(500);
  }
};

//ruta para devolver los datos del usuario
exports.userData = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    !user && res.status(404).send("user not found");

    res.status(200).send(user);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

// controlador para cambiar el estado de la clase
exports.updateCourseAdvance = async (req, res) => {
  const { mail, courseId, classId, status } = req.body;

  try {
    const user = await User.findOne({ mail });
    if (!user) return res.status(404).send("User not found");

    const course = user.course.find((course) => course.courseId == courseId);
    const classes = course.classes;
    const oneClass = classes.find((one) => one.classId == classId);

    oneClass.status = status;

    await user.save();

    res.send(user);
  } catch (error) {
    res.sendStatus(500);
  }
};

// controlador que me traiga los certificados de un usuario
exports.allCertificates = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("user not found");

    const certificate = await Certificate.find({ userId: user._id })
      .populate("courseId")
      .populate("userId");

    const certificateData = certificate.map((item) => {
      const { userId, courseId, description, createdAt, pdfPath } = item;

      return {
        name: userId.name,
        lastname: userId.lastname,
        dni: userId.dni,
        courseLongTitle: courseId.courseLongTitle,
        courseShortTitle: courseId.courseShortTitle,
        courseId: courseId._id,
        description,
        pdfPath,
        createdAt,
      };
    });

    res.send(certificateData);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

exports.projectUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("user not found");

    const userProject = await Project.find({ userId });
    if (!userProject || userProject.length === 0) {
      return res.send(null);
    }

    res.status(200).send(userProject);
  } catch (error) {
    res.sendStatus(500);
  }
};

//controlador para descargar el PDF del certificado
exports.pdfCertificate = async (req, res) => {
  const { userId, courseId } = req.params;

  try {
    const certificate = await Certificate.findOne({ userId, courseId });
    if (!certificate) return res.status(404).send("Certificate not found");

    const pdfPath = certificate.pdfPath;
    res.download(path.resolve(pdfPath));
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

// controlador que me traiga los cursos comprados por el usuario
exports.boughtCourses = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("user not found");

    const boughtCourses = user.course.map((course) => course.courseId);
    res.send(boughtCourses);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

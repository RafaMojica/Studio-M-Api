const { Project, User, Certificate, Course } = require("../models");
const sendEmail = require("../utils/sendEmail");
const puppeteer = require("puppeteer");
const fs = require("fs");
const certificateTemplate = require("../utils/template/certificateTemplate");
const path = require("path");

// Obtener todos los proyectos
exports.allProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: false })
      .populate("userId")
      .populate("courseId");

    if (!projects) res.status(404).send("Projects not found");

    const projectsData = projects.map((item) => {
      const { userId, courseId, status, project_url, comment, _id } = item;

      return {
        projectId: _id,
        status,
        project_url,
        comment,
        name: userId.name,
        lastname: userId.lastname,
        mail: userId.mail,
        courseShortTitle: courseId.courseShortTitle,
        courseLongTitle: courseId.courseLongTitle,
        projectsTitle: courseId.projectsTitle,
        courseId: courseId._id,
        userId: userId._id,
      };
    });

    res.status(200).send(projectsData);
  } catch (error) {
    res.sendStatus(500);
  }
};

// enviar un comentario del proyecto
exports.updateProject = async (req, res) => {
  const { projectId } = req.params;
  const { comment, mail } = req.body;
  try {
    const user = await User.findOne({ mail });
    if (!user) return res.status(404).send("user not found");

    const projectToUpdate = await Project.findByIdAndUpdate(
      projectId,
      { comment },
      {
        new: true,
      }
    );
    if (!projectToUpdate) {
      return res.status(404).send("Project not found");
    }
    await projectToUpdate.save();

    sendEmail(
      mail,
      "Comentarios de entrega final",
      { name: user.name, comment },
      "./template/projectComment.handlebars"
    );

    res.status(200).send("Project updated successfully");
  } catch (error) {
    res.sendStatus(500);
  }
};

// Cambiar el estado del proyecto (aprobado o desaprobado), crear certificado.
exports.updateStatusProject = async (req, res) => {
  const { projectId } = req.params;
  const { status, userId, courseId } = req.body;

  try {
    const projectToUpdate = await Project.findByIdAndUpdate(
      projectId,
      { status },
      { new: true }
    );
    !projectToUpdate && res.status(404).send("project not found");

    const user = await User.findById(userId);
    !user && res.status(404).send("user not found");

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).send("Course not found");

    // aca crea el modelo certificado, con datos de curso y usuario. El path queda vacio. El path se elimino del modelo, no es necesario.
    const certificate = await Certificate.create({
      userId,
      courseId,
      description:
        "Ha realizado y completado con éxito su curso en by M Studio, cumpliendo con todos los requisitos académicos exigidos",
      // pdfPath: " ",
    });

    //* TODO ESTO LO PASO AL CONTROLLER QUE SE ENCARGA DE DESCARGAR EL CERTIFICADO
    // const browser = await puppeteer.launch({
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
    //   defaultViewport: null,
    //   // ver si esto queda o no por error de warning
    //   headless: "new",
    // });

    // const page = await browser.newPage();

    // const basePath = path.resolve(__dirname, "..");
    // const mysteryFont = fs
    //   .readFileSync(
    //     path.join(basePath, "assets/fonts/MysteryMixed-base64.txt"),
    //     "utf8"
    //   )
    //   .trim();
    // const msgothicFont = fs
    //   .readFileSync(
    //     path.join(basePath, "assets/fonts/ms-pgothic-base64.txt"),
    //     "utf8"
    //   )
    //   .trim();
    // const paperBackground = fs
    //   .readFileSync(path.join(basePath, "assets/images/background.txt"), "utf8")
    //   .trim();
    // const signature = fs
    //   .readFileSync(path.join(basePath, "assets/images/signature.txt"), "utf8")
    //   .trim();

    // const formattedDate = new Intl.DateTimeFormat("es-ES", {
    //   day: "numeric",
    //   month: "long",
    //   year: "numeric",
    // }).format(certificate.createdAt);
    // const certificateHTML = await certificateTemplate(
    //   user,
    //   course,
    //   formattedDate,
    //   mysteryFont,
    //   msgothicFont,
    //   paperBackground,
    //   signature
    // );

    // await page.setContent(certificateHTML);
    // await page.waitForSelector("img");
    // await page.emulateMediaType("print");

    // const pdfPath = path.resolve(
    //   `certificates/certificate_${userId}_${courseId}.pdf`
    // );
    // const directoryPath = path.dirname(pdfPath);
    // fs.mkdirSync(directoryPath, { recursive: true });
    // const options = { path: pdfPath, format: "A4" };

    // certificate.pdfPath = pdfPath.toString();

    // await page.pdf(options);
    // await browser.close();

    await certificate.save();
    await projectToUpdate.save();

    sendEmail(
      user.mail,
      "Proyecto Aprobado",
      { name: user.name },
      "./template/projectApproved.handlebars"
    );

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

// Ruta para eliminar proyectos de la base de datos
exports.deleteProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findByIdAndDelete(projectId);
    if (!project) return res.status(404).send("project not found");
    return res.status(200).send("Project deleted successfully");
  } catch (error) {
    res.sendStatus(500);
  }
};

// ruta para un solo proyecto
exports.oneProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).send("Project not found");

    res.status(200).send(project);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

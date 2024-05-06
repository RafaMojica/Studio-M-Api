const { Course } = require("../models/");
const cloudinary = require("cloudinary").v2;
cloudinary.config(process.env.CLOUDINARY_URL);

exports.addCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).send(course);
  } catch (error) {
    res.sendStatus(500);
  }
};
exports.updateImgCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { condicion } = req.body;
    const course = await Course.findById(id);
    if (!course) return res.status(404).send("Course not found");
    if (condicion === "1") {
      return res.send("no files to update");
    } else if (condicion === "2") {
      if (course.courseImg_url) {
        const nameFile = course.courseImg_url.split("/").pop();
        const [public_id] = nameFile.split(".");
        await cloudinary.uploader.destroy(public_id);
      }
      const file1 = req.files.archivo;
      const fileUpload1 = await cloudinary.uploader.upload(file1.tempFilePath);
      course.courseImg_url = fileUpload1.secure_url;
      await course.save();
      res.status(200).send(course);
    } else if (condicion === "3") {
      if (course.courseImgSmall_url) {
        const nameFile = course.courseImgSmall_url.split("/").pop();
        const [public_id] = nameFile.split(".");
        await cloudinary.uploader.destroy(public_id);
      }
      const file2 = req.files.archivo2;
      const fileUpload2 = await cloudinary.uploader.upload(file2.tempFilePath);
      course.courseImgSmall_url = fileUpload2.secure_url;
      await course.save();
      res.status(200).send(course);
    } else if (condicion === "4") {
      if (course.courseImg_url) {
        const nameFile = course.courseImg_url.split("/").pop();
        const [public_id] = nameFile.split(".");
        await cloudinary.uploader.destroy(public_id);
      }
      if (course.courseImgSmall_url) {
        const nameFile = course.courseImgSmall_url.split("/").pop();
        const [public_id] = nameFile.split(".");
        await cloudinary.uploader.destroy(public_id);
      }
      const file1 = req.files.archivo;
      const file2 = req.files.archivo2;
      const fileUpload1 = await cloudinary.uploader.upload(file1.tempFilePath);
      course.courseImg_url = fileUpload1.secure_url;
      const fileUpload2 = await cloudinary.uploader.upload(file2.tempFilePath);
      course.courseImgSmall_url = fileUpload2.secure_url;

      await course.save();
      res.status(200).send(course);
    }
    /* console.log(condicion);

    res.send(condicion); */
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.createImgCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) return res.status(404).send("Course not found");
    //limpiar imagenes previas
    /* if (course.courseImg_url) {
      const nameFile = course.courseImg_url.split("/").pop();
      const [public_id] = nameFile.split(".");
      await cloudinary.uploader.destroy(public_id);
    }
    if (course.courseImgSmall_url) {
      const nameFile = course.courseImgSmall_url.split("/").pop();
      const [public_id] = nameFile.split(".");
      await cloudinary.uploader.destroy(public_id);
    } */

    console.log(req.files);
    const file1 = req.files.archivo;
    const file2 = req.files.archivo2;
    const fileUpload1 = await cloudinary.uploader.upload(file1.tempFilePath);
    course.courseImg_url = fileUpload1.secure_url;
    const fileUpload2 = await cloudinary.uploader.upload(file2.tempFilePath);
    course.courseImgSmall_url = fileUpload2.secure_url;

    await course.save();
    res.status(200).send(course);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const updateCourse = await Course.findByIdAndUpdate(id, payload, {
      new: true,
    });
    if (!updateCourse) return res.status(404).send("Course not found");
    res.status(200).send(updateCourse);
  } catch (error) {
    res.sendStatus(500);
  }
};
exports.allCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    if (!courses) return res.status(404).send("Courses not found");
    res.status(200).send(courses);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

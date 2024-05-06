const { Course, User } = require("../models");

exports.allCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: true });
    if (!courses) return res.status(404).send("Courses not found");
    res.status(200).send(courses);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

exports.allCoursesUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");
    //obtenemos los cursos comprados del usuario
    const coursesUser = user.course.map((e) => e.courseId.toString());
    //obtenemos todos los cursos disponibles para poder matchearlos con los ya comprados por el usuario
    const courses = await Course.find({ status: true });
    if (!courses) return res.status(404).send("Courses not found");
    const courseUpdate = courses.map((course) => {
      const status_course = coursesUser.includes(course._id.toString());

      if (status_course) {
        return { ...course._doc, statusPurchase: status_course };
      } else {
        return { ...course._doc, statusPurchase: status_course };
      }
    });

    res.send(courseUpdate);
  } catch (error) {
    res.sendStatus(500);
  }
};

exports.oneCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) return res.status(404).send("Course not found");

    res.status(200).send(course);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

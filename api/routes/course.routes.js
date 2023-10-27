const express = require("express");
const router = express.Router();
const validateFields = require("../middleware/validateFields.middleware");
const { oneCourse, allCourses } = require("../controllers/course.controller");
const {
  validateMongoIdCourse,
} = require("../middleware/courseValidations.middleware");

router.get("/all-courses", allCourses);

router.get(
  "/all-courses/:id",
  validateMongoIdCourse,
  validateFields,
  oneCourse
);
/* //rutas de marcos
router.get("/projects", allProjects);

router.put(
  "/updateProject/:id",
  [check("id", "id is not type mongo").isMongoId()],
  updateProject
);

router.post("/addCoupon", validateCoupon, createCoupon);

router.delete("/deleteCoupon/:id", validateDeleteCoupon, deleteCoupon);

router.put(
  "/updateCoupon/:id",
  [check("id", "id is not type mongo").isMongoId()],
  updateCoupon
); */

module.exports = router;

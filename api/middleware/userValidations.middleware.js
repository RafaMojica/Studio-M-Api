const { check, body } = require("express-validator");

const validateRegister = [
  check("name", "Name is required").not().isEmpty(),
  check("lastname", "Last name is required").not().isEmpty(),
  check("dni", "Dni is required").not().isEmpty(),
  check("mail", "Email is required").not().isEmpty(),
  check("password", "Password is required").not().isEmpty(),
  check(
    "password",
    "The password must be at least 8 characters, contain at least one uppercase, contain at least one lower case, contain at least one number."
  )
    .isLength({
      min: 8,
    })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z\d@$.!%*#?&]/),
  check("mail", "The email is not valid").isEmail(),
];

const validateLogin = [
  check("mail", "Email is required").not().isEmpty(),
  check("mail", "The email is not valid").isEmail(),
  check("password", "Password is required").not().isEmpty(),
];

const validateForgotPassword = [
  check("mail", "Email is required").not().isEmpty(),
  check("mail", "The email is not valid").isEmail(),
];

const validateResetPassword = [
  body("userId").isMongoId().withMessage("Invalid userId format"),
  body("token").notEmpty().withMessage("Token is required"),
  check("password", "Password is required").not().isEmpty(),
  check(
    "password",
    "The password must be at least 8 characters, contain at least one uppercase, contain at least one lower case, contain at least one number."
  )
    .isLength({
      min: 8,
    })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z\d@$.!%*#?&]/),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
};
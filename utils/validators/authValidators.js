const slugify = require("slugify");
const bcrypt = require("bcryptjs");

const validator = require("express-validator");
const validatorMiddleWare = require("../../middlesWares/validatorMiddleWare");
const User = require("../../models/userModel");
exports.getUserValidator = [
  validator.check("id").isMongoId().withMessage("invalid User id format"),
  validatorMiddleWare,
];
exports.signUpValidator = [
  validator
    .check("name")
    .notEmpty()
    .withMessage("a User must have name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validator
    .check("email")
    .notEmpty()
    .withMessage("a User must have email")
    .isEmail()
    .withMessage("invalid email format")
    .custom(async (val) => {
      const user = await User.findOne({ email: val });
      if (user) {
        throw new Error("email already exists");
      }
      return true;
    }),
  validator
    .check("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 8 }),
  validator
    .check("confirmPassword")
    .notEmpty()
    .withMessage("confirm password is required")
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error("password and confirm password must be the same");
      }
      return true;
    }),

  validatorMiddleWare,
];

exports.loginValidator = [
  validator
    .check("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email format"),
  validator
    .body("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters"),
  validatorMiddleWare,
];

exports.changeUserPasswordValidator = [
  validator.param("id").isMongoId().withMessage("invalid User id format"),

  validator
    .body("oldPassword")
    .notEmpty()
    .withMessage("invalid password format")
    .custom(async (val, { req }) => {
      const user = await User.findById(req.params.id);
      const match = await bcrypt.compare(val, user.password);
      if (!match) {
        throw new Error("wrong password");
      }
      return true;
    }),
  validator.body("newPassword").notEmpty().withMessage("enter new password"),
  validator
    .check("confirmNewPassword")
    .notEmpty()
    .withMessage("confirm new password is required")
    .custom((val, { req }) => {
      if (val !== req.body.newPassword) {
        throw new Error(
          "newPassword and confirm new password must be the same"
        );
      }
      return true;
    }),
  validatorMiddleWare,
];

exports.deleteUserValidator = [
  validator.param("id").isMongoId().withMessage("invalid User id format"),
  validatorMiddleWare,
];

exports.resetPasswordValidator = [
  validator
    .check("newPassword")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 8 }),
  validator
    .check("confirmNewPassword")
    .notEmpty()
    .withMessage("confirm password is required")
    .custom((val, { req }) => {
      if (val !== req.body.newPassword) {
        throw new Error("password and confirm password must be the same");
      }
      return true;
    }),

  validatorMiddleWare,
];
exports.changeMyPasswordValidator = [
  validator
    .body("oldPassword")
    .notEmpty()
    .withMessage("invalid password format")
    .custom(async (val, { req }) => {
      const user = await User.findById(req.user.id);
      const match = await bcrypt.compare(val, user.password);
      if (!match) {
        throw new Error("wrong password");
      }
      return true;
    }),
  validator.body("newPassword").notEmpty().withMessage("enter new password"),
  validator
    .check("confirmNewPassword")
    .notEmpty()
    .withMessage("confirm new password is required")
    .custom((val, { req }) => {
      if (val !== req.body.newPassword) {
        throw new Error(
          "newPassword and confirm new password must be the same"
        );
      }
      return true;
    }),
  validatorMiddleWare,
];

//example for route handler with validator middleware
//router.post("/signUp", signUpValidator, signUp);

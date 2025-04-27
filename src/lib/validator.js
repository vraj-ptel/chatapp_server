import { body, check, validationResult, query, param } from "express-validator";
import customError from "../utils/errorClass.js";
const validate = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors);
  const errorMessage = errors
    .array()
    .map((error) => error.msg)
    .join(", ");
  if (errors.isEmpty()) {
    return next();
  } else {
    return next(new customError(errorMessage, 400));
  }
};
const registeredValidator = () => [
  body("name", "please enter name").notEmpty().withMessage("please enter name"),
  body("userName", "please enter userName")
    .notEmpty()
    .withMessage("please enter userName"),
  body("password", "please enter password")
    .notEmpty()
    .withMessage("please enter password"),
  body("bio", "please enter bio").notEmpty().withMessage("please enter bio")
  // check("avatar", "please upload avatar")
  //   .notEmpty()
  //   .withMessage("please upload avatar"),
];
const loginValidator = () => [
  body("userName", "please enter username")
    .notEmpty()
    .withMessage("please enter username"),
  body("password", "please enter password")
    .notEmpty()
    .withMessage("please enter password"),
];
const newGroupValidator = () => [
  body("name", "please enter name").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("please enter members")
    .isArray({ min: 2, max: 100 })
    .withMessage(" members must be between 2 and 100"),
];
const addMemberValidator = () => [
  body("chatId").notEmpty().withMessage("please enter chatId"),
  body("members")
    .notEmpty()
    .withMessage("please enter members")
    .isArray({ min: 1, max: 97 })
    .withMessage(" members must be more than 1"),
];
const removeMemberValidator = () => [
  body("chatId").notEmpty().withMessage("please enter chatId"),
  body("userId").notEmpty().withMessage("please enter userId"),
];
const leaveGroupValidator = () => [
  param("id").notEmpty().withMessage("please enter chatId"),
];
const attachmentsValidator = () => [
  body("chatId").notEmpty().withMessage("please enter chatId")
  // check("files")
  //   .notEmpty()
  //   .withMessage("please enter attachements")
  //   .isArray({ min: 1, max: 5 })
  //   .withMessage("please enter attachements"),
];
const chatIdValidator = () => [
  param("id").notEmpty().withMessage("please enter chatId"),
];

const renameGroupValidator = () => [
  param("id").notEmpty().withMessage("please enter chatId"),
  body("name").notEmpty().withMessage("please enter name"),
];

const sendFriendRequestValidator = () => [
  body("userId").notEmpty().withMessage("please enter userId"),
];
const acceptFriendRequestValidator = () => [
  body("requestId").notEmpty().withMessage("please enter reqId"),
  body("accept")
    .notEmpty()
    .withMessage("please add accept")
    .isBoolean()
    .withMessage("accept must be boolean"),
];

// admin validatorrrrrrrrrr
const adminValidator = () => [
  body("secretKey").notEmpty().withMessage("please enter secretKey"),
];
export {
  validate,
  registeredValidator,
  loginValidator,
  newGroupValidator,
  addMemberValidator,
  removeMemberValidator,
  leaveGroupValidator,
  attachmentsValidator,
  chatIdValidator,
  renameGroupValidator,
  sendFriendRequestValidator,
  acceptFriendRequestValidator,
  adminValidator,
};

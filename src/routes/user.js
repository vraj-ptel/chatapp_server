import express from "express";
import {
  getMyProfile,
  login,
  newUser,
  sendFriendRequest,
  acceptRequest as acceptFriendRequest,
  logOut,
  getNotification,
  getMyFriends,
  searchUser,
   updateProfile,
} from "../controllers/usercontroll.js";
import { singleUpload } from "../middlewares/multter.js";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  registeredValidator,
  validate,
  loginValidator,
  sendFriendRequestValidator,
  acceptFriendRequestValidator,
} from "../lib/validator.js";

const app = express.Router();

app.post("/login", loginValidator(), validate, login);
app.get("/logout", logOut);
app.post("/new", singleUpload, registeredValidator(), validate, newUser);

// auth requiredd
app.get("/me", isAuthenticated, getMyProfile);
app.post("/update",singleUpload, isAuthenticated,updateProfile);
//search user
app.get("/search", isAuthenticated, searchUser);

// sendfriendrequest
app.put(
  "/sendrequest",
  sendFriendRequestValidator(),
  validate,
  isAuthenticated,
  sendFriendRequest
);
// acceptfriendrequest
app.put(
  "/acceptrequest",
  acceptFriendRequestValidator(),
  validate,
  isAuthenticated,
  acceptFriendRequest
);
// get notification
app.get("/notification", isAuthenticated, getNotification);
//get friendss
app.get("/friends", isAuthenticated, getMyFriends);

export default app;

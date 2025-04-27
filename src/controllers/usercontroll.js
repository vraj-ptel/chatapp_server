import User from "../models/user.js";
import Chat from "../models/chat.js";
import Request from "../models/request.js";
import bcrypt from "bcrypt";
import sendToken from "../lib/sendToken.js";
import customError from "../utils/errorClass.js";
import { errorHandler } from "../middlewares/error.js";
import emitEvent from "../utils/emitFunc.js";
import { NEW_REQUEST, REFETCH_CHAT } from "../constants/events.js";
import { getOtherMembers } from "../lib/helper.js";
import uploadFilesToCloudinary from "../utils/uploadFileToCloudnary.js";
import jwt from "jsonwebtoken";
import deleteFileFromCloudnary from "../utils/deleteFileFromCloudnary.js";
// user register methodd
// Create a new user and save it to the database and save token in cookie
const newUser = errorHandler(async (req, res, next) => {
  const { name, userName, password, bio } = req.body;
  console.log("req.body", req.body);
  const file = req.file;
  console.log("file", file);
  if (!file) return next(new customError("Please Upload Avatar", 404));

  const result = await uploadFilesToCloudinary([file]);

  const avatar = {
    public_id: result[0].public_id,
    url: result[0].url,
  };
  console.log("avatar", avatar);

  try {
    const userr = User.create({
      name,
      bio,
      userName,
      password,
      avatar,
    });
    const user = await userr;

    return sendToken(res, user, "user logged in successfully", 200);
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return next(new customError(`${duplicateField} already exists`, 400));
    }
    // Handle other potential errors
    return next(new customError("Failed to create user", 500));
  }
});
// user login methodd
const login = errorHandler(async (req, res, next) => {
  const { userName, password } = req.body;

  const user = await User.findOne({ userName }).select("+password");

  if (!user) {
    res.status(404).json({ success: false, message: "invalid username" });
  }
  const hashedPassword = user.password;
  const result = await bcrypt.compare(password, hashedPassword);
  console.log("result", result);
  user.password = undefined;
  if (!result) {
    // return res.status(404).json({success:false,message:"invalid password"})
    return next(new customError("invalid password", 404));
  } else {
    return sendToken(res, user, "user logged in successfully", 200);
  }
});
//update profile
const updateProfile = errorHandler(async (req, res, next) => {
  const _id = req._id;
  const { name, bio } = req.body;
  const file = req.file;
  const user = await User.findById(_id);
  if (!user) {
    return next(new customError("user not found", 404));
  }
  if (file) {
    const public_ids=[];
    public_ids.push(user.avatar.public_id);
    await deleteFileFromCloudnary(public_ids)
    const result = await uploadFilesToCloudinary([file]);
    const avatar = {
      public_id: result[0].public_id,
      url: result[0].url,
    };
    user.avatar = avatar;
  }
  if (name) {
    user.name = name;
  }
  if (bio) {
    user.bio = bio;
  }
 const u= await user.save();
  return res.status(200).json({ success: true, message: "user updated",user:u });
});
//  get my profile
const getMyProfile = errorHandler(async (req, res, next) => {
  const _id = req._id;
  const user = await User.findById(_id);
  if (!user) {
    return next(new customError("user not found", 404));
  } else {
    return res
      .status(200)
      .json({ success: true, message: "user profile", user });
  }
});
// user logout
const logOut = errorHandler(async (req, res, next) => {
  return res
    .status(200)
    .cookie("chat2", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "User Logged out",
    });
});
// search user
const searchUser = errorHandler(async (req, res, next) => {
  const _id = req._id;
  const { name = "" } = req.query;
  console.log("name", name);

  const myChat = await Chat.find({ groupChat: false, members: _id });
  // console.log("Mychat", myChat);
  const a = myChat.map((chat) => chat.members).flat();
  // console.log("a",a)
  const userExceptMe = await User.find({
    _id: { $nin: a },
    name: { $regex: name, $options: "i" },
  });
  // console.log("userExceptMe", userExceptMe);
  const user = userExceptMe.map((u) => ({
    _id: u._id,
    name: u.name,
    avatar: u.avatar.url,
  }));

  const msg = user.length > 0 ? "users profiles" : "no users found";
  return res.status(200).json({ success: true, message: msg, user });
});
// send friend request ttt
const sendFriendRequest = errorHandler(async (req, res, next) => {
  const _uid = req._id;
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    return next(new customError("user not found", 404));
  }
  const request = await Request.findOne({
    $or: [
      { sender: _uid, receiver: userId },
      { sender: userId, receiver: _uid },
    ],
  });
  if (request) {
    // return res.status(200).json({ success: true, message: "request already sent" });
    return next(new customError("request already sent", 400));
  }

  const newRequest = await Request.create({ sender: _uid, receiver: userId });
  emitEvent(req, NEW_REQUEST, [userId], [userId]);
  return res.status(200).json({ success: true, message: "request sent" });
});

// accept friend request
const acceptRequest = errorHandler(async (req, res, next) => {
  const _uid = req._id;
  const { requestId, accept } = req.body;
  const request = await Request.findById(requestId)
    .populate({ path: "sender", select: "name " })
    .populate({ path: "receiver", select: "name " });
  if (!request) {
    return next(new customError("request not found", 404));
  }
  if (request.receiver._id.toString() !== _uid.toString()) {
    return next(
      new customError("you are not allowed to accept this request", 403)
    );
  }

  if (!accept) {
    await request.deleteOne();
    return res.status(200).json({ success: true, message: "request rejected" });
  } else {
    const members = [request.sender._id, request.receiver._id];
    await Promise.all([
      Chat.create({
        members,
        groupChat: false,
        name: `${request.sender.name} - ${request.receiver.name}`,
      }),
      request.deleteOne(),
    ]);
    emitEvent(req, REFETCH_CHAT, members);
    return res.status(200).json({
      success: true,
      message: "request accepted",
      senderId: request.sender._id,
      receiverId: request.receiver._id,
    });
  }
});
// get notificationn
const getNotification = errorHandler(async (req, res, next) => {
  console.log("get notification");
  const _uid = req._id;
  const request = await Request.find({ receiver: _uid }).populate({
    path: "sender",
    select: "name avatar",
  });
  if (!request) {
    return next(new customError("no request found", 404));
  }
  const newRequest = request.map((r) => {
    return {
      _id: r._id,
      sender: {
        _id: r.sender._id,
        name: r.sender.name,
        avatar: r.sender.avatar.url,
      },
    };
  });
  return res.status(200).json({
    success: true,
    message: "new request",
    allRequest: newRequest,
  });
});

// get my friendsss
const getMyFriends = errorHandler(async (req, res, next) => {
  const _uid = req._id;
  const chatId = req.query.chatId;
  console.log("chchchck", chatId);
  const chat = await Chat.find({ members: _uid, groupChat: false }).populate({
    path: "members",
    select: "name avatar",
  });

  const friends = chat.map((c) => {
    const otherMembers = getOtherMembers(c.members, _uid);
    // console.log("otherMembers",otherMembers);
    return {
      _id: otherMembers[0]._id,
      name: otherMembers[0].name,
      avatar: otherMembers[0].avatar.url,
    };
  });
  // console.log("req",req.query.chatId)
  if (chatId) {
    const chat = await Chat.findById(chatId);
    const availableFriends = friends.filter((friend) => {
      if (!chat.members.includes(friend._id)) {
        return friend;
      }
    });
    // console.log("availableFriends",availableFriends);
    return res.status(200).json({
      success: true,
      message: "available friends",
      friends: availableFriends,
    });
  } else {
    return res.status(200).json({
      success: true,
      message: "my friends",
      friends,
    });
  }
});
export {
  newUser,
  login,
  getMyProfile,
  searchUser,
  sendFriendRequest,
  acceptRequest,
  logOut,
  getNotification,
  getMyFriends,
  updateProfile
};

import Message from "../models/message.js";

import User from "../models/user.js";
import customError from "../utils/errorClass.js";
import { errorHandler } from "../middlewares/error.js";
import jwt from "jsonwebtoken";
import Chat from "../models/chat.js";
// admin login controller
const adminLogin = errorHandler(async (req, res, next) => {
  const adminSecretKey = process.env.ADMIN_SECRET_KEY || "annayat";
  const { secretKey } = req.body;
  const isMatch = secretKey === adminSecretKey;
  if (!isMatch) {
    return next(new customError("invalid admin key", 401));
  } else {
    const token = jwt.sign(secretKey, process.env.JWT_SECRET);
    res
      .status(200)
      .cookie("adminToken", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
      })
      .json({
        success: true,
        message: "admin login successfully",
      });
  }
});
const getAllUsers = errorHandler(async (req, res,next) => {
  const users = await User.find();
  const transFormUser = await Promise.all(
    users.map(async ({ _id, name, avatar,userName,updatedAt }) => {
      const [groups, friends] = await Promise.all([
        Chat.find({ members: _id, groupChat: true }).countDocuments(),
        Chat.find({ members: _id, groupChat: false }).countDocuments(),
      ]);
      return {
        _id,
        name,
        avatar: avatar.url,
        groups: groups,
        friends: friends,
        userName,
        updatedAt
      };
    })
  );
  // console.log("transFormUser",transFormUser)
  res
    .status(200)
    .json({ success: true, message: "all users", users: transFormUser });
});
const getAllChat = errorHandler(async (req, res) => {
  const chats = await Chat.find()
    .populate("members", "name avatar")
    .populate("creater", "name avatar");

  //   for frontend chat tableeeeeeeeeeeeeeeeeeeeeeeee
  const transformChat = await Promise.all(
    chats.map(async ({ members, creater, groupChat, _id, name }) => {
      const totalMessages = await Message.countDocuments({ chat: _id });
      return {
        _id,
        name,
        groupChat,
        avatar: members.slice(0, 3).map((m) => m.avatar.url),
        members: members.map((member) => {
          return {
            _id: member._id,
            name: member.name,
            avatar: member.avatar.url,
          };
        }),
        creater: {
          _id: creater ? creater._id : "none",
          name: creater ? creater.name : "none",
          avatar: creater ? creater.avatar.url : " ",
        },
        totalMembers: members.length,
        totalMessages,
      };
    })
  );
  console.log(transformChat, "transformedChat");
  res
    .status(200)
    .json({ success: true, message: "all chats", chats: transformChat });
});
const getAllMessages = errorHandler(async (req, res) => {
  const messages = await Message.find()
    .populate("sender", "name avatar")
    .populate("chat", "groupChat");
    // console.log(messages,"messages")
     const transformedMessages = messages.map(
    ({ content, attachments, _id, sender, createdAt, chat }) => {
      console.log(_id,sender,chat)
      return {
      
        _id,
        attachments,
        content,
        createdAt,
        chat: chat._id,
        groupChat: chat.groupChat,
        sender: {
          _id: sender._id,
          name: sender.name,
          avatar: sender.avatar.url,
        },
      }
    }
  );
  console.log("transformedMessages",transformedMessages,"messages")
  res
    .status(200)
    .json({
      success: true,
      message: "all messages",
      messages: transformedMessages,
    });
});

const getDashboardStats = errorHandler(async (req, res) => {
  const [groupsCounts, userCounts, messagesCounts, totalChatsCount] =
    await Promise.all([
      Chat.countDocuments({ groupChat: true }),
      User.countDocuments(),
      Message.countDocuments(),
      Chat.countDocuments(),
    ]);
  const today = new Date();
  const last7Days = new Date();
  last7Days.setDate(today.getDate() - 7);
  const last7DaysMsg = await Message.find({
    createdAt: { $gte: last7Days, $lte: today },
  });
  const msg = Array(7).fill(0);
  last7DaysMsg.forEach((message) => {
    const indexApproch = Math.floor(
      (today.getTime() - message.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    msg[6 - indexApproch]++;
  });
  const stats = {
    groupsCounts,
    userCounts,
    messagesCounts,
    totalChatsCount,
  };
  console.log("stats", stats);
  res.status(200).json({
    success: true,
    message: "dashboard stats",
    stats,
    msg,
  });
});
const adminLogOut = errorHandler(async (req, res, next) => {
  return res
    .status(200)
    .cookie("adminToken", "", {
      httpOnly: true,
      maxAge: 0,
      sameSite: "none",
      secure: true,
    })
    .json({
      success: true,
      message: "admin logout successfully",
    });
});

const getAdmindata = errorHandler(async (req, res, next) => {
  return res.status(200).json({
    success: true,
    message: "admin exist",
    admin: true,
  });
});
export {
  adminLogin,
  getAllUsers,
  getAllChat,
  getAllMessages,
  getDashboardStats,
  adminLogOut,
  getAdmindata,
};

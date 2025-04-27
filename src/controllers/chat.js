import { errorHandler } from "../middlewares/error.js";
import Chat from "../models/chat.js";
import Message from "../models/message.js";
import customError from "../utils/errorClass.js";
import emitEvent from "../utils/emitFunc.js";
import { ALERT, NEW_MESSAGE, REFETCH_CHAT,NEW_MESSAGE_ALERT } from "../constants/events.js";
import { getOtherMembers } from "../lib/helper.js";
import User from "../models/user.js";
import deleteFileFromCloudnary from "../utils/deleteFileFromCloudnary.js";
import uploadFilesToCloudinary from "../utils/uploadFileToCloudnary.js";
import { group } from "console";

// create new groupppppppppp
const newGroup = errorHandler(async (req, res, next) => {
  const _uid = req._id;
  const { name, members } = req.body;
  console.log("members",members)
  const allMembers = [...members, _uid];

  const chat=await Chat.create({
    name,
    groupChat: true,
    creater:_uid,
    members: allMembers,
  });
  if(!chat){
    return next(new customError("group not created",500));
  }
  emitEvent(req, ALERT, allMembers, {message:`Welcome to ${name} group`,chat:chat._id});
  emitEvent(req, REFETCH_CHAT, members);

  return res.status(201).json({
    success: true,
    message: "Group Created",
  });
 
});
// get all my chat ttttttttttttttttttttttttttttttttttttttt
const getMyChat = errorHandler(async (req, res, next) => {
  const _uid = req._id;
  const chats = await Chat.find({ members: _uid }).populate(
    "members",
    "name avatar"
  );
  const transformedChat = chats.map(({ _id, members, name, groupChat }) => {
    const otherMembers = getOtherMembers(members, _uid);
    return {
      _id,
      groupChat,
      name: groupChat ? name : otherMembers[0].name,
      avatar: groupChat
        ? members.slice(0, 3).map(({ avatar }) => avatar.url)
        : [otherMembers[0].avatar.url],
      members: otherMembers.map((m) => m._id),
    };
  });
  return res.status(200).json({
    success: true,
    message: "my chat",
    chats: transformedChat,
  });
});

// get my grouppppppppppppppppp
const getMyGroup = errorHandler(async (req, res, next) => {
  const _iid = req._id;
  const chats = await Chat.find({
    members: _iid,
    groupChat: true,
    creater:_iid
  }).populate("members", "name avatar")
  // console.log("chats",chats)
  const groups = chats.map(({ _id, name, members,groupChat }) => {
    return {
      _id,
      name,
      groupChat,
      avatar: members.slice(0, 3).map(({ avatar }) => avatar.url)
    };
  });
  return res.status(200).json({
    success: true,
    message: "my group", 
    groups
  });
});

// add new membersssssssssssssssss

const addMembers = errorHandler(async (req, res, next) => {
  const _uid = req._id;
  const { chatId, members } = req.body;
  console.log("members", members);
  console.log("chatId", chatId);
  const chat = await Chat.findById(chatId);
  console.log("chat", chat.groupChat);

  if (!chat) {
    console.log("chat not found");
    return next(new customError("chat not found", 404));
  }
  if (chat.groupChat == false) {
    console.log("not group chat");
    return next(new customError("you can not add members to this chat", 403));
  }
  if (chat.creater.toString() !== _uid.toString()) {
    return next(new customError("you are not allowed to add members", 403));
  }
  if (members.length < 1) {
    return next(new customError("please provide at least one member", 400));
  }

  const allNewMemberPromise = members.map((i) => User.findById(i, "name"));
  const allNewMembers = await Promise.all(allNewMemberPromise);
  // chat.members.
  console.log("allNewMembers", allNewMembers);
  const m = chat.members;

  chat?.members.push(
    ...allNewMembers.reduce((prev, cur) => {
      if (!m.includes(cur._id)) {
        prev.push(cur._id);
      } else {
        return next(new customError("member already exist", 400));
      }
      return prev;
    }, [])
  );

  if (chat.members.length > 100) {
    return next(
      new customError("group chat can not have more than 100 members", 400)
    );
  }
  await chat.save();
  const allNewMembersName = allNewMembers.map((m) => m.name);
  emitEvent(
    req,
    ALERT,
    chat.members,
    {message:`${allNewMembersName.join(",")} added to the group chat`,chat:chat._id}
  );
  emitEvent(req, REFETCH_CHAT, chat.members,`you has been added to the ${chat.name}`  );
  return res.status(201).json({
    success: true,
    message: "members added successfully",
    chat,
  });
});

// remove membersssss
const removeMember = errorHandler(async (req, res, next) => {
  const _uid = req._id;
  const { userId, chatId } = req.body;            
  console.log("chatId", chatId);                                                                                
  const chat = await Chat.findById(chatId);
  const userThatWillBeRemoved = await User.findById(userId);
  console.log("userThatWillBeRemoved", userThatWillBeRemoved);
  console.log("chat", chat);
  if (!userThatWillBeRemoved) {
    return next(new customError("user not found", 404));
  }
  if (!chat) {
    return next(new customError("chat not found", 404));
  }
  if (!chat.groupChat) {
    return next(
      new customError("you can not remove member from this chat", 403)
    );
  }
  if (chat.creater.toString() !== _uid.toString()) {
    return next(new customError("you are not allowed to remove member", 403));
  }
  if (chat.members.length <= 3) {
    return next(
      new customError("group chat must have at least 3 members", 400)
    );
  }
  const allMembers=chat.members;
  chat.members = chat.members.reduce((prev, cur) => {
    if (cur.toString() !== userId.toString()) {
      prev.push(cur);
    }
    return prev;
  }, []);
  
  await chat.save();
  emitEvent(
    req,
    ALERT,
    chat.members,
    {message:`${userThatWillBeRemoved.name} has been removed from the ${chat.name}`,chat:chat._id}
  );
  emitEvent(req, REFETCH_CHAT, allMembers,`you has been removed from the ${chat.name}`);
  return res.status(200).json({
    success: true,
    message: "member removed successfully",
    chat,
  });
});

// leave group
const leaveGroup = errorHandler(async (req, res, next) => {
  const _uid = req._id;
  const chatId = req.params.id;
  const chat=await Chat.findById(chatId);
  console.log("chat", chat);
  
  if (!chat) {
    return next(new customError("chat not found", 404));
  }
  if (!chat.groupChat) {
    return next(
      new customError(
        "you can not leave this chat cause it is not group chat",
        403
      )
    );
  }

  const remainMembers = chat.members.reduce((prev, cur) => {
    if (cur.toString() !== _uid.toString()) {
      prev.push(cur);
    }
    return prev;
  }, []);
  if(remainMembers.length < 3){
    return next(new customError("group chat must have at least 3 members",400));
  }
  if (chat.creater.toString() === _uid.toString()) {
    const random = Math.floor(Math.random() * remainMembers.length);
    const newCreater = remainMembers[random];
    chat.creater = newCreater;
    chat.members = remainMembers;
    await chat.save();
  } else {
    chat.members = remainMembers;
    await chat.save();
  }
  const user = await User.findById(_uid,"name");
  emitEvent(req, ALERT, chat.members, {message:`${user.name} has left the ${chat.name}`,chat:chat._id});
  emitEvent(req, REFETCH_CHAT, chat.members);
  return res.status(200).json({
    success: true,
    message: `you have left the ${chat.name}`,
    chat,
  });
});
// send attachmentssssssssss
const sendAttachment = errorHandler(async (req, res, next) => {
  const {chatId}=req.body;
  const _uid=req._id
  const files=req.files || [];
  // console.log("files",files);
  if(files.length < 1){
    return next(new customError("please upload attachments",400));

  }
  if(files.length > 5 ) {
    return next(new customError("you can not upload more than 5 attachments",400));
  }
  // const [chat,me]=await Promise.all(Chat.findById(chatId),User.findById(_uid).select("name"));
  const chat=await Chat.findById(chatId);
  const me=await User.findById(_uid).select("name");
  // console.log(chat,me);
  if(!chat){
    return next(new customError("chat not found",404));
  }
  if(!me){
    return next(new customError("user not found",404));
  }
  if (files.length < 1)
    return next(new customError("Please provide attachments", 400));

  // upload file here 
  const attachments = await uploadFilesToCloudinary(files);
  console.log("attachments",attachments);
  //message for db
  const messageForDB={
    content:"",
    attachments,
    sender:me._id,
    chat:chatId
  }
  // message for real time 
  const messageForRealTime={
    ...messageForDB,
    sender:{
      _id:me._id,
      name:me.name
    }
  }
  const message = await Message.create(messageForDB);
  // console.log("message",message)
  emitEvent(req,NEW_MESSAGE,chat.members,{message:messageForRealTime,chat:chatId});
  emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });
  return res.status(200).json({
    success: true,
    message
  });
  
  
 
});

//  get chat detailss
const getChatDetails = errorHandler(async (req, res, next) => {
  const chatId = req.params.id;
  console.log("chatid", chatId);
  if (req.query.populate === "true") {
    
    const chat = await Chat.findById(chatId)
      .populate("members", "name avatar")
      .lean();
    if (!chat) {
      return next(new customError("chat not found", 404));
    }
    const m = chat.members.map((m) => {
      return {
        _id: m._id,
        name: m.name,
        avatar: m.avatar.url,
      };
    });
    return res.status(200).json({
      success: true,
      message: "chat details",
      chat: { ...chat, members: m },
    });
  } else {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return next(new customError("chat not found", 404));
    }
    return res.status(200).json({
      success: true,
      message: "chat details",
      chat,
    });
  }
});

//rename group
const renameGroup = errorHandler(async (req, res, next) => {
  const _uid = req._id;
  const chatId = req.params.id;
  const { name } = req.body;
  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new customError("chat not found", 404));
  }
  if (!chat.groupChat) {
    return next(new customError("you can not rename this chat", 403));
  }
  if (chat.creater.toString() !== _uid.toString()) {
    return next(
      new customError("you are not allowed to rename this chat", 403)
    );
  }
  chat.name = name;
  await chat.save();
  emitEvent(req, REFETCH_CHAT, chat.members);
  return res.status(200).json({
    success: true,
    message: "chat renamed successfully",
    chat,
  });
});
//delete chat
const deleteChat = errorHandler(async (req, res, next) => {
  const _uid = req._id;
  const chatId = req.params.id;
  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new customError("chat not found", 404));
  }
  if (chat.groupChat && chat.creater.toString() !== _uid.toString()) {
    return next(
      new customError("you are not allowed to delete this chat", 403)
    );
  }
  if (!chat.groupChat && !chat.members.includes(_uid)) {
    return next(
      new customError("you are not allowed to delete this chat", 403)
    );
  }

  // here we have to delete all messages as well as attachments and files from cloudinaryyyy
  const message = await Message.find({
    chat: chatId,
    attachments: { $exists: true, $ne: [] },
  });
  const public_ids = [];
  message.map(({ attachments }) => {
    attachments.forEach(({ public_id }) => {
      public_ids.push(public_id);
    });
  });
  const groupChat=chat.groupChat;
  const members = chat.members;
  const chatName = chat.name;
  await Promise.all([
    deleteFileFromCloudnary(public_ids),
    chat.deleteOne(),
    Message.deleteMany({ chat: chatId }),
  ]);
  emitEvent(req, REFETCH_CHAT, members,groupChat ? `you are not longer member of ${chatName} ` : `chat has been deleted`);
  return res.status(200).json({
    success: true,
    message: "chat deleted successfully",
  });
});
//get messages
const getMessages = errorHandler(async (req, res, next) => {
  const _uid = req._id;
  const chatId = req.params.id;
  const { page = 1 } = req.query;
  const limit = 20;
  const skip = (page - 1) * limit;
  const chat=await Chat.findById(chatId);
  if(!chat){
    return next(new customError("chat not found",404));
  }
  if(!chat.members.includes(_uid)){
    return next(new customError("you are not allowed to see messages of this chat",403));
  }
  const message=await Message.find({chat:chatId}).sort({createdAt: -1}).populate("sender","name avatar").limit(limit).skip(skip);
  const total=await Message.countDocuments({chat:chatId});
  
  // const [message, total] = await Promise.all(
  //   Message.find({ chat: chatId })
  //     .sort({ createdAt: -1 })
  //     .limit(limit)
  //     .skip(skip)
  //     .populate("sender", "name"),
  //   Message.countDocuments({ chat: chatId })
  // );
  // console.log("message", message);
  // console.log("total", total)
  if (message.length < 1) {
    return res.status(200).json({
      success: true,
      message: "no message found",
      totalPage: 0,
    });
  }

  const totalPage = Math.ceil(total / limit) ?? 0;

  return res.status(200).json({
    success: true,
    messages:message.reverse(),
    totalPages:totalPage,
  });
});

//export all the function
const abc=(req,res,next)=>{
  return res.status(200).json({
    success:true,
    message:"abc"
  })
}
export {
  newGroup,
  getMyChat,
  getMyGroup,
  addMembers,
  removeMember,
  leaveGroup,
  sendAttachment,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessages,
  abc
};

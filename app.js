import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import Message from "./src/models/message.js";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import userRoute from "./src/routes/user.js";
import adminRoute from "./src/routes/admin.js";
import chatRoute from "./src/routes/chat.js";
import connectDB from "./src/utils/connectDB.js";
import { errorMiddleware } from "./src/middlewares/error.js";
import { createUser } from "./src/seeders/user.js";
import { createGroupChat, createSingleChat } from "./src/seeders/chat.js";
import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
import { IS_ONLINE, NEW_MESSAGE, NEW_MESSAGE_ALERT, START_TYPING, STOP_TYPING } from "./src/constants/events.js";
import { getSockets } from "./src/utils/getSockets.js";
import { v2 as cloudinary } from "cloudinary";
import socketAuth from "./src/middlewares/socketAuth.js";
import Chat from "./src/models/chat.js";
const corsOptions = {
  origin: ["http://localhost:5173",process.env.CLIENT_URL],
  credentials: true,
};
// usersocketIdsss
const userSocketIds = new Map();
// appp
const app = express();

// http server
const httpServer = createServer(app);
// socket io
const io = new Server(httpServer, {
  cors: corsOptions,
});
app.set("io",io);

// createUser(9)
// createGroupChat(5);
// createSingleChat();
// database connection
connectDB();
// cloudinary setuppp
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// socket middlewaree
io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res, async (err) => {
   return  await socketAuth(err,socket,next);
  });
});
// socket io
io.on("connection", async(socket) => {
    // console.log(socket.user);
  const user = socket.user;
  userSocketIds.set(user._id.toString(), socket.id);
  // console.log("A User Connected with id", socket.id);

  const userFriend = await Chat.find({members:{$in:[user._id]},groupChat:false})
  const allMembers=userFriend.map((u)=>u.members).flat();
  const friends=allMembers.filter((f)=>f.toString()!==user._id.toString());
  friends.push(user._id)
  
  const onlineFriends=[];
  const onlineFriendsSockets=[];
  friends.forEach((f)=>{
    if(userSocketIds.get(f.toString()))
    {
      onlineFriends.push(f);
      onlineFriendsSockets.push(userSocketIds.get(f.toString()));
    }
  });
  // console.log("onlinefriendssockets",onlineFriendsSockets)
  io.to([...onlineFriendsSockets]).emit(IS_ONLINE,{user:onlineFriends})



  // NEW_MESSAGE EVENT EMITTER
  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForRealTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: chatId,
    };
    const messageForDB = {
      content: message,
      sender: user._id,
      chat: chatId,
    };
    
    // console.log("emitting realtime message",messageForRealTime);
    const membersSockets = getSockets(members);

    // console.log("membersSockets",membersSockets);
    io.to(membersSockets).emit(NEW_MESSAGE, {
      chat: chatId,
      message: messageForRealTime,
    });
    io.to(membersSockets).emit(NEW_MESSAGE_ALERT, { chatId ,message:`${user.name} sent a message`});
    try {
        await Message.create(messageForDB);
      } catch (error) {
        throw new Error(error);
      }
    // console.log("new message");
  });
  // START_TYPING event emitter 
  socket.on(START_TYPING,({members,chatId})=>{
    // console.log("typing",members,chatId);
    const membersSockets=getSockets(members);
    io.to(membersSockets).emit(START_TYPING,{chatId});
    
  })
  // STOP_TYPING event emitter 
  socket.on(STOP_TYPING,({members,chatId})=>{
    // console.log("typing",members,chatId);
    const membersSockets=getSockets(members);
    io.to(membersSockets).emit(STOP_TYPING,{chatId});

  })
  socket.on("disconnect",async () => {
    userSocketIds.delete(user._id.toString());
    const userFriend = await Chat.find({members:{$in:[user._id]},groupChat:false})
    const allMembers=userFriend.map((u)=>u.members).flat();
    const friends=allMembers.filter((f)=>f.toString()!==user._id.toString());
    friends.push(user._id)
    const onlineFriends=[];
    const onlineFriendsSockets=[];
    friends.forEach((f)=>{
      if(userSocketIds.get(f.toString()))
      {
        onlineFriends.push(f);
        onlineFriendsSockets.push(userSocketIds.get(f.toString()));
      }
    });
    // console.log("online friendss",onlineFriends,onlineFriendsSockets)
    io.to(onlineFriendsSockets).emit(IS_ONLINE,{user:onlineFriends})
    // console.log("user disconnected");
  });
});
// middlewaressss

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/chat", chatRoute);
app.use(errorMiddleware);

httpServer.listen(process.env.PORT || 3000, () => {
  console.log(
    `server successfully on ${process.env.PORT || 3000} in ${
      process.env.NODE_ENV
    } mode`
  );
});
// await Message.deleteMany(  );
// console.log(process.env.NODE_ENV,"dkjfkd");
export { userSocketIds };

import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { attachmentsMulter } from "../middlewares/multter.js";
import {
  getMyChat,
  newGroup,
  getMyGroup,
  addMembers,
  removeMember,
  leaveGroup,
  getMessages,
  getChatDetails,
  renameGroup,
  deleteChat,
  sendAttachment as sendAttachmets,
  abc,
} from "../controllers/chat.js";
import {
  addMemberValidator,
  attachmentsValidator,
  chatIdValidator,
  leaveGroupValidator,
  newGroupValidator,
  removeMemberValidator,
  renameGroupValidator,
  validate,
} from "../lib/validator.js";
const app = express.Router();

// authentication require user to access the routes
app.use(isAuthenticated);

app.post("/new", newGroupValidator(), validate, newGroup);
app.get("/mychat", getMyChat);
app.get("/mygroup", getMyGroup);

// add member
app.put("/addmember", addMemberValidator(), validate, addMembers);

// remove member
app.delete("/removemember", removeMemberValidator(), validate, removeMember);
// send attachments
app.post(
  "/message",
  attachmentsMulter,
  attachmentsValidator(),
  validate,
  sendAttachmets
);
// leave group
app.delete("/leave/:id", leaveGroupValidator(), validate, leaveGroup);
// get chatdetail , rename, delete
app.get("/:id", chatIdValidator(), validate, getChatDetails);
app.put("/:id", renameGroupValidator(), validate, renameGroup);
app.delete("/:id", chatIdValidator(), validate, deleteChat);
// app.route("/:id").get(chatIdValidator(),validate,getChatDetails).put(renameGroupValidator(),validate,renameGroup).delete(chatIdValidator(),validate,deleteChat);
//get messages
app.get("/messages/:id", getMessages);

export default app;

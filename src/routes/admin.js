import express from 'express'
import { adminLogin,adminLogOut,getAdmindata,getAllChat,getAllMessages,getAllUsers,getDashboardStats } from '../controllers/admin.js';
import { validate,adminValidator } from '../lib/validator.js';
import { isAdmin } from '../middlewares/auth.js';

const app=express.Router();

app.post("/verify",adminValidator(),validate,adminLogin)
app.get("/logout",adminLogOut)

app.get('/',isAdmin,getAdmindata)
app.get('/users',isAdmin,getAllUsers)
app.get('/message',isAdmin,getAllMessages)
app.get('/chats',isAdmin,getAllChat)

app.get('/stats',getDashboardStats)




export default app;
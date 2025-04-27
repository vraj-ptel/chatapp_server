import customError from "../utils/errorClass.js";
import { errorHandler } from "./error.js";
import jwt from "jsonwebtoken"

export const isAuthenticated=errorHandler(async(req,res,next)=>{
    const cookie=req.cookies["chat2"];
    // console.log(cookie);
    if(!cookie){
        return next(new customError("not authenticated",401))
    }
    const decodedData=jwt.verify(cookie,process.env.JWT_SECRET);
    req._id=decodedData._id;
    next()
})

export const isAdmin = errorHandler(
    async (req, res, next) => {
      const token = req.cookies["adminToken"];
      if (!token) {
        return next(
          new customError("Not Authenticated,only admin can login", 401)
        );
      }
  
      const adminId = jwt.verify(token, process.env.JWT_SECRET);
      console.log("adminId",adminId);
      const adminSecretKey = process.env.ADMIN_SECRET_KEY || " ";
      const isMatch = adminId === adminSecretKey;
  
      if (isMatch) {
        return next();
      }
  
      return res.status(401).json({
        success: false,
        message: "Not Authenticated,wrong admin key",
      });
    }
  );
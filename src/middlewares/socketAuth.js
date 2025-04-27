import User from "../models/user.js";
import customError from "../utils/errorClass.js"
import jwt from "jsonwebtoken"

const socketAuth =async(err,socket,next)=>{
    try {
        if(err){
            return next(err);
        }
        const authToken=socket.request.cookies["chat2"];
        if(!authToken){
            return next(new customError("not authenticated",401))
        }
        const decodedData= jwt.verify(authToken,process.env.JWT_SECRET);
        const _id=decodedData._id;
        const user = await User.findById(_id);
        if(!user){
            return next(new customError("user not found",404));
        }
        socket.user=user;
        return next();
    } catch (error) {
            console.log(error);
            return next(new customError("login to acces this route",401))
    }
}
export default socketAuth
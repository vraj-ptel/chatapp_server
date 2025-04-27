import {userSocketIds} from "../.././app.js"
const emitEvent=(req,event,members,msg)=>{
    const socketIds=members.map((m)=>userSocketIds.get(m.toString()));
    console.log("socketIds",socketIds)
    const io=req.app.get("io");
    io.to(socketIds).emit(event,msg);
    console.log("emit func",event,members);
}
export default emitEvent;
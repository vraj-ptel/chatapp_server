import { userSocketIds } from "../../app.js"
export const getSockets=(users=[])=>{
    console.log(userSocketIds);
    const sockets=users.map((user)=>{
    
        return userSocketIds.get(user.toString());
    });
    
    return sockets;
}
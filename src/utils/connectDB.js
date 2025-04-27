import mongoose from "mongoose";

const connectedObject={}
const connectDB=async()=>{
    if(connectedObject.isConnected){
        console.log("already connected");
        return;
    }


    try {
      const db =  await mongoose.connect(process.env.MONGO_URI || "",{dbName:"annayat"})
      connectedObject.isConnected=db.connections[0].readyState;
      console.log("connected to database successfully", db.connection.host);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

export default connectDB;
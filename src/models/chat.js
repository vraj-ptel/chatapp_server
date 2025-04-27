import mongoose, {
    Schema,
    Types,
  } from "mongoose";
  
  

const chatShema = new Schema(
    {
      name: {
        type: String,
        required: true,
      },
      groupChat: {
        type: Boolean,
        default: false,
      },
      creater: {
        type: Types.ObjectId,
        ref: "User",
      },
      members: [
        {
          type: Types.ObjectId,
          ref: "User",
        },
      ],
    },
    {
      timestamps: true,
    }
  );
   const Chat= (mongoose.models.Chat ) || mongoose.model("Chat", chatShema);
  
  export default Chat ;
  
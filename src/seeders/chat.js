import { faker } from "@faker-js/faker";
import User from "../models/user.js";
import Chat from "../models/chat.js";
const createSingleChat = async () => {
  try {
    await Chat.deleteMany();
    const user = await User.find();
    const chatPromices = [];
    for(let i=0;i<user.length;i++){
      console.log(user[i].name)
    }
    for (let i = 0; i < user.length; i++) {
      for (let j = i + 1; j < user.length; j++) {
        chatPromices.push(
          Chat.create({
            name: `${user[i].name} - ${user[j].name}`,
            members: [user[i]._id, user[j]._id],
          })
        );
      }
    }
    await Promise.all(chatPromices);
    console.log("chat created");
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
const createGroupChat=async(num)=>{
    try{
        
        const user = await User.find();
        const chatPromices = [];
        for(let i=0;i<num;i++){
            const members=[];
            for( let i=0;i<3;i++){
                const rIndex=Math.floor(Math.random()*user.length);
                members.push(user[rIndex]._id);
            }
            chatPromices.push({
                name:faker.lorem.words(2),
                groupChat:true,
                members,
                creater:members[0]
            })
        }
        await Chat.create(chatPromices);
        console.log("group chat created");
        process.exit(0);
    }catch(err){
        console.log(err);
        process.exit(1);
    }
}
const createMessages = async (numMessages) => {
    try {
      const users = await User.find().select("_id");
      const chats = await Chat.find().select("_id");
  
      const messagesPromise = [];
  
      for (let i = 0; i < numMessages; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomChat = chats[Math.floor(Math.random() * chats.length)];
  
        messagesPromise.push(
          Message.create({
            chat: randomChat,
            sender: randomUser,
            content: faker.lorem.sentence(),
          })
        );
      }
  
      await Promise.all(messagesPromise);
  
      console.log("Messages created successfully");
      process.exit();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  };
  
  const createMessagesInAChat = async (chatId, numMessages) => {
    try {
      const users = await User.find().select("_id");
  
      const messagesPromise = [];
  
      for (let i = 0; i < numMessages; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
  
        messagesPromise.push(
          Message.create({
            chat: chatId,
            sender: randomUser,
            content: faker.lorem.sentence(),
          })
        );
      }
  
      await Promise.all(messagesPromise);
  
      console.log("Messages created successfully");
      process.exit();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  };
export { createSingleChat ,createGroupChat,createMessages,createMessagesInAChat};
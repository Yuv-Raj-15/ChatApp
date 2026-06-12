const mongoose=require('mongoose');
const chatSchema=new mongoose.Schema({
    chatroom:String,
    chats:[{
        receiver:String,
        txt:String
    }]
})

const chatHistory=mongoose.model("chatsHistory",chatSchema);
module.exports=chatHistory;
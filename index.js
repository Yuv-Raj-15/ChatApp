require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const User=require('./models/userdb');
const Chat=require('./models/chatdb');
const Userdata=require('./models/userdata');
const figlet=require('figlet');
const http=require('http');
const {Server}=require('socket.io');
const app=express();
const server=http.createServer(app)
const io=new Server(server);
mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.get("/",(req,res)=>{
    figlet ("Welcome",(err,data)=>{
        figlet("Let's Chat",(err2,data2)=>{
            let txt=data+"\n"+data2;
            res.render("home.ejs",{txt});
        })
    });
    
})


app.post("/p2p",async(req,res)=>{
    const user1=req.body.user1;
    const user2=req.body.user2;
    let snname=await User.findOne({ _id: user2 });
    let rnname=await User.findOne({ _id: user1 });
    console.log(snname);
    console.log(rnname);
    let friendCheck1=await Userdata.findOne({
        name:snname.name
    });
    let friendCheck2=await Userdata.findOne({
        name:rnname.name
    });
    let check1=friendCheck1.friends.find(
        f=>f.name===rnname.name
    );
    let check2=friendCheck2.friends.find(
        f=>f.name===snname.name
    );
    if (check1==null) {
        friendCheck1.friends.push({
            name:rnname.name,
            name_id:rnname._id
        });
        await friendCheck1.save();
    }
    if (check2==null) {
        friendCheck2.friends.push({
            name:snname.name,
            name_id:snname._id
        });
        await friendCheck2.save();
    }
    const room=[user1,user2].sort().join("_");
    let exist= await Chat.findOne({chatroom:room});
    if(exist==null) await Chat.create({
        chatroom:room,
        chat:[
            {
            receiver:"",
            txt:""
        }
        ]
    })
    let chatHistory=await Chat.findOne({chatroom:room});
    let allfUser=await Userdata.findOne({name:snname.name});
    if (!allfUser.friends) {
        allfUser.friends = [];
    }
    res.render("p2p.ejs",{chatHistory,snname,rnname,allfUser});
});

app.post("/chats",async(req,res)=>{
    let userName=req.body.userName;
    let exist= await User.findOne({name:userName});
    if(exist==null){
            await User.create({
            name:userName,
            email:req.body.email
        });
        await Userdata.create({
            name:userName,
            friends:[]
        });

    }
    let me=await User.findOne({name:userName});

    let allfUser=await Userdata.findOne({name:me.name});
    res.render("chatsec.ejs",{allfUser,me});

})


app.get('/search-user', async (req, res) => {
    let name=req.query.name;
    let users=await User.findOne({
        name:name,
    });

    res.json(users);
});



io.on("connection",(socket)=>{
    socket.on("join-room",async(roomId)=>{
        socket.join(roomId);
        let history=await Chat.findOne({chatroom:roomId});
        if(history==null) await Chat.create({
            chatroom:roomId,
            chats:[
                {
                    receiver:"",
                    txt:""
                }
            ]
        })
        console.log(roomId);
    });
    socket.on("send-msg",async(data)=>{
        console.log(data.receiver);
        let history=await Chat.findOne({chatroom:data.room});
        if(history==null) await Chat.create({
            chatroom:data.room,
            chats:[
                {
                    receiver:data.receiver,
                    txt:data.smsg
                }
            ]
        })
        else{
            await Chat.updateOne({chatroom:data.room},{
                $push:{
                    chats:{
                        receiver:data.receiver,
                        txt:data.smsg
                    }
                }
            });
        };
        io.to(data.room).emit("received-msg",{
            msgg:data.smsg,
            receiver:data.receiver
        });
    });
});

server.listen(process.env.PORT || 3000,()=>{
    console.log("Listening");
})
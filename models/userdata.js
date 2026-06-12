const mongoose=require('mongoose');
const userdataSchema=new mongoose.Schema({
    name:String,
    friends:[{
        name:String,
        name_id:String
    }]
});

const userdata=mongoose.model("userdata",userdataSchema);
module.exports=userdata;
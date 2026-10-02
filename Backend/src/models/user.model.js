import mongoose from "mongoose";
const userSchema=mongoose.Schema(
    {
        name:
        {
            type:String,
            required:true,
        },
        username:
        {
            type:String,
            required:true,
        },
        password:
        {
            type:String,
            required:true,
        },
        token:
        {
            type:String,
}});

const User=new mongoose.model("User",userSchema);
export {User};
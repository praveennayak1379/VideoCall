import {User} from "../models/user.model.js";
import httpStatus from "http-status";
import bcrypt,{hash} from "bcrypt";
import crypto from "crypto";

const register=async(req,res)=>
{
    const {name,username,password}=req.body;
    try
    {
        const existingUser=await User.findOne({username});
        if(existingUser)
        {
            return res.status(httpStatus.FOUND).json({message:"User already exists"});
        }
        const hashedPassword=await bcrypt.hash(password,10);
        const newUser=new User({
            name:name,
            username:username,
            password:hashedPassword,
        });
        await newUser.save();
        res.status(httpStatus.CREATED).json({message:"User registered successfully"});
    }
    catch(err)
    {
        res.json({message:`Something went wrong ${err}`});
        console.log(err);
    }
}

const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide all fields" });
    }
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password" });
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.token = token;
        await user.save();
        return res.status(httpStatus.OK).json({ token, message: "User successfully logged in" });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};
export {login,register};
import express from "express";
import mongoose from "mongoose";
import {createServer} from "node:http";
import cors from "cors";
import connectToSocket from "./controllers/socketManager.js";
import dotenv from "dotenv";


dotenv.config();

//user router
import userRoutes from "./routes/users.routes.js";


const app=express();

const server=createServer(app);
const io=connectToSocket(server);

app.set("port",process.env.PORT || 3000);

app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended:true}));

//User Route 
app.use("/users/api",userRoutes);



const start=async()=>
{
    try 
    {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB is connected successfully ");
        server.listen(process.env.PORT,()=>
        {
            console.log(`Server is started on port number 3000`);
        });
        
    }
    catch(error)
    {
        console.log(error);
    }
    
}
start();
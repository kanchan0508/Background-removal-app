import mongoose from "mongoose";

const connectedDB = async () => {
    mongoose.connection.on('connected', ()=>{
        console.log(`Connected to MongoDB Atlas`)
    })

    await mongoose.connect(`${process.env.MONGODB_URI}`)
}

export default connectedDB;
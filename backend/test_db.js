import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    username: String,
});
const User = mongoose.model("User", userSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB successfully!");
        const users = await User.find({}).lean();
        console.log("Total users found:", users.length);
        console.log("Users:", JSON.stringify(users, null, 2));
    } catch (e) {
        console.error("Error connecting to MongoDB:", e);
    } finally {
        await mongoose.disconnect();
    }
}

run();

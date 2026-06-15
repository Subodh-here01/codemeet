import User from "../db/model.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const trimmedUsername = (username || "").trim();
        const user = await User.findOne({ 
            username: { $regex: new RegExp("^" + trimmedUsername + "$", "i") } 
        });

        if (user) {
            if (user.password === password) {
                const token = jwt.sign({
                    id: user._id,
                }, process.env.JWT_SECRET);
                res.cookie("token", token);
                return res.status(200).send({ message: "login success", data: token });
            } else {
                return res.status(401).send("password incorrect");
            }
        } else {
            return res.status(404).send("user not found");
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send("internal server error");
    }
}

export const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout successful' });
}

export const signup = async (req, res) => {
    try {
        const { name, email, username, password } = req.body;

        const trimmedUsername = (username || "").trim();
        const trimmedEmail = (email || "").trim().toLowerCase();

        // Check if username exists
        const u = await User.findOne({ 
            username: { $regex: new RegExp("^" + trimmedUsername + "$", "i") } 
        });

        if (u) {
            return res.status(409).send("Username already exists");
        }

        // Check if email exists
        const e = await User.findOne({ 
            email: { $regex: new RegExp("^" + trimmedEmail + "$", "i") } 
        });

        if (e) {
            return res.status(409).send("Email already exists");
        }

        const user = new User({
            name,
            email: trimmedEmail,
            username: trimmedUsername,
            password,
        });

        await user.save();

        return res.status(201).send({ message: "user registered successfully", data: user });
    } catch (error) {
        console.log(error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(409).send(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`);
        }
        return res.status(500).send("internal server error");
    }
}


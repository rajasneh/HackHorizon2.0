import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();

export const generateTokenAndSetCookie = (user, res) => {

    const payload = {
        email: user.email,
        id: user.id,
        role: user.role,
    }

    try {
        let token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5d" });

        let options = {
            expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),   
            httpOnly: true,
            sameSite: "None",
            secure: true
        }
 
        // Set the cookie
        res.cookie("tktplz_cookie", token, options);
        return token; 

    }
    catch (err) {
        console.log(err.message);
        throw err;
    }
}
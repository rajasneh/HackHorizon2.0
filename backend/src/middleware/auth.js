import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    const token = req.cookies['auth-token'];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
}


export const auth = (req, res, next) => {
    try {
        // fetch the cookie 
        // const token = req.cookies.tktplz_cookie || req.body.token || req.header("Authorization").replace("Bearer ", "");
        const token = req.cookies.tktplz_cookie;

        if (!token || token === undefined) {
            return res.status(401).json({
                success: false, 
                message: "Token not found"
            })
        }

        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decode;

        } catch (err) {
            console.log(err.message);
            return res.status(401).json({
                success: false,
                message: "Token in invalid"
            })
        }
        next();

    } catch(err){
        console.log(err.message); 
        return res.status(500).json({
            success : false,
            message : "Something went wrong, while verifying the token"
        })
    }  
}


export const isOrganiser = (req, res, next) => {
    try{
        if(req.user.role !== "organiser" && req.user.role !== "moderator"){
            console.log("Error in isOrganiser!")
            return res.status(401).json({ 
                success : false,
                message : "Permission prohibited, only students are allowed!"
            })
        }
        next();
    }catch(err){
        return res.status(500).json({
            success : false,
            message : "Something went wrong while checking is Student or not."
        })
    }
}


export const isAdmin = (req, res, next) => {
    try{
        console.log(req.user)
        if(req.user.role !== "moderator"){
            return res.status(401).json({
                success : false,
                message : "Permission prohibited, only admin is allowed!"
            })
        }
        next();
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success : false,
            message : "Something went wrong while checking is Admin or not."
        })
    }
}


export const isOrganiserORAdmin = (req, res, next) => {
    try{
        if(req.user.role !== "organiser" && req.user.role !== "admin"){
            console.log("Error in isOrganiserORAdmin!")
            return res.status(401).json({ 
                success : false,
                message : "Permission prohibited, only organisers and admins are allowed!"
            })
        }
        next();
    }catch(err){
        return res.status(500).json({
            success : false,
            message : "Something went wrong while checking is Organiser or Admin."
        })
    }
}
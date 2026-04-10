import express from 'express';
const router = express.Router();
import passport from 'passport';

import { googleAuth, userRegistration, organiserRegistration, otpVerification, userLogin, organiserLogin, logout, afterGoogleAuth, sendInvite, getQR, adminLogin, markVisited, checkInviteValidity } from '../controller/authController.js';
import { auth, isAdmin, isOrganiser } from '../middlewares/auth.js';


// user and organiser registration
router.post("/user-reg", userRegistration);
router.post("/orgn-reg", organiserRegistration); 

// verify otp
router.post("/verify-otp", otpVerification);

// Login
router.post("/user-login", userLogin);
router.post("/orgn-login", organiserLogin);

router.get("/me", afterGoogleAuth);


// ADMIN --------------->
router.post("/admin/invite", sendInvite);
router.get("/admin/invite/:email", getQR);
router.post("/admin/login", adminLogin);
router.post("/admin/markInviteVisited", markVisited);

// Google Auth Routes
// Redirect to Google for authentication
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google OAuth Callback
router.get("/google/callback", googleAuth);


// auth verification using middlewares 

router.get("/verify-organsier", auth, isOrganiser, (req, res)=>{
    return res.status(200).json({
        role: req.user.role,
        success : true,
        message : "Welcome to Organiser Dashboard Page"
    });
})

router.get("/verify-admin", auth, isAdmin, (req, res) => {
    return res.status(200).json({
        role: req.user.role,
        success : true,
        message : "Welcome to Admin Dashboard Page"
    });
})

router.post("/admin/checkInviteValidity", checkInviteValidity);

// logout
router.get("/logout", logout);


export default router;

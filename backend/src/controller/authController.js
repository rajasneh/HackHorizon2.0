import { and, eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { organiser } from "../drizzle/organiserSchema.js";
import { users } from "../drizzle/userSchema.js";
import { redis } from "../config/redisClient.js";
import { sendmail, verifyOTP } from "../utils/otp.js";
import { admins } from "../drizzle/adminSchema.js";
import { generateTokenAndSetCookie } from "../utils/token.js";
import passport from "passport";
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { verifyTOTP, generateSecret } from "../utils/totp.js";
import bcrypt from 'bcrypt';
import { sendAdminInviteEmail } from "../utils/sendInviteMail.js";
import { inviteLinks } from "../drizzle/inviteLinkSchema.js";
import { randomBytes } from 'crypto';
import crypto from 'crypto';

export const organiserRegistration = async (req, res) => {
    try {

        const { name, phoneNo, email } = req.body;

        // Check if phone number or email already exists 
        const phoneExist = await db.select().from(organiser)
            .where(eq(phoneNo, organiser.phone));

        if (phoneExist.length !== 0) {
            return res.status(400).json({ message: "Mobile number already exists" })
        }

        const emailExist = await db.select().from(organiser)
            .where(eq(email, organiser.email));

        if (emailExist.length !== 0) {
            return res.status(400).json({ message: "Email already exists" })
        }

        // send otp and verify

        // Store user details in Redis temporarily
        await redis
            .multi()
            .setex(`user:${email}:name`, 360, name)
            .setex(`user:${email}:role`, 360, "org")
            .setex(`user:${email}:function_type`, 360, "register")
            .setex(`user:${email}:phone`, 360, phoneNo)
            .exec();

        // **Rate limiting OTP requests**
        const otpRequestedRecently = await redis.get(`user:${email}:otp_requested`);
        if (otpRequestedRecently) {
            return res.status(429).json({
                success: false,
                message: "You can request a new OTP after 1 minute."
            });
        }

        // Send OTP
        await sendmail(email);
        console.log(`Mail sent to email ${email}`);

        // **Set rate limit flag (expires in 60 seconds)**
        await redis.setex(`user:${email}:otp_requested`, 60, "true");

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully!"
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


export const userRegistration = async (req, res) => {
    try {

        const { name, email } = req.body;

        // Check if email already exists
        const emailExist = await db.select().from(users)
            .where(eq(email, users.email));

        console.log("Email exists : ", emailExist);

        if (emailExist.length !== 0) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            })
        }


        // send otp and verify

        // Store user details in Redis temporarily
        await redis
            .multi()
            .setex(`user:${email}:name`, 360, name)
            .setex(`user:${email}:role`, 360, "user")
            .setex(`user:${email}:function_type`, 360, "register")
            .exec();

        // **Rate limiting OTP requests**
        const otpRequestedRecently = await redis.get(`user:${email}:otp_requested`);
        if (otpRequestedRecently) {
            return res.status(429).json({
                success: false,
                message: "You can request a new OTP after 1 minute."
            });
        }

        // Send OTP
        await sendmail(email);
        console.log(`Mail sent to email ${email}`);

        // **Set rate limit flag (expires in 60 seconds)**
        await redis.setex(`user:${email}:otp_requested`, 60, "true");

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully!"
        });


    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


export const otpVerification = async (req, res) => {
    try {

        const { inputOtp, email } = req.body;

        // Fetch OTP from Redis (per-user storage)
        const OTP = await redis.get(`user:${email}:otp`);

        // Check if OTP exists
        if (!OTP) {
            return res.status(400).json({ success: false, message: "OTP expired or not found. Request a new OTP." });
        }

        // Validate OTP
        const isValid = await verifyOTP(OTP, inputOtp);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Incorrect OTP, try again" });
        }

        // OTP is valid, fetch username, role from Redis
        const name = await redis.get(`user:${email}:name`);
        const role = await redis.get(`user:${email}:role`);
        const ftype = await redis.get(`user:${email}:function_type`);
        const phone = await redis.get(`user:${email}:phone`)

        let user;

        if (ftype === "register") {
            if (role === "org") {
                await db.insert(organiser).values({
                    name,
                    email,
                    phone
                })

                user = await db.select().from(organiser)
                    .where(eq(email, organiser.email));
            }
            else if (role === "user") {
                await db.insert(users).values({
                    name,
                    email,
                    isVerified: true
                })

                user = await db.select().from(users)
                    .where(eq(email, users.email));
            }
        }
        else if (ftype === "login") {

            if (role === "org") {
                user = await db.select().from(organiser)
                    .where(eq(email, organiser.email));
            }
            else if (role === "user") {
                user = await db.select().from(users)
                    .where(eq(email, users.email));
            }

        }

        // Remove OTP and temporary cache keys for this user
        await redis.del(`user:${email}:otp`);
        await redis.del(`user:${email}:function_name`);
        await redis.del(`user:${email}:name`);
        await redis.del(`user:${email}:otp_requested`);
        await redis.del(`user:${email}:role`);
        await redis.del(`user:${email}:phone`);

        const userData = user[0];

        generateTokenAndSetCookie(userData, res);

        // Redirect user based on role
        if (userData.role === "user") {
            return res.status(200).json({
                success: true,
                message: "You are allowed to access user panel",
                role: userData.role,
                userData
            })

        } else if (userData.role === "organiser") {
            return res.status(200).json({
                success: true,
                message: "You are allowed to access organiser panel",
                role: userData.role,
                userData
            })

        } else {
            return res.status(400).json({
                success: false,
                message: "Role not recognized"
            });
        }


    } catch (err) {
        return res.status(500).json({
            success: false,
            message: `Error in OTP verification : ${err.message}`
        })
    }
}


export const userLogin = async (req, res) => {
    try {

        const { email } = req.body;

        // Check if email exist in organiser
        const emailInOrganiser = await db.select()
            .from(organiser).where(eq(email, organiser.email));

        if (emailInOrganiser.length !== 0) {
            return res.status(400).json({
                success: false,
                message: "This email is registered with a different role. Please use the appropriate login method."
            })
        }

        // Check if the email exist in admin
        const emailInAdmin = await db.select()
            .from(admins).where(eq(email, admins.email));

        if (emailInAdmin.length !== 0) {
            return res.status(400).json({
                success: false,
                message: "This email is registered with a different role. Please use the appropriate login method."
            })
        }

        // Check if email exists
        const emailExist = await db.select().from(users)
            .where(eq(email, users.email));

        if (emailExist.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Email does not exist"
            })
        }

        // Save the email in redis
        await redis.setex(`user:${email}:email`, 360, email);

        // Send OTP to the email for verification

        // Check if OTP is already requested
        const otpRequested = await redis.exists(`user:${email}:otp_requested`);
        if (otpRequested) {
            return res.status(429).json({ success: false, message: "OTP already sent, wait for 60 sec to re-login" });
        }

        // Generate and send OTP
        await sendmail(email);
        console.log(`OTP sent to ${email} from login page`);

        await redis.setex(`user:${email}:function_type`, 360, "login");
        await redis.setex(`user:${email}:role`, 360, "user");

        return res.status(200).json({ success: true, message: "OTP sent successfully", email });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


export const organiserLogin = async (req, res) => {
    try {

        const { email } = req.body;

        // Check if email exist in user
        const emailInUser = await db.select()
            .from(users).where(eq(email, users.email));

        if (emailInUser.length !== 0) {
            return res.status(400).json({
                success: false,
                message: "This email is registered with a different role. Please use the appropriate login method."
            })
        }

        // Check if the email exist in admin
        const emailInAdmin = await db.select()
            .from(admins).where(eq(email, admins.email));

        if (emailInAdmin.length !== 0) {
            return res.status(400).json({
                success: false,
                message: "This email is registered with a different role. Please use the appropriate login method."
            })
        }

        // Check if email exists
        const emailExist = await db.select().from(organiser)
            .where(eq(email, organiser.email));

        console.log("Email exist : ", emailExist);

        if (emailExist.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Email does not exist"
            })
        }

        // Check ROLE
        const userRole = emailExist[0];
        if (userRole.role !== "organiser") {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            })
        }

        // Send OTP to the email for verification

        // Check if OTP is already requested
        const otpRequested = await redis.exists(`user:${email}:otp_requested`);
        if (otpRequested) {
            return res.status(429).json({ success: false, message: "OTP already sent, wait for 60 sec to re-login" });
        }

        // Generate and send OTP
        await sendmail(email);
        console.log(`OTP sent to ${email} from login page`);
        await redis.setex(`user:${email}:function_type`, 360, "login");
        await redis.setex(`user:${email}:role`, 360, "org");

        return res.status(200).json({ success: true, message: "OTP sent successfully", email });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


// Google Authentication Route Handler --------->

export const googleAuth = (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
        if (err) {
            console.error("Google Authentication Error:", err);
            return res.redirect(`${process.env.FRONTEND_URL}/auth-error?error=${encodeURIComponent("Internal Server Error")}`);
        }

        if (!user) {
            const errorMessage = info?.message || "Authentication failed";
            return res.redirect(`${process.env.FRONTEND_URL}/auth-error?error=${encodeURIComponent(errorMessage)}`);
        }

        // Success: set token and redirect
        generateTokenAndSetCookie(user, res);
        return res.redirect(`${process.env.FRONTEND_URL}/auth-success`);
    })(req, res, next);
};



export const afterGoogleAuth = async (req, res) => {
    const token = req.cookies.tktplz_cookie;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).json({ success: true, user: decoded });
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
}


// Logout Route Handler ------------>
export const logout = (req, res) => {
    try {
        // Clear the JWT token cookie by setting its expiration to a past date
        res.clearCookie('tktplz_cookie');

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    }
    catch (err) {
        console.log(err);
        return res.status(401).json({
            success: false,
            message: "Error in logging out"
        })
    }
}



// ADMIN AUTH CONTROlLErs ------------------------------------------------------>


export const adminLogin = async (req, res) => {
    const { email, password, token } = req.body;
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));

    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    // Use bcrypt library to verify the password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    let secret = admin.totpSecret;
    if (!admin.is2FAEnabled) {
        secret = await redis.get(email);
        if (!secret) return res.status(400).json({ message: "TOTP not initialized or expired." });

        const valid = verifyTOTP(token, secret);
        if (!valid) return res.status(401).json({ message: "Invalid TOTP" });

        await db.update(admins)
            .set({ totpSecret: secret, is2FAEnabled: true })
            .where(eq(admins.email, email));

        await redis.del(email);
    } else {
        const valid = verifyTOTP(token, secret);
        if (!valid) return res.status(401).json({ message: "Invalid TOTP" });
    }

    // generate cookie 
    generateTokenAndSetCookie(admin, res);

    return res.status(200).json({
        success: true,
        message: "Login successful",
        role: admin.role,
        adminData: admin
    });
};


const generateSecureToken = (length = 32) => {
    return randomBytes(length).toString('hex'); // 32 bytes = 64 hex characters
};

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

export const sendInvite = async (req, res) => { 
    const { name, email, password } = req.body;
    const id = uuidv4();
    const token = generateSecureToken();
    const hashed = hashToken(token);

    // Encrypt the password....
    const hashedPassword = await bcrypt.hash(password, 10);

    const secret = generateSecret(email);
    await redis.set(email, secret.base32, 'EX', 3600);

    await db.insert(admins).values({
        id,
        name,
        email,
        password: hashedPassword,
        is2FAEnabled: false,
    });

    const qrUrl = secret.otpauth_url;
    const inviteLink = `${process.env.FRONTEND_URL}/admin/invite/${encodeURIComponent(email)}/${token}`;

    // Insert in the visited links DB
    await db.insert(inviteLinks).values({
        email,
        token: hashed,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    })

    await sendAdminInviteEmail(email, inviteLink);

    res.json({ inviteLink, qrUrl });
};

export const getQR = async (req, res) => {
    const { email } = req.params;
    const secret = await redis.get(email);
    if (!secret) return res.status(400).json({ message: "Invalid or expired invite." });

    // Check if invite exists
    const inviteEmail = await db.select().from(inviteLinks).where(eq(inviteLinks.email, email));
    if(!inviteEmail || inviteEmail.length === 0) {
        return res.status(400).json({ message: "Invalid or expired invite." });
    }

    // Only check 'used' if you want to block after QR is shown (now handled by markVisited)
    const qrUrl = `otpauth://totp/TktPlz (${email})?secret=${secret}&issuer=TktPlz`;
    res.json({ qrUrl });
};

// New endpoint: Check invite validity (for frontend QR page mount)
export const checkInviteValidity = async (req, res) => {
    const { email, token } = req.body;
    try {
        const hashedToken = hashToken(token);
        const exist = await db.select()
            .from(inviteLinks)
            .where(
                and(
                    eq(inviteLinks.email, email),
                    eq(inviteLinks.token, hashedToken)
                )
            );
        if(!exist || exist.length === 0) {
            return res.status(401).json({ success: false, message: "Unauthorized, details don't exist" });
        }
        if(exist[0].used) {
            return res.status(400).json({ success: false, message: "Link has already been used" });
        }
        
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error checking invite validity" });
    }
}


export const markVisited = async (req, res) => {
    const { email, token } = req.body;
    try {
        const hashedToken = hashToken(token);
        const exist = await db.select()
            .from(inviteLinks)
            .where(
                and(
                    eq(inviteLinks.email, email),
                    eq(inviteLinks.token, hashedToken)
                )
            );
        if(!exist || exist.length === 0) {
            return res.status(401).json({ success: false, message: "Unauthorized, details don't exist" });
        }
        if(exist[0].used) {
            return res.status(400).json({ success: false, message: "Link has already been used" });
        }
        // Only mark as used now (after QR shown and user clicks Proceed)
        await db.update(inviteLinks).set({ used: true }).where(and(
            eq(inviteLinks.email, email),
            eq(inviteLinks.token, hashedToken)
        ));
        return res.status(200).json({ success: true, message: "Invite marked as visited" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error marking invite as visited" });
    }
}
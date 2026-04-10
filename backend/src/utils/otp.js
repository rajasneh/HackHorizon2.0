import { Resend } from 'resend';
import otpGenerator from 'otp-generator';
import { redis } from '../config/redisClient.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate a 6-digit numeric OTP
const generateOTP = () => {
  return otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

// Function to send OTP via email
export const sendmail = async (email) => {
  try {
    // Check if OTP was recently requested (Rate Limiting)
    const otpRequestedRecently = await redis.get(`user:${email}:otp_requested`);
    if (otpRequestedRecently) {
      console.log(`OTP request blocked for ${email} (Too many requests)`);
      return { success: false, message: "You can request a new OTP after 1 minute." };
    }

    // Generate OTP
    let OTP = generateOTP();

    // Store OTP in Redis for the user (expires in 5 minutes)
    await redis.setex(`user:${email}:otp`, 300, OTP);

    // Set rate limiting flag (expires in 60 seconds)
    await redis.setex(`user:${email}:otp_requested`, 60, "true");

    // Send OTP email
    const { data, error } = await resend.emails.send({
      from: "TktPlz <noreply@tktplz.me>",
      to: email,
      subject: "🔐 Your One-Time Password (OTP) for TktPlz Login",
      html: `
              <div style="max-width: 500px; margin: auto; padding: 24px; font-family: Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                <h2 style="color: #1A73E8; margin-bottom: 16px;">TktPlz Login Verification</h2>
                
                <p style="font-size: 16px; color: #333;">Hello,</p>
                <p style="font-size: 16px; color: #333;">
                  You recently requested to log in to your <strong>TktPlz</strong> account. Please use the following OTP to complete your login:
                </p>
          
                <div style="text-align: center; margin: 24px 0;">
                  <span style="display: inline-block; padding: 14px 28px; font-size: 24px; background-color: #1A73E8; color: #fff; border-radius: 6px; letter-spacing: 2px; font-weight: bold;">
                    ${OTP}
                  </span>
                </div>
          
                <p style="font-size: 15px; color: #555;">
                  This OTP is valid for <strong>5 minutes</strong>. Do not share this code with anyone for security reasons.
                </p>
          
                <p style="font-size: 15px; color: #555;">
                  If you did not request this login, please ignore this email or contact our support team immediately.
                </p>
          
                <p style="font-size: 15px; color: #555;">Thanks,<br><strong>The TktPlz Team</strong></p>
          
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #999; text-align: center;">
                  This is an automated email. Please do not reply to this message.
                </p>
              </div>
            `,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, message: "Error sending OTP." };
    }

    console.log("OTP sent to:", email, "Message ID:", data.id);
    return { success: true, message: "OTP sent successfully!" };

  } catch (err) {
    console.error("Error sending email:", err);
    return { success: false, message: "Error sending OTP." };
  }
};

// OTP Verification
export const verifyOTP = async (OTP, inputOTP) => {
  try {
    if (!OTP || !inputOTP) return false;

    if (OTP !== inputOTP) return false;

    // Clear OTP after successful verification 
    return true;
  } catch (err) {
    console.log("Error in verifying OTP:", err.message);
    return false;
  }
};
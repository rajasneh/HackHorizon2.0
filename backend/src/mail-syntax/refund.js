import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send refund confirmation email
export const sendRefundEmail = async (userEmail, refundDetails) => {
    try {
        const { orderId, eventName, refundAmount, refundId, estimatedProcessingTime } = refundDetails;

        const { data, error } = await resend.emails.send({
            from: "TktPlz <noreply@tktplz.me>",
            to: userEmail,
            subject: `💰 Refund Initiated - ${eventName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">💰 Refund Initiated</h1>
                        <p style="color: #e8f5e9; margin: 10px 0 0 0; font-size: 16px;">Your refund is being processed</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">${eventName}</h2>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="color: #495057; margin-top: 0; font-size: 18px;">💳 Refund Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Order ID:</td>
                                    <td style="padding: 8px 0; color: #333;">${orderId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Refund ID:</td>
                                    <td style="padding: 8px 0; color: #333;">${refundId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Refund Amount:</td>
                                    <td style="padding: 8px 0; color: #28a745; font-weight: bold; font-size: 18px;">₹${refundAmount}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Processing Time:</td>
                                    <td style="padding: 8px 0; color: #333;">${estimatedProcessingTime}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Status:</td>
                                    <td style="padding: 8px 0; color: #ffc107; font-weight: bold;">Processing</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
                            <h3 style="color: #856404; margin-top: 0; font-size: 16px;">⏰ What happens next?</h3>
                            <ul style="color: #333; margin: 10px 0; padding-left: 20px;">
                                <li>Your refund has been initiated with the payment gateway</li>
                                <li>The amount will be credited to your original payment method</li>
                                <li>You'll receive another email once the refund is completed</li>
                                <li>Processing time may vary depending on your bank</li>
                            </ul>
                        </div>
                        
                        <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8; margin-top: 20px;">
                            <h3 style="color: #0c5460; margin-top: 0; font-size: 16px;">📞 Need Help?</h3>
                            <p style="color: #333; margin: 10px 0;">
                                If you have any questions about your refund, please contact our support team with your Order ID: <strong>${orderId}</strong>
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                            <p style="color: #6c757d; margin: 0; font-size: 14px;">
                                Thank you for using TktPlz! 🙏<br>
                                We're sorry you couldn't attend the event.
                            </p>
                        </div>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('Error sending refund confirmation email:', error);
            return { success: false, error: error.message };
        }

        console.log(`Refund confirmation email sent to: ${userEmail}`);
        return { success: true };

    } catch (error) {
        console.error('Error sending refund confirmation email:', error);
        return { success: false, error: error.message };
    }
};

// Send refund completion email
export const sendRefundCompletedEmail = async (userEmail, refundDetails) => {
    try {
        const { orderId, eventName, refundAmount, refundId } = refundDetails;

        const { data, error } = await resend.emails.send({
            from: process.env.SENDER_EMAIL,
            to: userEmail,
            subject: `✅ Refund Completed - ${eventName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">✅ Refund Completed</h1>
                        <p style="color: #e8f5e9; margin: 10px 0 0 0; font-size: 16px;">Your money has been refunded</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                                ₹${refundAmount} has been credited to your account
                            </div>
                        </div>
                        
                        <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">${eventName}</h2>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="color: #495057; margin-top: 0; font-size: 18px;">💳 Refund Summary</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Order ID:</td>
                                    <td style="padding: 8px 0; color: #333;">${orderId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Refund ID:</td>
                                    <td style="padding: 8px 0; color: #333;">${refundId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Amount Refunded:</td>
                                    <td style="padding: 8px 0; color: #28a745; font-weight: bold; font-size: 18px;">₹${refundAmount}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Status:</td>
                                    <td style="padding: 8px 0; color: #28a745; font-weight: bold;">Completed ✅</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8;">
                            <h3 style="color: #0c5460; margin-top: 0; font-size: 16px;">💡 Important Note</h3>
                            <p style="color: #333; margin: 10px 0;">
                                The refunded amount should appear in your account within 1-2 business days. 
                                If you don't see the credit after this time, please check with your bank or contact our support team.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                            <p style="color: #6c757d; margin: 0; font-size: 14px;">
                                Thank you for using TktPlz! 🎊<br>
                                We hope to see you at future events!
                            </p>
                        </div>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('Error sending refund completion email:', error);
            return { success: false, error: error.message };
        }

        console.log(`Refund completion email sent to: ${userEmail}`);
        return { success: true };

    } catch (error) {
        console.error('Error sending refund completion email:', error);
        return { success: false, error: error.message };
    }
};
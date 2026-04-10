import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send ticket booking confirmation email
export const sendTicketBookedEmail = async (userEmail, bookingDetails) => {
    try {
        const { orderId, eventName, eventDate, eventTime, totalAmount, numberOfTickets, seatNumbers, eventType } = bookingDetails;

        const { data, error } = await resend.emails.send({
            from: "TktPlz <noreply@tktplz.me>",
            to: userEmail,
            subject: `🎫 Booking Confirmed - ${eventName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
                        <p style="color: #e8e8e8; margin: 10px 0 0 0; font-size: 16px;">Your tickets are ready</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">${eventName}</h2>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="color: #495057; margin-top: 0; font-size: 18px;">📋 Booking Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Order ID:</td>
                                    <td style="padding: 8px 0; color: #333;">${orderId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Event Date:</td>
                                    <td style="padding: 8px 0; color: #333;">${eventDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Event Time:</td>
                                    <td style="padding: 8px 0; color: #333;">${eventTime}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Tickets:</td>
                                    <td style="padding: 8px 0; color: #333;">${numberOfTickets}</td>
                                </tr>
                                ${seatNumbers && eventType === 'Seating' ? `
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Seats:</td>
                                    <td style="padding: 8px 0; color: #333;">${seatNumbers}</td>
                                </tr>
                                ` : ''}
                                <tr>
                                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Total Amount:</td>
                                    <td style="padding: 8px 0; color: #28a745; font-weight: bold; font-size: 18px;">₹${totalAmount}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
                            <h3 style="color: #1976d2; margin-top: 0; font-size: 16px;">📱 Important Information</h3>
                            <ul style="color: #333; margin: 10px 0; padding-left: 20px;">
                                <li>Please carry a valid ID proof to the venue</li>
                                <li>Arrive at least 30 minutes before the event starts</li>
                                <li>This email serves as your ticket confirmation</li>
                                <li>Screenshots of this email are acceptable for entry</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                            <p style="color: #6c757d; margin: 0; font-size: 14px;">
                                Thank you for choosing TktPlz! 🎊<br>
                                Have a great time at the event!
                            </p>
                        </div>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('Error sending booking confirmation email:', error);
            return { success: false, error: error.message };
        }

        console.log(`Booking confirmation email sent to: ${userEmail}`);
        return { success: true };

    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
        return { success: false, error: error.message };
    }
};
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendAdminInviteEmail = async (receiverEmail, inviteLink) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `TktPlz <noreply@tktplz.me>`,
      to: receiverEmail,
      subject: "You're Invited to Join TktPlz as an Admin!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1A73E8;">Welcome to TktPlz 🎉</h2>
          <p>Hi there,</p>
          <p>You've been invited to join <strong>TktPlz</strong> as an admin. We’re thrilled to have you onboard!</p>
          <p>To get started, click the button below to accept your invitation and complete the setup:</p>
          <p><b>This link is valid for 60 minutes</b></p>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${inviteLink}" style="background-color: #1A73E8; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>

          <p>If the button doesn’t work, copy and paste this link into your browser:</p>
          <p style="word-break: break-word;"><a href="${inviteLink}">${inviteLink}</a></p>

          <hr style="margin: 30px 0;" />
          <p style="font-size: 13px; color: #888;">This invitation link is valid for one-time use. If you did not expect this invitation, you can safely ignore this email.</p>
          <p style="font-size: 13px; color: #888;">— The TktPlz Team</p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send invite email:", error);
      throw new Error("Could not send invitation email");
    }

    console.log("Invite email sent to:", receiverEmail);
  } catch (err) {
    console.error("Failed to send invite email:", err);
    throw new Error("Could not send invitation email");
  }
};

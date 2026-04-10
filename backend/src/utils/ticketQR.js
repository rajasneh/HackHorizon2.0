import crypto from "crypto";
import QRCode from "qrcode";

function generateTicketQR(ticketId) {
  const hash = crypto
    .createHmac("sha256", process.env.TICKET_SECRET)
    .update(ticketId.toString())
    .digest("hex");

  const qrData = JSON.stringify({ ticketId, hash });
  return QRCode.toDataURL(qrData); // Base64 PNG string
}

export default generateTicketQR;
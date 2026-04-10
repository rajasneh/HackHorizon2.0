import puppeteer from 'puppeteer';
import { format } from "date-fns";
import { db } from '../config/db.js';
import { tickets } from '../drizzle/ticketSchema.js';
import { events } from '../drizzle/eventSchema.js';
import { users } from '../drizzle/userSchema.js';
import { eq } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateTicketPDF = async (req, res) => {
  let browser;
  try { 
    const { orderId } = req.body;

    // Fetch ticket details
    const ticketData = await db.select()
      .from(tickets)
      .innerJoin(users, eq(tickets.userId, users.id))
      .where(eq(tickets.orderId, orderId))
      .limit(1);

    if (!ticketData.length) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketData[0].tickets;
    const user = ticketData[0].users;
    const eventDetails = ticket.eventDetails || {};
    
    // Generate QR code
    const hash = crypto
      .createHmac("sha256", process.env.TICKET_SECRET)
      .update(ticket.id.toString())
      .digest("hex");
    const qrData = JSON.stringify({ ticketId: ticket.id, hash });
    const qrCodeDataURL = await QRCode.toDataURL(qrData);
    
    // Destructure amount details
    const baseAmount = ticket.baseAmount || ticket.totalAmount;
    const convenienceFee = ticket.convenienceFee || 0;
    const totalAmount = ticket.totalAmount;

    // Use Cloudinary logo URL
    const logoUrl = 'https://res.cloudinary.com/dgxc8nspo/image/upload/v1775822761/meetzz_oovah3.png';

    // Create HTML template with improved design
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          background: white;
          margin: 0;
          padding: 0;
          color: #2d3748;
        } 
        .ticket-container {
          width: 100%;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          background: #1a202c;
          color: white;
          padding: 24px;
          border-bottom: 3px solid #3182ce;
        }
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .logo {
          display: flex;
          align-items: center;
        }
        .logo img {
          width: 70px;
          height: 45px;
          border-radius: 4px;
          background: white;
          padding: 6px;
          object-fit: cover;
          object-position: center;
        }
        .status-badge {
          background: #38a169;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .event-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .booking-id {
          font-size: 16px;
          opacity: 0.8;
          font-weight: 500;
        }
        .content {
          padding: 24px;
        }
        .main-content {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
          margin-bottom: 16px;
        }
        .poster-section {
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .poster {
          width: 180px;
          height: 240px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .details-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .info-group {
          background: #f7fafc;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #3182ce;
        }
        .info-title {
          font-size: 18px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 14px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
          align-items: center;
        }
        .info-label {
          color: #4a5568;
          font-weight: 500;
        }
        .info-value {
          color: #2d3748;
          font-weight: 600;
          text-align: right;
        }
        .seat-section {
          background: #edf2f7;
          padding: 16px;
          border-radius: 6px;
          text-align: center;
          margin: 16px 0;
          border: 1px solid #e2e8f0;
        }
        .seat-title {
          font-size: 14px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .seat-info {
          font-size: 24px;
          font-weight: 700;
          color: #3182ce;
        }
        .bottom-section {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: start;
        }
        .payment-info {
          background: #f7fafc;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .qr-section {
          text-align: center;
          background: white;
          padding: 16px;
          border-radius: 6px;
          border: 2px solid #e2e8f0;
        }
        .qr-placeholder {
          width: 120px;
          height: 120px;
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          color: #4a5568;
          font-size: 12px;
          font-weight: 500;
        }
        .qr-text {
          font-size: 13px;
          color: #4a5568;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .qr-instruction {
          font-size: 11px;
          color: #718096;
          font-weight: 500;
        }
        .footer {
          background: #1a202c;
          color: #a0aec0;
          padding: 16px 24px;
          border-top: 3px solid #3182ce;
          text-align: center;
          font-size: 11px;
        }
        .footer p {
          margin: 4px 0;
        }
        .divider {
          height: 2px;
          background: #e2e8f0;
          margin: 16px 0;
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <!-- Header Section -->
        <div class="header">
          <div class="logo-section">
            <div class="logo">
              <img src="${logoUrl}" alt="Meetz" onerror="this.style.display='none'" />
            </div>
            <div class="status-badge">CONFIRMED</div>
          </div>
          <div class="event-title">${eventDetails.eventName || 'Event Name'}</div>
          <div class="booking-id">Booking ID: ${ticket.bookingID}</div>
        </div>

        <!-- Content Section -->
        <div class="content">
          <div class="main-content">
            <!-- Event Poster -->
            <div class="poster-section">
              <img 
                src="${eventDetails.poster || '/images/Banner.png'}" 
                alt="Event Poster" 
                class="poster"
                onerror="this.src='/images/Banner.png'"
              />
            </div>

            <!-- Event Details -->
            <div class="details-section">
              <div class="info-group">
                <div class="info-title">Event Information</div>
                ${eventDetails.date ? `
                  <div class="info-item">
                    <span class="info-label">Date & Time:</span>
                    <span class="info-value">${eventDetails.date}</span>
                  </div>
                ` : ''}
                ${eventDetails.location ? `
                  <div class="info-item">
                    <span class="info-label">Venue:</span>
                    <span class="info-value">${eventDetails.location}</span>
                  </div>
                ` : ''}
                ${eventDetails.city ? `
                  <div class="info-item">
                    <span class="info-label">City:</span>
                    <span class="info-value">${eventDetails.city}${eventDetails.state ? `, ${eventDetails.state}` : ''}</span>
                  </div>
                ` : ''}
                ${ticket.hall_name || eventDetails.hallName ? `
                  <div class="info-item">
                    <span class="info-label">Hall:</span>
                    <span class="info-value">${ticket.hall_name || eventDetails.hallName}</span>
                  </div>
                ` : ''}
              </div>

              <div class="info-group">
                <div class="info-title">Ticket Holder</div>
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${user.name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${user.email}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Tickets:</span>
                  <span class="info-value">${ticket.numberOfTickets}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Base Amount:</span>
                  <span class="info-value">₹${baseAmount}</span>
                </div>
                ${convenienceFee > 0 ? `
                  <div class="info-item">
                    <span class="info-label">Convenience Fee:</span>
                    <span class="info-value">₹${convenienceFee}</span>
                  </div>
                ` : ''}
                <div class="info-item">
                  <span class="info-label">Total Amount:</span>
                  <span class="info-value">₹${totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          ${ticket.eventType === 'Seating' && ticket.seat_no ? `
            <div class="seat-section">
              <div class="seat-title">Seat Information</div>
              <div class="seat-info">${ticket.seat_type || 'Seat'} - ${ticket.seat_no}</div>
              ${ticket.hall_name ? `<div style="margin-top: 12px; font-size: 15px; color: #4a5568; font-weight: 500;">Hall: ${ticket.hall_name}</div>` : ''}
            </div>
          ` : ''}
          ${ticket.eventType === 'Open' && ticket.zone ? `
            <div class="seat-section">
              <div class="seat-title">Zone Information</div>
              <div class="seat-info">${ticket.zone} - ${ticket.numberOfTickets}</div>
            </div>
          ` : ''}

          <div class="divider"></div>

          <!-- Bottom Section -->
          <div class="bottom-section">
            <div class="payment-info">
              <div class="info-title">Payment Details</div>
              <div class="info-item">
                <span class="info-label">Order ID:</span>
                <span class="info-value">${ticket.orderId || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Payment ID:</span>
                <span class="info-value">${ticket.paymentId || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Valid Till:</span>
                <span class="info-value">${format(new Date(ticket.valid_till), 'dd MMM yyyy, hh:mm a')}</span>
              </div>
            </div>

            <!-- QR Code Section -->
            <div class="qr-section">
              <div class="info-title">Entry Pass</div>
              <img src="${qrCodeDataURL}" alt="QR Code" style="width: 120px; height: 120px; margin: 0 auto 12px; display: block;" />
              <div class="qr-instruction">Show this at the venue</div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>IMPORTANT:</strong> Please carry a valid ID proof along with this ticket.</p>
          <p>For support, contact us at support@meetz.com | www.meetz.com</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Launch Puppeteer
    browser = await puppeteer.launch({ 
      headless: true,
      executablePath: puppeteer.executablePath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--allow-file-access-from-files']
    });
    const page = await browser.newPage();
    
    // Set viewport for better rendering
    await page.setViewport({ width: 1200, height: 800 });
    
    // Enable request interception to handle local files
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().startsWith('file://')) {
        request.continue();
      } else {
        request.continue();
      }
    });
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF with improved settings
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      preferCSSPageSize: true
    });

    await browser.close();

    // Send PDF response
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticket.bookingID}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);

  } catch (error) {
    console.error('PDF generation error:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to generate ticket PDF' });
  }
};

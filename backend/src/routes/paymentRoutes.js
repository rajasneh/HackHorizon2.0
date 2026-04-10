import express from 'express';
const router = express.Router();

import { createOrder, verifyPayment, refundPayment, handleRefundWebhook, payoutSummary, payoutDetails, payoutSendReceipt, payoutMarkAsPaid, payoutPaymentInitiated, getAllPayoutsForOrg } from '../controller/paymentController.js';
import { getPrices, calculateTicketPrices } from '../middleware/booking.js';
import { auth, isAdmin, isOrganiser, isOrganiserORAdmin } from '../middleware/auth.js';

router.post("/createOrder", getPrices, calculateTicketPrices, createOrder);
router.post("/verifyPayment", verifyPayment);
router.post("/refund", refundPayment);
router.post("/webhook/refund", handleRefundWebhook);

router.get("/payout-summary", auth, isAdmin, payoutSummary);
router.get("/payout/:id", payoutDetails);

router.post("/payout/:id/initiate", auth, isAdmin, payoutPaymentInitiated);
router.post("/payout/:id/mark-as-paid", auth, isOrganiser, payoutMarkAsPaid);
router.post("/payout/send-receipt/:id", auth, isAdmin, payoutSendReceipt);

router.get("/payout-for-organiser/:id", auth, isOrganiserORAdmin, getAllPayoutsForOrg);
export default router;
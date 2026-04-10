import express from "express";
const router = express.Router();

import { getBookingSummary, getLockedSeats, unlockItems} from "../controller/bookingController.js";
import { getPrices, lockItems } from "../middleware/booking.js";

router.post("/get-booking-summary", getPrices, lockItems, getBookingSummary);

router.post("/unlock-items", unlockItems);

router.get("/get-locked-seats/:eventId", getLockedSeats);

export default router;
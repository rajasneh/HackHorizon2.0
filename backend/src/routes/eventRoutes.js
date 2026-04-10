import express from 'express';
const router = express.Router();
import { upload } from '../middlewares/multer.js';
 

// seating event
import { seatingEvent, dismissEvent } from '../eventStrategies/seatingEvent.js';
router.post("/create/Seating", seatingEvent); 

// online event
import { onlineEvent } from '../eventStrategies/onlineEvent.js';
router.post("/create/Online", onlineEvent);

// open event
import { openEvent, zonesController } from '../eventStrategies/openEvent.js';
router.post("/create/Open", openEvent);
router.post("/create/zones", zonesController);

// registration event
import { registrationEvent, registerAllAtOnce } from '../eventStrategies/registrationEvent.js';
import { uploadPoster, updateEventPosterUrl, getOrganiserEvents, updateEventDetails, getEventTicketDetails, updateEventTicketDetails, deleteEvent, getAllEvents, getPriceDetails, getRegistrationFields, getBookedSeats, getEventsWithType } from '../controller/eventController.js';
router.post("/create/Registration", registrationEvent);
router.post("/register-for-event", registerAllAtOnce);


// upload poster route
router.post("/upload-poster", upload.single("poster"), uploadPoster); 

// dismiss event
router.post("/dismiss-event", dismissEvent);

// available halls and screens  
import { availableHalls, availableScreens, getEventDetails } from '../controller/eventController.js';  
router.get("/available-halls", availableHalls);
router.get("/available-screens/:hallID", availableScreens);

router.post('/update-poster-url', updateEventPosterUrl);

// get event by ID
router.get("/get-event/:eventId", getEventDetails);
router.get("/get-events/:organiserId", getOrganiserEvents); 
 
router.post('/update-details', updateEventDetails);

router.get('/ticket-details/:eventId', getEventTicketDetails);
router.post('/update-ticket-details', updateEventTicketDetails);

router.post('/delete-event', deleteEvent);

router.get('/get-all-events', getAllEvents);

// Add slot check endpoint for seating events
import { checkSeatingSlot } from '../eventStrategies/seatingEvent.js';
router.post("/check-seating-slot", checkSeatingSlot);

router.post("/get-reg-fields", getRegistrationFields);

router.get('/get-price-details/:eventId', getPriceDetails);

router.get('/get-booked-seats/:eventId', getBookedSeats);

router.get("/get-events-type/:subtype", getEventsWithType);

export default router;
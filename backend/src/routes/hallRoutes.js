import express from 'express';
const router = express.Router();

import { registerHall, createSeatLayout, createScreen, getHalls, getHallById, editHall, getSeatsAndPriceByScreenID, editSeatLayout, deleteScreen, addScreenToHall, deleteHall, updateHallStatus, updateScreenStatus, getSeatTypesByScreenID, updateAllScreenSeatTypeCounts } from '../controller/hallController.js';
 
router.post("/registerHall", registerHall, createScreen, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Hall created successfully with basic details and screen"
    })
});
router.post("/createSeatLayout", createSeatLayout);
// router.post("/createScreen", createScreen); 
router.get("/getHalls", getHalls);
router.get("/getHall/:id", getHallById);
router.put("/editHall/:id", editHall);
router.put("/updateStatus/:id", updateHallStatus);
router.put("/updateScreenStatus/:id", updateScreenStatus);
router.get('/seats/:screenID/:eventId', getSeatsAndPriceByScreenID); 
router.put('/editSeatLayout/:screenId', editSeatLayout);
// router.post("/addScreen", addScreen);
router.delete("/deleteScreen/:screenId", deleteScreen);
router.post("/addScreenToHall", addScreenToHall);
router.delete("/deleteHall/:id", deleteHall);
router.get('/seat-types/:screenID', getSeatTypesByScreenID);
router.post('/migrate-seat-type-counts', updateAllScreenSeatTypeCounts);

export default router;
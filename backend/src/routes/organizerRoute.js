import express from 'express';
const router = express.Router();

import { addBankingDetails, checkBankingDetails, createOrganiser, dashboardData, deleteOrganiser, eventAnalytics, scanQR } from '../controller/organiserController.js';
import { auth, isAdmin, isOrganiser } from '../middlewares/auth.js';
router.post("/create", createOrganiser);
router.post("/delete", deleteOrganiser);

router.post("/dashboard-data", dashboardData);

router.get("/analytics-data/:eventId", eventAnalytics);

router.get("/details-exist/:orgId", checkBankingDetails);

router.post("/add-banking-details", addBankingDetails); 

router.post("/scan-qr", scanQR);
 
export default router;
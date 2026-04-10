import express from "express";
import { adminDashboard, approveReq, eventApproval, getAllIssues, issueResolved, rejectReq } from "../controller/adminController.js";
import { auth, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

router.get("/event-approval", eventApproval);

router.post("/approve-event", auth, isAdmin, approveReq);
router.post("/reject-event", auth, isAdmin, rejectReq);

router.get("/get-dashboard", auth, isAdmin, adminDashboard);

router.get("/get-all-issues", auth, isAdmin, getAllIssues);
router.post("/resolve-issue", auth, isAdmin, issueResolved);

export default router;
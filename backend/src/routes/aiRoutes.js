import express from "express";
const router = express.Router();

import { aiResponse } from "../controller/aiController.js";

router.post("/response", aiResponse);

export default router;
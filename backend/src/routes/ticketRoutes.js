import express from 'express';
const router = express.Router();

import { generateTicketPDF } from '../controller/ticketController.js';

router.post('/download', generateTicketPDF);
 
export default router;
import express from 'express';
const router = express.Router();
import { upload } from '../middlewares/multer.js';

import { generateTktQR, getOrders, likeEvent, unlikeEvent, submitIssue } from '../controller/userController.js';

router.get('/get-orders/:userId', getOrders);

router
    .route('/events/like')
    .post(likeEvent)
    .delete(unlikeEvent);


router.get('/getQR/:orderId', generateTktQR);

router.post('/submit-issue', upload.single('image'), submitIssue);

export default router;
import express from 'express';
import {
  getEventApplications,
  createEventApplication,
  checkEventApplication,
  getSingleEventApplication,
  deleteEventApplication,
} from '../controllers/BusinessApply';

const router = express.Router();

router.get('/', getEventApplications);

router.post('/apply', createEventApplication);

router.post('/check', checkEventApplication);

router.post('/get', getSingleEventApplication);

router.delete('/delete', deleteEventApplication);

export default router;

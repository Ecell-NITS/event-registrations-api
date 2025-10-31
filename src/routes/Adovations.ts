import { Router } from 'express';
import {
  createAdovationApplication,
  getAdovationApplications,
  checkAdovationApplication,
  deleteAdovationApplication,
} from '../controllers/Adovation';

const router = Router();

router.post('/apply', createAdovationApplication);
router.get('/all', getAdovationApplications);
router.post('/check', checkAdovationApplication);
router.delete('/delete', deleteAdovationApplication);

export default router;

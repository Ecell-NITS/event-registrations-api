import express from 'express';
import {
  getTreasureApplications,
  createTreasureApplication,
  checkTreasureApplication,
  deleteTreasureApplication,
} from '../controllers/treasureApply';

const router = express.Router();

router.get('/', getTreasureApplications);
router.post('/create', createTreasureApplication);
router.post('/check', checkTreasureApplication);
router.delete('/delete', deleteTreasureApplication);

export default router;

import express from 'express';
import {
  createBidWise,
  getBidWiseTeams,
  checkBidWise,
  getSingleBidWise,
  deleteBidWise,
} from '../controllers/Bid-Wise';

const router = express.Router();

router.post('/register', createBidWise);
router.get('/all', getBidWiseTeams);
router.post('/check', checkBidWise);
router.post('/single', getSingleBidWise);
router.delete('/delete', deleteBidWise);

export default router;

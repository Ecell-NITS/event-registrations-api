/* eslint-disable no-console */
/* eslint-disable prettier/prettier */
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import BusinessApply from './src/routes/BusinessApply';
import treasureApply from './src/routes/TreasureApply';
import BidWiseApply from './src/routes/Bid-Wise';
import AdovationApply from './src/routes/Adovations';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to MongoDB with Prisma');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1); // Exit the process if the connection fails
  }
}

connectToDatabase();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Route configurations
app.use('/business', BusinessApply);
app.use('/treasure', treasureApply);
app.use('/bid-wise', BidWiseApply);
app.use('/adovations', AdovationApply);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

import express from 'express';
// import userRouter from './routes/user';

const app = express();

app.use(express.json());
// app.use('/api/users', userRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default app;

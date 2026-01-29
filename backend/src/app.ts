import express, { Request, Response } from 'express';
import cors from 'cors';
import { sessionsRouter } from './routes/sessions';

export const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', sessionsRouter);

export default app;

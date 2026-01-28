import express, { Request, Response } from 'express';
import cors from 'cors';
import transcriptsRouter from './routes/transcripts';
import { errorHandler } from './middleware/errorHandler';

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

// API Routes
app.use('/api', transcriptsRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

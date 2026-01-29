import { Router, Request, Response } from 'express';
import { listSessions } from '../services/sessionService';

export const sessionsRouter = Router();

/**
 * GET /api/sessions
 * Returns a list of all available sessions from S3
 */
sessionsRouter.get('/sessions', async (_req: Request, res: Response) => {
  try {
    const sessions = await listSessions();

    res.status(200).json({
      sessions,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    res.status(500).json({
      error: errorMessage,
    });
  }
});

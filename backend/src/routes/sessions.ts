import { Router, Request, Response } from 'express';
import { listSessions, getTranscript } from '../services/sessionService';

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

/**
 * GET /api/transcripts/:sessionId
 * Returns transcript records for a specific session
 */
sessionsRouter.get('/transcripts/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const records = await getTranscript(sessionId);

    res.status(200).json({
      sessionId,
      records,
    });
  } catch (error: any) {
    // Handle NoSuchKey error as 404
    if (error.name === 'NoSuchKey') {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    // All other errors as 500
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      error: errorMessage,
    });
  }
});

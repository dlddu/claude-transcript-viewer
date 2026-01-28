import { Router, Request, Response } from 'express';
import * as s3Service from '../services/s3Service';
import { parseJsonl } from '../utils/jsonlParser';
import { asyncHandler } from '../middleware/errorHandler';
import {
  SessionListResponse,
  TranscriptResponse,
  SubagentListResponse,
  SubagentTranscriptResponse,
  ApiError,
} from '../types/transcript';

const router = Router();

function isValidId(id: string): boolean {
  return !id.includes('..') && !id.includes('/');
}

// GET /api/sessions
router.get(
  '/sessions',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const sessions = await s3Service.listSessions();
    const response: SessionListResponse = { sessions };
    res.status(200).json(response);
  })
);

// GET /api/transcripts/:sessionId
router.get(
  '/transcripts/:sessionId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;

    if (!isValidId(sessionId)) {
      const error: ApiError = {
        error: 'BadRequest',
        message: 'Invalid session ID format',
        statusCode: 400,
      };
      res.status(400).json(error);
      return;
    }

    try {
      const key = `${sessionId}.jsonl`;
      const content = await s3Service.getTranscript(key);
      const records = parseJsonl(content);
      const subagentIds = await s3Service.listSubagents(sessionId);

      const response: TranscriptResponse = {
        sessionId,
        records,
        subagentIds,
      };
      res.status(200).json(response);
    } catch (err) {
      const error = err as { name?: string };
      if (error.name === 'NoSuchKey') {
        const apiError: ApiError = {
          error: 'NotFound',
          message: `Session '${sessionId}' not found`,
          statusCode: 404,
        };
        res.status(404).json(apiError);
        return;
      }
      throw err;
    }
  })
);

// GET /api/transcripts/:sessionId/subagents
router.get(
  '/transcripts/:sessionId/subagents',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;

    if (!isValidId(sessionId)) {
      const error: ApiError = {
        error: 'BadRequest',
        message: 'Invalid session ID format',
        statusCode: 400,
      };
      res.status(400).json(error);
      return;
    }

    const subagentIds = await s3Service.listSubagents(sessionId);
    const response: SubagentListResponse = {
      sessionId,
      subagentIds,
    };
    res.status(200).json(response);
  })
);

// GET /api/transcripts/:sessionId/subagents/:agentId
router.get(
  '/transcripts/:sessionId/subagents/:agentId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId, agentId } = req.params;

    if (!isValidId(sessionId)) {
      const error: ApiError = {
        error: 'BadRequest',
        message: 'Invalid session ID format',
        statusCode: 400,
      };
      res.status(400).json(error);
      return;
    }

    if (!isValidId(agentId)) {
      const error: ApiError = {
        error: 'BadRequest',
        message: 'Invalid agent ID format',
        statusCode: 400,
      };
      res.status(400).json(error);
      return;
    }

    try {
      const content = await s3Service.getSubagentTranscript(sessionId, agentId);
      const records = parseJsonl(content);

      const response: SubagentTranscriptResponse = {
        sessionId,
        agentId,
        records,
      };
      res.status(200).json(response);
    } catch (err) {
      const error = err as { name?: string };
      if (error.name === 'NoSuchKey') {
        const apiError: ApiError = {
          error: 'NotFound',
          message: `Subagent '${agentId}' not found for session '${sessionId}'`,
          statusCode: 404,
        };
        res.status(404).json(apiError);
        return;
      }
      throw err;
    }
  })
);

export default router;

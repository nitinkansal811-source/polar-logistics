import { Request, Response } from 'express';
import { DbStore } from '../services/dbStore.js';

export const processBatchSync = async (req: Request, res: Response) => {
  const { actions } = req.body;
  if (!actions || !Array.isArray(actions)) {
    return res.status(400).json({ error: 'Payload must include an "actions" array' });
  }

  const store = DbStore.getInstance();
  const summary = await store.processSyncBatch(actions);

  return res.json({
    message: `Batch sync complete: ${summary.processed} actions synced, ${summary.failed} failed.`,
    ...summary
  });
};

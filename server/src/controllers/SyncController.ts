import { Request, Response, NextFunction } from 'express';
import * as SyncService from '../services/SyncService';
// Uses global augmentation for req.user

/**
 * Handles sync requests, fetching changes since the last sync timestamp.
 */
export async function getChanges(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get last sync timestamp from query parameter 'since'
    // The client should send the timestamp in milliseconds since epoch
    let lastSyncTimestampMs: number | null = null;
    const sinceQueryParam = req.query.since as string | undefined;

    if (sinceQueryParam) {
        const parsedTimestamp = parseInt(sinceQueryParam, 10);
        // Validate timestamp format only if the parameter exists
        if (isNaN(parsedTimestamp) || parsedTimestamp < 0) {
            res.status(400).json({ message: 'Invalid timestamp format. Use milliseconds since epoch.' });
            return;
        }
        lastSyncTimestampMs = parsedTimestamp;
    }
    // If sinceQueryParam is undefined, lastSyncTimestampMs remains null (initial sync)

    // Convert milliseconds to ISO string for database query, handle null for initial sync
    const lastSyncTimestampISO = lastSyncTimestampMs ? new Date(lastSyncTimestampMs).toISOString() : null;

    console.log(`Sync request for user ${userId}, since: ${lastSyncTimestampISO || 'Initial Sync'}`);

    const changes = await SyncService.getChangesSince(userId, lastSyncTimestampISO);

    res.status(200).json(changes);

  } catch (error) {
    next(error); // Pass errors to the global error handler
  }
}
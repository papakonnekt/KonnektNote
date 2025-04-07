import { Router } from 'express';
import * as SyncController from '../controllers/SyncController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication middleware to the sync route
router.use(authenticateToken);

// Define the sync endpoint
// Client should provide last sync timestamp (ms since epoch) as 'since' query param
// e.g., GET /api/sync?since=1678886400000
router.get('/', SyncController.getChanges);

export default router;
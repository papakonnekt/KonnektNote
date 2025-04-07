import express from 'express';
import * as EdgeController from '../controllers/EdgeController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router({ mergeParams: true }); // Enable merging params from parent router (graphs)

// Apply authentication middleware to all edge routes
router.use(authenticateToken);

// Define edge routes relative to /api/graphs/:graphId/edges
router.post('/', EdgeController.create); // POST /api/graphs/:graphId/edges
router.get('/', EdgeController.getAllForGraph); // GET /api/graphs/:graphId/edges
router.put('/:edgeId', EdgeController.update); // PUT /api/graphs/:graphId/edges/:edgeId
router.delete('/:edgeId', EdgeController.remove); // DELETE /api/graphs/:graphId/edges/:edgeId

export default router;
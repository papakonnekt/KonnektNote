import express from 'express';
import * as NodeController from '../controllers/NodeController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router({ mergeParams: true }); // Enable merging params from parent router (graphs)

// Apply authentication middleware to all node routes
router.use(authenticateToken);

// Define node routes relative to /api/graphs/:graphId/nodes
router.post('/', NodeController.create); // POST /api/graphs/:graphId/nodes
router.get('/', NodeController.getAllForGraph); // GET /api/graphs/:graphId/nodes
router.put('/:nodeId', NodeController.update); // PUT /api/graphs/:graphId/nodes/:nodeId
router.delete('/:nodeId', NodeController.remove); // DELETE /api/graphs/:graphId/nodes/:nodeId

export default router;
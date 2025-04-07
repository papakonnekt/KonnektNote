import express from 'express';
import * as GraphController from '../controllers/GraphController';
import { authenticateToken } from '../middleware/authMiddleware'; // Import the middleware

const router = express.Router();

// Apply authentication middleware to all graph routes
router.use(authenticateToken);

// Define graph routes
router.post('/', GraphController.create); // POST /api/graphs
router.get('/', GraphController.getAll); // GET /api/graphs
router.get('/:graphId', GraphController.getOne); // GET /api/graphs/:graphId
router.put('/:graphId', GraphController.update); // PUT /api/graphs/:graphId
router.delete('/:graphId', GraphController.remove); // DELETE /api/graphs/:graphId

// We will mount nested node/edge routes later if needed, or keep them separate

export default router;
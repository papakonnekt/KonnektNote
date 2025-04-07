import { Router } from 'express';
import * as ChecklistController from '../controllers/ChecklistController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication middleware to all checklist routes
router.use(authenticateToken);

// Define CRUD routes for checklists
router.post('/', ChecklistController.create);          // POST /api/checklists
router.get('/', ChecklistController.getAll);           // GET /api/checklists
router.get('/:checklistId', ChecklistController.getOne);    // GET /api/checklists/:checklistId
router.put('/:checklistId', ChecklistController.update);    // PUT /api/checklists/:checklistId
router.delete('/:checklistId', ChecklistController.remove); // DELETE /api/checklists/:checklistId

export default router;
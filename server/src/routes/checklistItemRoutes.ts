import { Router } from 'express';
import * as ChecklistItemController from '../controllers/ChecklistItemController';
import { authenticateToken } from '../middleware/authMiddleware';

// Create a router with mergeParams: true to access :checklistId from the parent router
const router = Router({ mergeParams: true });

// Apply authentication middleware to all checklist item routes
// Note: Authentication is already applied by the parent checklist router usually,
// but applying it here ensures these routes cannot be mounted independently without auth.
router.use(authenticateToken);

// Define CRUD routes for checklist items nested under /api/checklists/:checklistId
router.post('/items', ChecklistItemController.create);             // POST /api/checklists/:checklistId/items
router.get('/items', ChecklistItemController.getAllForChecklist);  // GET /api/checklists/:checklistId/items
router.put('/items/:itemId', ChecklistItemController.update);       // PUT /api/checklists/:checklistId/items/:itemId
router.delete('/items/:itemId', ChecklistItemController.remove);    // DELETE /api/checklists/:checklistId/items/:itemId

// Placeholder for potential reordering route
// router.patch('/items/:itemId/order', ChecklistItemController.updateOrder);

export default router;
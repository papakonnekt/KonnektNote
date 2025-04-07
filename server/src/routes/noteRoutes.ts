import { Router } from 'express';
import * as NoteController from '../controllers/NoteController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication middleware to all note routes
router.use(authenticateToken);

// Define CRUD routes for notes
router.post('/', NoteController.create);          // POST /api/notes
router.get('/', NoteController.getAll);           // GET /api/notes
router.get('/:noteId', NoteController.getOne);    // GET /api/notes/:noteId
router.put('/:noteId', NoteController.update);    // PUT /api/notes/:noteId
router.delete('/:noteId', NoteController.remove); // DELETE /api/notes/:noteId

export default router;
import { Request, Response, NextFunction } from 'express';
import * as NoteService from '../services/NoteService';
// The user property is added globally via declaration merging in types/user.ts

// Controller function to handle creating a new note
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { title, content, tags } = req.body;

    // Basic validation
    if (!content) {
      res.status(400).json({ message: 'Note content is required' });
      return;
    }

    const noteData: NoteService.NewNoteData = { title, content, tags };
    const newNote = await NoteService.createNote(userId, noteData);
    res.status(201).json(newNote);
  } catch (error) {
    next(error); // Pass errors to the global error handler
  }
}

// Controller function to get all notes for the authenticated user
export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const notes = await NoteService.getNotesByUserId(userId);
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
}

// Controller function to get a single note by ID
export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const noteId = parseInt(req.params.noteId, 10);

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    if (isNaN(noteId)) {
        res.status(400).json({ message: 'Invalid note ID format' });
        return;
    }

    const note = await NoteService.getNoteById(noteId, userId);

    if (!note) {
      res.status(404).json({ message: 'Note not found or access denied' });
    } else {
      res.status(200).json(note);
    }
  } catch (error) {
    next(error);
  }
}

// Controller function to update a note by ID
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const noteId = parseInt(req.params.noteId, 10);
    // Extract potential fields including image_url
    const { title, content, tags, image_url } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
     if (isNaN(noteId)) {
        res.status(400).json({ message: 'Invalid note ID format' });
        return;
    }

    // Ensure at least one field is being updated (including image_id)
    if (title === undefined && content === undefined && tags === undefined && image_url === undefined) {
        res.status(400).json({ message: 'No update data provided' });
        return;
    }

    const updateData: NoteService.UpdateNoteData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    // Handle image_url: allow setting to a string or null (to unlink)
    if (image_url !== undefined) {
        // Basic validation: check if it's a string or null
        if (typeof image_url !== 'string' && image_url !== null) {
             res.status(400).json({ message: 'Invalid image_url format' });
             return;
        }
        // TODO: Add more robust validation? Check if it looks like a path?
        updateData.image_url = image_url;
    }

    const updatedNote = await NoteService.updateNote(noteId, userId, updateData);

    if (!updatedNote) {
      res.status(404).json({ message: 'Note not found or access denied' });
    } else {
      res.status(200).json(updatedNote);
    }
  } catch (error) {
    next(error);
  }
}

// Controller function to delete a note by ID
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const noteId = parseInt(req.params.noteId, 10);

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
     if (isNaN(noteId)) {
        res.status(400).json({ message: 'Invalid note ID format' });
        return;
    }

    const deletedCount = await NoteService.deleteNote(noteId, userId);

    if (deletedCount === 0) {
      res.status(404).json({ message: 'Note not found or access denied' });
    } else {
      res.status(204).send(); // No content on successful deletion
    }
  } catch (error) {
    next(error);
  }
}
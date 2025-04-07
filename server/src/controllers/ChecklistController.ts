import { Request, Response, NextFunction } from 'express';
import * as ChecklistService from '../services/ChecklistService';
// The user property is added globally via declaration merging in types/user.ts

// Controller function to handle creating a new checklist
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { title } = req.body;
    if (!title) {
      res.status(400).json({ message: 'Checklist title is required' });
      return;
    }

    const checklistData: ChecklistService.ChecklistData = { title };
    const newChecklist = await ChecklistService.createChecklist(userId, checklistData);
    res.status(201).json(newChecklist);
  } catch (error) {
    next(error);
  }
}

// Controller function to get all checklists for the authenticated user
export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const checklists = await ChecklistService.getChecklistsByUserId(userId);
    res.status(200).json(checklists);
  } catch (error) {
    next(error);
  }
}

// Controller function to get a single checklist by ID
export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const checklistId = parseInt(req.params.checklistId, 10);

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    if (isNaN(checklistId)) {
        res.status(400).json({ message: 'Invalid checklist ID format' });
        return;
    }

    const checklist = await ChecklistService.getChecklistById(checklistId, userId);

    if (!checklist) {
      res.status(404).json({ message: 'Checklist not found or access denied' });
    } else {
      res.status(200).json(checklist);
    }
  } catch (error) {
    next(error);
  }
}

// Controller function to update a checklist by ID
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const checklistId = parseInt(req.params.checklistId, 10);
    const { title } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    if (isNaN(checklistId)) {
        res.status(400).json({ message: 'Invalid checklist ID format' });
        return;
    }
    if (!title) {
        res.status(400).json({ message: 'Checklist title is required for update' });
        return;
    }

    const checklistData: ChecklistService.ChecklistData = { title };
    const updatedChecklist = await ChecklistService.updateChecklist(checklistId, userId, checklistData);

    if (!updatedChecklist) {
      res.status(404).json({ message: 'Checklist not found or access denied' });
    } else {
      res.status(200).json(updatedChecklist);
    }
  } catch (error) {
    next(error);
  }
}

// Controller function to delete a checklist by ID
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const checklistId = parseInt(req.params.checklistId, 10);

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    if (isNaN(checklistId)) {
        res.status(400).json({ message: 'Invalid checklist ID format' });
        return;
    }

    const deletedCount = await ChecklistService.deleteChecklist(checklistId, userId);

    if (deletedCount === 0) {
      res.status(404).json({ message: 'Checklist not found or access denied' });
    } else {
      res.status(204).send(); // No content on successful deletion
    }
  } catch (error) {
    next(error);
  }
}
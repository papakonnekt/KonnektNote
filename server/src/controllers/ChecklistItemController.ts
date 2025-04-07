import { Request, Response, NextFunction } from 'express';
import * as ChecklistItemService from '../services/ChecklistItemService';
// Uses global augmentation for req.user

// Controller function to handle creating a new checklist item
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const checklistId = parseInt(req.params.checklistId, 10);
    const { content, parent_item_id } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    if (isNaN(checklistId)) {
      res.status(400).json({ message: 'Invalid checklist ID format' });
      return;
    }
    if (!content) {
      res.status(400).json({ message: 'Checklist item content is required' });
      return;
    }
    // Optional: Validate parent_item_id if provided

    const itemData: ChecklistItemService.NewChecklistItemData = {
        content,
        parent_item_id: parent_item_id ? parseInt(parent_item_id, 10) : null
    };

    // Checklist ownership is verified within the service function
    const newItem = await ChecklistItemService.createItem(checklistId, userId, itemData);
    res.status(201).json(newItem);
  } catch (error) {
    // Handle specific errors like 'Checklist not found or access denied'
     if (error instanceof Error && error.message === 'Checklist not found or access denied') {
        res.status(404).json({ message: error.message });
    } else {
        next(error); // Pass other errors to the global handler
    }
  }
}

// Controller function to get all items for a specific checklist
export async function getAllForChecklist(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    // Checklist ownership is verified within the service function
    const items = await ChecklistItemService.getItemsByChecklistId(checklistId, userId);
    res.status(200).json(items);
  } catch (error) {
     if (error instanceof Error && error.message === 'Checklist not found or access denied') {
        res.status(404).json({ message: error.message });
    } else {
        next(error);
    }
  }
}

// Controller function to update a checklist item by ID
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const checklistId = parseInt(req.params.checklistId, 10);
    const itemId = parseInt(req.params.itemId, 10);
    // Extract potential fields including image_url
    const { content, is_completed, parent_item_id, image_url } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    if (isNaN(checklistId) || isNaN(itemId)) {
        res.status(400).json({ message: 'Invalid checklist or item ID format' });
        return;
    }
    // Ensure at least one field is being updated (including image_url)
    if (content === undefined && is_completed === undefined && parent_item_id === undefined && image_url === undefined) {
        res.status(400).json({ message: 'No update data provided' });
        return;
    }

    const updateData: ChecklistItemService.UpdateChecklistItemData = {};
    if (content !== undefined) updateData.content = content;
    if (is_completed !== undefined) updateData.is_completed = Boolean(is_completed);
    if (parent_item_id !== undefined) updateData.parent_item_id = parent_item_id ? parseInt(parent_item_id, 10) : null;
    // Handle image_url: allow setting to a string or null (to unlink)
    if (image_url !== undefined) {
         if (typeof image_url !== 'string' && image_url !== null) {
             res.status(400).json({ message: 'Invalid image_url format' });
             return;
        }
        updateData.image_url = image_url;
    }

    // Checklist ownership is verified within the service function
    const updatedItem = await ChecklistItemService.updateItem(itemId, checklistId, userId, updateData);

    if (!updatedItem) {
      // This could be due to checklist access denial or item not found within that checklist
      res.status(404).json({ message: 'Checklist item not found or access denied' });
    } else {
      res.status(200).json(updatedItem);
    }
  } catch (error) {
     if (error instanceof Error && error.message === 'Checklist not found or access denied') {
        // This error comes from verifyChecklistOwnership if the checklist itself is invalid
        res.status(404).json({ message: error.message });
    } else {
        next(error);
    }
  }
}

// Controller function to delete a checklist item by ID
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const checklistId = parseInt(req.params.checklistId, 10);
    const itemId = parseInt(req.params.itemId, 10);

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
     if (isNaN(checklistId) || isNaN(itemId)) {
        res.status(400).json({ message: 'Invalid checklist or item ID format' });
        return;
    }

    // Checklist ownership is verified within the service function
    const deletedCount = await ChecklistItemService.deleteItem(itemId, checklistId, userId);

    if (deletedCount === 0) {
      res.status(404).json({ message: 'Checklist item not found or access denied' });
    } else {
      res.status(204).send(); // No content on successful deletion
    }
  } catch (error) {
     if (error instanceof Error && error.message === 'Checklist not found or access denied') {
        res.status(404).json({ message: error.message });
    } else {
        next(error);
    }
  }
}

// Placeholder for reordering controller if needed later
// export async function updateOrder(req: Request, res: Response, next: NextFunction): Promise<void> { ... }
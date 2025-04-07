import db from '../db'; // Knex instance
import { getChecklistById } from './ChecklistService'; // To verify checklist ownership

// Define the structure of a Checklist Item
export interface ChecklistItem {
  id: number;
  checklist_id: number;
  parent_item_id: number | null;
  content: string;
  is_completed: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  image_url: string | null; // Use image_url instead of image_id
  deleted_at?: string | Date | null; // Add deleted_at
}

// Define the structure for creating a new item
export interface NewChecklistItemData {
  content: string;
  parent_item_id?: number | null;
  // order will be calculated
}

// Define the structure for updating an existing item
export interface UpdateChecklistItemData {
  content?: string;
  is_completed?: boolean;
  parent_item_id?: number | null; // Allow changing parent
  image_url?: string | null; // Allow updating/unsetting image_url
  // order updates handled separately
}

const TABLE_NAME = 'checklist_items';

/**
 * Helper function to check if a user owns the checklist an item belongs to.
 * Throws an error if the checklist doesn't exist or isn't owned by the user.
 * @param checklistId - The ID of the checklist.
 * @param userId - The ID of the user.
 */
async function verifyChecklistOwnership(checklistId: number, userId: number): Promise<void> {
  const checklist = await getChecklistById(checklistId, userId);
  if (!checklist) {
    throw new Error('Checklist not found or access denied');
  }
}

/**
 * Calculates the next order value for a new item in a checklist.
 * @param checklistId - The ID of the checklist.
 * @param parentItemId - The ID of the parent item (null for top-level).
 * @returns The next order value.
 */
async function getNextOrder(checklistId: number, parentItemId: number | null): Promise<number> {
  const query = db(TABLE_NAME)
    .where({ checklist_id: checklistId });

  if (parentItemId === null || parentItemId === undefined) {
    query.whereNull('parent_item_id');
  } else {
    query.where({ parent_item_id: parentItemId });
  }

  const result = await query.max('order as maxOrder').first();
  return (result?.maxOrder || 0) + 1;
}


/**
 * Creates a new checklist item within a specific checklist, ensuring user ownership.
 * @param checklistId - The ID of the checklist to add the item to.
 * @param userId - The ID of the user creating the item.
 * @param itemData - The data for the new item (content, optional parent_item_id).
 * @returns The newly created checklist item object.
 */
export async function createItem(checklistId: number, userId: number, itemData: NewChecklistItemData): Promise<ChecklistItem> {
  await verifyChecklistOwnership(checklistId, userId); // Check ownership first

  const nextOrder = await getNextOrder(checklistId, itemData.parent_item_id || null);

  const [newItem] = await db(TABLE_NAME)
    .insert({
      checklist_id: checklistId,
      parent_item_id: itemData.parent_item_id,
      content: itemData.content,
      order: nextOrder,
      is_completed: false, // Default
    })
    .returning('*');
  return newItem;
}

/**
 * Retrieves all items for a specific checklist, ensuring user ownership.
 * Items are ordered by their 'order' field.
 * @param checklistId - The ID of the checklist whose items are to be retrieved.
 * @param userId - The ID of the user requesting the items.
 * @returns An array of checklist item objects.
 */
export async function getItemsByChecklistId(checklistId: number, userId: number): Promise<ChecklistItem[]> {
  await verifyChecklistOwnership(checklistId, userId); // Check ownership first

  return db(TABLE_NAME)
    .where({ checklist_id: checklistId })
    .whereNull('deleted_at') // Exclude deleted
    .orderBy('order', 'asc');
}

/**
 * Updates an existing checklist item, ensuring user ownership of the parent checklist.
 * @param itemId - The ID of the item to update.
 * @param checklistId - The ID of the checklist the item belongs to.
 * @param userId - The ID of the user requesting the update.
 * @param updateData - An object containing the fields to update (content, is_completed, parent_item_id).
 * @returns The updated checklist item object if found and updated, otherwise undefined.
 */
export async function updateItem(itemId: number, checklistId: number, userId: number, updateData: UpdateChecklistItemData): Promise<ChecklistItem | undefined> {
  await verifyChecklistOwnership(checklistId, userId); // Check ownership first

  // Ensure there's something to update
  if (Object.keys(updateData).length === 0) {
     const currentItem = await db(TABLE_NAME).where({ id: itemId, checklist_id: checklistId }).first();
     return currentItem;
  }

  const dataToUpdate = {
    ...updateData,
    updated_at: db.fn.now(),
  };

  // Prevent updating checklist_id directly
  delete (dataToUpdate as any).checklist_id;

  const [updatedItem] = await db(TABLE_NAME)
    .where({ id: itemId, checklist_id: checklistId }) // Ensure item belongs to the specified checklist
    .update(dataToUpdate)
    .returning('*');

  return updatedItem;
}

/**
 * Deletes a checklist item by its ID, ensuring user ownership of the parent checklist.
 * @param itemId - The ID of the item to delete.
 * @param checklistId - The ID of the checklist the item belongs to.
 * @param userId - The ID of the user requesting the deletion.
 * @returns The number of rows deleted (0 or 1).
 */
export async function deleteItem(itemId: number, checklistId: number, userId: number): Promise<number> {
  await verifyChecklistOwnership(checklistId, userId); // Check ownership first

  // Need to ensure the item actually belongs to the checklist before deleting
  // Ensure the item exists in this checklist and is not already deleted
  const item = await db(TABLE_NAME)
      .where({ id: itemId, checklist_id: checklistId })
      .whereNull('deleted_at')
      .first('id');
  if (!item) {
      return 0; // Item not found, not owned, or already deleted
  }

  return db(TABLE_NAME)
    .where({ id: itemId }) // Delete by item ID
    // .del(); // Replace with soft delete
    .update({ deleted_at: db.fn.now() });
}

/**
 * Updates the order of items. (Placeholder - Complex logic needed)
 * This often requires fetching siblings, calculating new orders, and updating multiple rows in a transaction.
 * The exact implementation depends heavily on the desired UX (e.g., drag-and-drop library).
 * @param itemId - The ID of the item being moved.
 * @param checklistId - The ID of the checklist.
 * @param userId - The ID of the user.
 * @param newOrder - The target order position (or potentially the ID of the item it should be placed after).
 */
export async function updateItemOrder(itemId: number, checklistId: number, userId: number, newOrderData: any): Promise<void> {
    await verifyChecklistOwnership(checklistId, userId);
    console.warn('updateItemOrder function is not fully implemented.');
    // TODO: Implement complex reordering logic, likely involving transactions.
    // Fetch the item being moved.
    // Fetch siblings based on parent_item_id.
    // Determine the actual numeric order values based on newOrderData (e.g., index, target sibling ID).
    // Update the 'order' field of the moved item and potentially shift orders of other items.
    // Use db.transaction() to ensure atomicity.
    throw new Error('Reordering not implemented yet.');
}
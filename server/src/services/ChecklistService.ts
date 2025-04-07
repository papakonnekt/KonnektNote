import db from '../db'; // Knex instance

// Define the structure of a Checklist
export interface Checklist {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | Date | null; // Add deleted_at
}

// Define the structure for creating/updating a checklist
export interface ChecklistData {
  title: string;
}

const TABLE_NAME = 'checklists';

/**
 * Creates a new checklist for a specific user.
 * @param userId - The ID of the user creating the checklist.
 * @param checklistData - The data for the new checklist (title).
 * @returns The newly created checklist object.
 */
export async function createChecklist(userId: number, checklistData: ChecklistData): Promise<Checklist> {
  const [newChecklist] = await db(TABLE_NAME)
    .insert({
      user_id: userId,
      title: checklistData.title,
    })
    .returning('*');
  return newChecklist;
}

/**
 * Retrieves all checklists for a specific user.
 * @param userId - The ID of the user whose checklists are to be retrieved.
 * @returns An array of checklist objects.
 */
export async function getChecklistsByUserId(userId: number): Promise<Checklist[]> {
  return db(TABLE_NAME)
    .where({ user_id: userId })
    .whereNull('deleted_at') // Exclude deleted
    .orderBy('updated_at', 'desc');
}

/**
 * Retrieves a single checklist by its ID, ensuring it belongs to the specified user.
 * @param checklistId - The ID of the checklist to retrieve.
 * @param userId - The ID of the user requesting the checklist.
 * @returns The checklist object if found and owned by the user, otherwise undefined.
 */
export async function getChecklistById(checklistId: number, userId: number): Promise<Checklist | undefined> {
  return db(TABLE_NAME)
    .where({ id: checklistId, user_id: userId })
    .whereNull('deleted_at') // Exclude deleted
    .first();
}

/**
 * Updates an existing checklist's title, ensuring it belongs to the specified user.
 * @param checklistId - The ID of the checklist to update.
 * @param userId - The ID of the user requesting the update.
 * @param checklistData - An object containing the new title.
 * @returns The updated checklist object if found and updated, otherwise undefined.
 */
export async function updateChecklist(checklistId: number, userId: number, checklistData: ChecklistData): Promise<Checklist | undefined> {
  const dataToUpdate = {
    ...checklistData,
    updated_at: db.fn.now(),
  };

  const [updatedChecklist] = await db(TABLE_NAME)
    .where({ id: checklistId, user_id: userId })
    .update(dataToUpdate)
    .returning('*');

  return updatedChecklist;
}

/**
 * Deletes a checklist by its ID, ensuring it belongs to the specified user.
 * This will also cascade delete associated checklist items due to DB constraints.
 * @param checklistId - The ID of the checklist to delete.
 * @param userId - The ID of the user requesting the deletion.
 * @returns The number of rows deleted (0 or 1).
 */
export async function deleteChecklist(checklistId: number, userId: number): Promise<number> {
  return db(TABLE_NAME)
    .where({ id: checklistId, user_id: userId })
    // .del(); // Replace with soft delete
    .update({ deleted_at: db.fn.now() });
}
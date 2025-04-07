import db from '../db'; // Knex instance

// Define the structure of a Note (matching the database schema)
export interface Note {
  id: number;
  user_id: number;
  title: string | null;
  content: string;
  tags: string | null; // Assuming tags are stored as a JSON string or comma-separated
  created_at: string; // ISO string format
  updated_at: string; // ISO string format
  image_url: string | null; // Use image_url instead of image_id
  deleted_at?: string | Date | null; // Add deleted_at
}

// Define the structure for creating a new note
export interface NewNoteData {
  title?: string | null;
  content: string;
  tags?: string | null;
}

// Define the structure for updating an existing note
export interface UpdateNoteData {
  title?: string | null;
  content?: string;
  tags?: string | null;
  image_url?: string | null; // Allow updating/unsetting image_url
}

const TABLE_NAME = 'notes';

/**
 * Creates a new note for a specific user.
 * @param userId - The ID of the user creating the note.
 * @param noteData - The data for the new note (title, content, tags).
 * @returns The newly created note object.
 */
export async function createNote(userId: number, noteData: NewNoteData): Promise<Note> {
  const [newNote] = await db(TABLE_NAME)
    .insert({
      user_id: userId,
      title: noteData.title,
      content: noteData.content,
      tags: noteData.tags,
      // created_at and updated_at will use default values
    })
    .returning('*'); // Return all columns of the newly created row
  return newNote;
}

/**
 * Retrieves all notes (or a summary) for a specific user.
 * @param userId - The ID of the user whose notes are to be retrieved.
 * @returns An array of note objects (consider selecting fewer columns for list views).
 */
export async function getNotesByUserId(userId: number): Promise<Note[]> {
  // Select specific columns for efficiency if needed for a list view
  // e.g., .select('id', 'title', 'updated_at')
  return db(TABLE_NAME)
    .where({ user_id: userId })
    .whereNull('deleted_at') // Exclude deleted
    .orderBy('updated_at', 'desc');
}

/**
 * Retrieves a single note by its ID, ensuring it belongs to the specified user.
 * @param noteId - The ID of the note to retrieve.
 * @param userId - The ID of the user requesting the note.
 * @returns The note object if found and owned by the user, otherwise undefined.
 */
export async function getNoteById(noteId: number, userId: number): Promise<Note | undefined> {
  return db(TABLE_NAME)
    .where({ id: noteId, user_id: userId })
    .whereNull('deleted_at') // Exclude deleted
    .first(); // Use .first() to get a single object or undefined
}

/**
 * Updates an existing note, ensuring it belongs to the specified user.
 * @param noteId - The ID of the note to update.
 * @param userId - The ID of the user requesting the update.
 * @param updateData - An object containing the fields to update (title, content, tags).
 * @returns The updated note object if found and updated, otherwise undefined.
 */
export async function updateNote(noteId: number, userId: number, updateData: UpdateNoteData): Promise<Note | undefined> {
  // Ensure there's something to update
  if (Object.keys(updateData).length === 0) {
    return getNoteById(noteId, userId); // Return current note if no updates
  }

  const dataToUpdate = {
    ...updateData,
    updated_at: db.fn.now(), // Update the timestamp
  };

  const [updatedNote] = await db(TABLE_NAME)
    .where({ id: noteId, user_id: userId }) // Ensure ownership
    .update(dataToUpdate)
    .returning('*'); // Return the updated note

  return updatedNote;
}

/**
 * Deletes a note by its ID, ensuring it belongs to the specified user.
 * @param noteId - The ID of the note to delete.
 * @param userId - The ID of the user requesting the deletion.
 * @returns The number of rows deleted (0 or 1).
 */
export async function deleteNote(noteId: number, userId: number): Promise<number> {
  return db(TABLE_NAME)
    .where({ id: noteId, user_id: userId }) // Ensure ownership
    // .del(); // Replace with soft delete
    .update({ deleted_at: db.fn.now() });
}
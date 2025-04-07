import apiClient from './apiClient';

// Define Note types (consider sharing with backend types)
export interface Note { // Export the interface
  id: number;
  user_id: number;
  title?: string | null;
  content?: string | null;
  tags?: string | null; // Assuming tags are stored as a simple string for now
  image_url?: string | null; // Use image_url instead of image_id
  created_at: string | Date;
  updated_at: string | Date;
}

export interface NewNoteData { // Export the interface
  title?: string | null;
  content?: string | null;
  // tags might be handled separately or included here
}

export interface UpdateNoteData extends Partial<NewNoteData> { // Export the interface
    image_url?: string | null; // Allow linking/unlinking image via URL
}


/**
 * Fetches all notes for the authenticated user.
 */
export const getNotes = async (): Promise<Note[]> => {
  try {
    // Assuming backend returns necessary fields for list view
    const response = await apiClient.get<Note[]>('/notes');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    throw error;
  }
};

/**
 * Fetches a single note by its ID.
 */
export const getNote = async (noteId: number): Promise<Note> => {
  try {
    const response = await apiClient.get<Note>(`/notes/${noteId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch note ${noteId}:`, error);
    throw error;
  }
};

/**
 * Creates a new note.
 */
export const createNote = async (noteData: NewNoteData): Promise<Note> => {
  try {
    const response = await apiClient.post<Note>('/notes', noteData);
    return response.data;
  } catch (error) {
    console.error('Failed to create note:', error);
    throw error;
  }
};

/**
 * Updates an existing note.
 */
export const updateNote = async (
  noteId: number,
  updateData: UpdateNoteData
): Promise<Note> => {
  try {
    const response = await apiClient.put<Note>(`/notes/${noteId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update note ${noteId}:`, error);
    throw error;
  }
};

/**
 * Deletes a note.
 */
export const deleteNote = async (noteId: number): Promise<void> => {
  try {
    await apiClient.delete(`/notes/${noteId}`);
  } catch (error) {
    console.error(`Failed to delete note ${noteId}:`, error);
    throw error;
  }
};
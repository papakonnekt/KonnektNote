import apiClient from './apiClient'; // Assuming apiClient is configured

// Define types based on backend (adjust if needed)
export interface Checklist {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistData {
  title: string;
}

const BASE_URL = '/checklists';

/**
 * Fetches all checklists for the logged-in user.
 */
export const getChecklists = async (): Promise<Checklist[]> => {
  const response = await apiClient.get<Checklist[]>(BASE_URL);
  return response.data;
};

/**
 * Fetches a single checklist by its ID.
 */
export const getChecklist = async (checklistId: number): Promise<Checklist> => {
  const response = await apiClient.get<Checklist>(`${BASE_URL}/${checklistId}`);
  return response.data;
};

/**
 * Creates a new checklist.
 */
export const createChecklist = async (checklistData: ChecklistData): Promise<Checklist> => {
  const response = await apiClient.post<Checklist>(BASE_URL, checklistData);
  return response.data;
};

/**
 * Updates an existing checklist's title.
 */
export const updateChecklist = async (checklistId: number, checklistData: ChecklistData): Promise<Checklist> => {
  const response = await apiClient.put<Checklist>(`${BASE_URL}/${checklistId}`, checklistData);
  return response.data;
};

/**
 * Deletes a checklist by its ID.
 */
export const deleteChecklist = async (checklistId: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${checklistId}`);
};

// Note: getChecklistWithItems is removed as items are fetched separately now.
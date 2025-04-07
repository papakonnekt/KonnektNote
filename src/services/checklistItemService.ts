import apiClient from './apiClient'; // Assuming apiClient is configured

// Define types based on backend (adjust if needed)
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
}

// Data for creating a new item
export interface NewChecklistItemData {
  content: string;
  parent_item_id?: number | null;
}

// Data for updating an existing item
export interface UpdateChecklistItemData {
  content?: string;
  is_completed?: boolean;
  parent_item_id?: number | null;
  image_url?: string | null; // Allow updating/unsetting image_url
}

const getItemsUrl = (checklistId: number) => `/checklists/${checklistId}/items`;
const getItemUrl = (checklistId: number, itemId: number) => `/checklists/${checklistId}/items/${itemId}`;

/**
 * Fetches all items for a specific checklist.
 */
export const getItems = async (checklistId: number): Promise<ChecklistItem[]> => {
  const response = await apiClient.get<ChecklistItem[]>(getItemsUrl(checklistId));
  return response.data;
};

/**
 * Creates a new item within a checklist.
 */
export const createItem = async (checklistId: number, itemData: NewChecklistItemData): Promise<ChecklistItem> => {
  const response = await apiClient.post<ChecklistItem>(getItemsUrl(checklistId), itemData);
  return response.data;
};

/**
 * Updates an existing checklist item.
 */
export const updateItem = async (checklistId: number, itemId: number, updateData: UpdateChecklistItemData): Promise<ChecklistItem> => {
  const response = await apiClient.put<ChecklistItem>(getItemUrl(checklistId, itemId), updateData);
  return response.data;
};

/**
 * Deletes a checklist item by its ID.
 */
export const deleteItem = async (checklistId: number, itemId: number): Promise<void> => {
  await apiClient.delete(getItemUrl(checklistId, itemId));
};

// Note: updateItemOrder service function might be needed later if implementing drag-and-drop
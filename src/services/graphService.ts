import apiClient from './apiClient';

// Define Graph types (consider sharing with backend types)
export interface Graph { // Export the interface
  id: number;
  user_id: number;
  title: string;
  created_at: string | Date;
  updated_at: string | Date;
}

interface NewGraphData {
  title: string;
}

/**
 * Fetches all graphs for the authenticated user.
 */
export const getGraphs = async (): Promise<Graph[]> => {
  try {
    const response = await apiClient.get<Graph[]>('/graphs');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch graphs:', error);
    throw error;
  }
};

/**
 * Fetches a single graph by its ID.
 */
export const getGraph = async (graphId: number): Promise<Graph> => {
  try {
    const response = await apiClient.get<Graph>(`/graphs/${graphId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch graph ${graphId}:`, error);
    throw error;
  }
};

/**
 * Creates a new graph.
 */
export const createGraph = async (graphData: NewGraphData): Promise<Graph> => {
  try {
    const response = await apiClient.post<Graph>('/graphs', graphData);
    return response.data;
  } catch (error) {
    console.error('Failed to create graph:', error);
    throw error;
  }
};

/**
 * Updates an existing graph.
 */
export const updateGraph = async (
  graphId: number,
  updateData: Partial<NewGraphData>
): Promise<Graph> => {
  try {
    // Only send fields that are actually being updated (e.g., title)
    const response = await apiClient.put<Graph>(`/graphs/${graphId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update graph ${graphId}:`, error);
    throw error;
  }
};

/**
 * Deletes a graph.
 */
export const deleteGraph = async (graphId: number): Promise<void> => {
  try {
    await apiClient.delete(`/graphs/${graphId}`);
  } catch (error) {
    console.error(`Failed to delete graph ${graphId}:`, error);
    throw error;
  }
};
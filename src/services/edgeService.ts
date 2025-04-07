import apiClient from './apiClient';

// Define Edge types (should ideally be shared with backend/GraphView)
interface ApiEdge { // Matches DbEdge structure from backend service
  id: string;
  graph_id: number;
  source_node_id: string;
  target_node_id: string;
  source_handle?: string | null;
  target_handle?: string | null;
  marker_start?: string | null;
  marker_end?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}
export interface NewEdgeInput { // Export for use in components
  id: string;
  source: string; // source_node_id
  target: string; // target_node_id
  sourceHandle?: string | null;
  targetHandle?: string | null;
  markerStart?: string | null;
  markerEnd?: string | null;
}
export interface UpdateEdgeInput { // Export for use in components
  markerStart?: string | null;
  markerEnd?: string | null;
}


/**
 * Fetches all edges for a specific graph.
 */
export const getEdges = async (graphId: number): Promise<ApiEdge[]> => {
  try {
    const response = await apiClient.get<ApiEdge[]>(`/graphs/${graphId}/edges`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch edges for graph ${graphId}:`, error);
    throw error;
  }
};

/**
 * Creates a new edge within a graph.
 */
export const createEdge = async (
  graphId: number,
  edgeData: NewEdgeInput
): Promise<ApiEdge> => {
  try {
    const response = await apiClient.post<ApiEdge>(`/graphs/${graphId}/edges`, edgeData);
    return response.data;
  } catch (error) {
    console.error(`Failed to create edge in graph ${graphId}:`, error);
    throw error;
  }
};

/**
 * Updates an existing edge.
 */
export const updateEdge = async (
  graphId: number,
  edgeId: string,
  updateData: UpdateEdgeInput
): Promise<ApiEdge> => {
  try {
    const response = await apiClient.put<ApiEdge>(
      `/graphs/${graphId}/edges/${edgeId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to update edge ${edgeId} in graph ${graphId}:`, error);
    throw error;
  }
};

/**
 * Deletes an edge.
 */
export const deleteEdge = async (
  graphId: number,
  edgeId: string
): Promise<void> => {
  try {
    await apiClient.delete(`/graphs/${graphId}/edges/${edgeId}`);
  } catch (error) {
    console.error(`Failed to delete edge ${edgeId} in graph ${graphId}:`, error);
    throw error;
  }
};
import apiClient from './apiClient';

// Define Node types (should ideally be shared with backend/GraphView)
interface NodePosition {
  x: number;
  y: number;
}
export interface NodeData { // Export if needed elsewhere
  label?: string | null;
  content?: string | null;
  // imageUrl?: string | null; // Replaced by image_url
}
interface NodeStyle {
  width?: number | null;
  height?: number | null;
}
export interface ApiNode { // Export for potential use
  id: string;
  graph_id: number;
  type?: string;
  position_x: number;
  position_y: number;
  data_label?: string | null;
  data_content?: string | null;
  // data_image_url?: string | null; // Replaced by image_url
  image_url?: string | null; // Add image_url
  style_width?: number | null;
  style_height?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}
export interface NewNodeInput { // Export for use in components
  id: string;
  type?: string;
  position: NodePosition;
  data: NodeData;
  style?: NodeStyle;
}
export interface UpdateNodeInput { // Export for use in components
  position?: NodePosition;
  data?: Partial<Omit<NodeData, 'imageUrl'>>; // Omit old field
  style?: Partial<NodeStyle>;
  type?: string;
  image_url?: string | null; // Allow updating/unsetting image_url
}


/**
 * Fetches all nodes for a specific graph.
 */
export const getNodes = async (graphId: number): Promise<ApiNode[]> => {
  try {
    const response = await apiClient.get<ApiNode[]>(`/graphs/${graphId}/nodes`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch nodes for graph ${graphId}:`, error);
    throw error;
  }
};

/**
 * Creates a new node within a graph.
 */
export const createNode = async (
  graphId: number,
  nodeData: NewNodeInput
): Promise<ApiNode> => {
  try {
    const response = await apiClient.post<ApiNode>(`/graphs/${graphId}/nodes`, nodeData);
    return response.data;
  } catch (error) {
    console.error(`Failed to create node in graph ${graphId}:`, error);
    throw error;
  }
};

/**
 * Updates an existing node.
 */
export const updateNode = async (
  graphId: number,
  nodeId: string,
  updateData: UpdateNodeInput
): Promise<ApiNode> => {
  try {
    console.log('[nodeService.updateNode] Sending updateData:', updateData); // Log the data being sent
    const response = await apiClient.put<ApiNode>(
      `/graphs/${graphId}/nodes/${nodeId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to update node ${nodeId} in graph ${graphId}:`, error);
    throw error;
  }
};

/**
 * Deletes a node.
 */
export const deleteNode = async (
  graphId: number,
  nodeId: string
): Promise<void> => {
  try {
    await apiClient.delete(`/graphs/${graphId}/nodes/${nodeId}`);
  } catch (error) {
    console.error(`Failed to delete node ${nodeId} in graph ${graphId}:`, error);
    throw error;
  }
};
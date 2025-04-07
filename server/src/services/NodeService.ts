import db from '../db'; // Knex instance
import { getGraphById } from './GraphService'; // To check graph ownership

const NODES_TABLE = 'nodes';

// Define Node types (consider moving to a shared types file)
interface NodePosition {
  x: number;
  y: number;
}

interface NodeData {
  label?: string | null;
  content?: string | null;
  // imageUrl?: string | null; // Replaced by image_id
  // usedHandleIds is frontend state, not stored directly
}

interface NodeStyle {
  width?: number | null;
  height?: number | null;
}

// Represents a node as stored in the DB or received from API
interface DbNode {
  id: string; // Client-generated ID
  graph_id: number;
  type?: string;
  position_x: number;
  position_y: number;
  data_label?: string | null;
  data_content?: string | null;
  // data_image_url?: string | null; // Replaced by image_url
  image_url: string | null; // Use image_url instead of image_id
  style_width?: number | null;
  style_height?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  deleted_at?: string | Date | null; // Add deleted_at
}

// Represents data needed to create a new node via API
interface NewNodeInput {
  id: string; // Client MUST provide ID
  type?: string;
  position: NodePosition;
  data: NodeData;
  style?: NodeStyle;
}

// Represents data allowed for updating a node via API
interface UpdateNodeInput {
  position?: NodePosition;
  data?: Partial<Omit<NodeData, 'imageUrl'>>; // Omit the old field
  style?: Partial<NodeStyle>;
  image_url?: string | null; // Allow updating/unsetting image_url
  type?: string;
}


/**
 * Helper to verify graph ownership before node operations.
 * Throws an error if graph not found or not owned by user.
 */
const verifyGraphOwnership = async (graphId: number, userId: number): Promise<void> => {
  const graph = await getGraphById(graphId, userId);
  if (!graph) {
    const error = new Error('Graph not found or access denied');
    (error as any).statusCode = 404; // Or 403 Forbidden
    throw error;
  }
};

/**
 * Creates a new node within a specific graph, ensuring user owns the graph.
 */
export const createNode = async (
  graphId: number,
  userId: number,
  nodeInput: NewNodeInput
): Promise<DbNode> => {
  await verifyGraphOwnership(graphId, userId);

  const { id, type = 'bubble', position, data, style } = nodeInput;

  const nodeToInsert: Omit<DbNode, 'created_at' | 'updated_at'> = {
    id: id,
    graph_id: graphId,
    type: type,
    position_x: position.x,
    position_y: position.y,
    data_label: data.label,
    data_content: data.content,
    // data_image_url: data.imageUrl, // Replaced by image_url
    image_url: null, // Default to null on creation
    style_width: style?.width,
    style_height: style?.height,
  };

  await db(NODES_TABLE).insert(nodeToInsert);

  // Fetch the newly created node (Knex insert doesn't reliably return the full object with string PKs)
  const newNode = await db(NODES_TABLE).where({ id: id, graph_id: graphId }).first();
  if (!newNode) {
      throw new Error('Failed to retrieve newly created node.');
  }
  return newNode;
};

/**
 * Retrieves all nodes for a specific graph owned by the user.
 */
export const getNodesByGraphId = async (
  graphId: number,
  userId: number
): Promise<DbNode[]> => {
  await verifyGraphOwnership(graphId, userId);
  return db(NODES_TABLE).where({ graph_id: graphId }).whereNull('deleted_at').select('*'); // Exclude deleted
};

/**
 * Updates a specific node within a graph owned by the user.
 */
export const updateNode = async (
  nodeId: string,
  graphId: number,
  userId: number,
  updateData: UpdateNodeInput
): Promise<DbNode> => {
    await verifyGraphOwnership(graphId, userId);

    const nodeToUpdate: Partial<DbNode> = {
        updated_at: db.fn.now() as any // Knex types might need casting for db.fn.now()
    };

    if (updateData.type) nodeToUpdate.type = updateData.type;
    if (updateData.position) {
        nodeToUpdate.position_x = updateData.position.x;
        nodeToUpdate.position_y = updateData.position.y;
    }
     if (updateData.data) {
        if (updateData.data.label !== undefined) nodeToUpdate.data_label = updateData.data.label;
        if (updateData.data.content !== undefined) nodeToUpdate.data_content = updateData.data.content;
        // if (updateData.data.imageUrl !== undefined) nodeToUpdate.data_image_url = updateData.data.imageUrl; // Replaced by image_id
    }
    // Handle image_url update
    if (updateData.image_url !== undefined) {
        nodeToUpdate.image_url = updateData.image_url; // Can be string or null
    }
    if (updateData.style) {
        if (updateData.style.width !== undefined) nodeToUpdate.style_width = updateData.style.width;
        if (updateData.style.height !== undefined) nodeToUpdate.style_height = updateData.style.height;
    }

    
        console.log(`[NodeService.updateNode] Updating node ${nodeId} in graph ${graphId} with:`, nodeToUpdate); // Log data before update
        const updatedCount = await db(NODES_TABLE)
            .where({ id: nodeId, graph_id: graphId }) // Ensure node belongs to the correct graph
            .update(nodeToUpdate);
    if (updatedCount === 0) {
        const error = new Error('Node not found in the specified graph or no changes made.');
        (error as any).statusCode = 404;
        throw error;
    }

    // Fetch and return the updated node
    const updatedNode = await db(NODES_TABLE).where({ id: nodeId }).first();
     if (!updatedNode) {
        // Should not happen if updateCount was > 0
        throw new Error('Failed to retrieve updated node.');
    }
    return updatedNode;
};


/**
 * Deletes a specific node within a graph owned by the user.
 */
export const deleteNode = async (
  nodeId: string,
  graphId: number,
  userId: number
): Promise<number> => {
  await verifyGraphOwnership(graphId, userId);

  // Need to ensure the node actually belongs to this graph before deleting
  // Ensure the node exists in this graph and is not already deleted
  const node = await db(NODES_TABLE)
      .where({ id: nodeId, graph_id: graphId })
      .whereNull('deleted_at')
      .first('id');
  if (!node) {
      return 0; // Node doesn't exist, not owned, or already deleted
  }

  // return db(NODES_TABLE).where({ id: nodeId }).del(); // Replace with soft delete
  return db(NODES_TABLE).where({ id: nodeId }).update({ deleted_at: db.fn.now() });
};
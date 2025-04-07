import db from '../db'; // Knex instance
import { getGraphById } from './GraphService'; // To check graph ownership

const EDGES_TABLE = 'edges';
const NODES_TABLE = 'nodes'; // To verify nodes exist

// Define Edge types (consider moving to a shared types file)
interface DbEdge {
  id: string; // Client-generated ID
  graph_id: number;
  source_node_id: string;
  target_node_id: string;
  source_handle?: string | null;
  target_handle?: string | null;
  marker_start?: string | null;
  marker_end?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  deleted_at?: string | Date | null; // Add deleted_at
}

// Represents data needed to create a new edge via API
interface NewEdgeInput {
  id: string; // Client MUST provide ID
  source: string; // source_node_id
  target: string; // target_node_id
  sourceHandle?: string | null;
  targetHandle?: string | null;
  markerStart?: string | null;
  markerEnd?: string | null;
}

// Represents data allowed for updating an edge via API
interface UpdateEdgeInput {
  markerStart?: string | null;
  markerEnd?: string | null;
  // Add other updatable fields if needed (e.g., label, style)
}

/**
 * Helper to verify graph ownership before edge operations.
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
 * Helper to verify nodes exist within the specified graph.
 */
const verifyNodesExist = async (graphId: number, sourceNodeId: string, targetNodeId: string): Promise<void> => {
    const nodes = await db(NODES_TABLE)
        .where({ graph_id: graphId })
        .whereIn('id', [sourceNodeId, targetNodeId])
        .select('id');

    const foundIds = new Set(nodes.map(n => n.id));
    if (!foundIds.has(sourceNodeId) || !foundIds.has(targetNodeId)) {
        const error = new Error('Source or target node not found in the specified graph');
        (error as any).statusCode = 400; // Bad request
        throw error;
    }
};


/**
 * Creates a new edge within a specific graph.
 */
export const createEdge = async (
  graphId: number,
  userId: number,
  edgeInput: NewEdgeInput
): Promise<DbEdge> => {
  await verifyGraphOwnership(graphId, userId);
  await verifyNodesExist(graphId, edgeInput.source, edgeInput.target);

  const { id, source, target, sourceHandle, targetHandle, markerStart, markerEnd } = edgeInput;

  const edgeToInsert: Omit<DbEdge, 'created_at' | 'updated_at'> = {
    id: id,
    graph_id: graphId,
    source_node_id: source,
    target_node_id: target,
    source_handle: sourceHandle,
    target_handle: targetHandle,
    marker_start: markerStart,
    marker_end: markerEnd,
  };

  await db(EDGES_TABLE).insert(edgeToInsert);

  // Fetch the newly created edge
  const newEdge = await db(EDGES_TABLE).where({ id: id, graph_id: graphId }).first();
   if (!newEdge) {
      throw new Error('Failed to retrieve newly created edge.');
  }
  return newEdge;
};

/**
 * Retrieves all edges for a specific graph owned by the user.
 */
export const getEdgesByGraphId = async (
  graphId: number,
  userId: number
): Promise<DbEdge[]> => {
  await verifyGraphOwnership(graphId, userId);
  return db(EDGES_TABLE).where({ graph_id: graphId }).whereNull('deleted_at').select('*'); // Exclude deleted
};

/**
 * Updates a specific edge within a graph owned by the user.
 */
export const updateEdge = async (
  edgeId: string,
  graphId: number,
  userId: number,
  updateData: UpdateEdgeInput
): Promise<DbEdge> => {
    await verifyGraphOwnership(graphId, userId);

    const edgeToUpdate: Partial<DbEdge> = {
        updated_at: db.fn.now() as any
    };

    // Only allow updating specific fields like markers for now
    if (updateData.markerStart !== undefined) edgeToUpdate.marker_start = updateData.markerStart;
    if (updateData.markerEnd !== undefined) edgeToUpdate.marker_end = updateData.markerEnd;

    // Check if there's anything to update besides timestamp
    if (Object.keys(edgeToUpdate).length <= 1) {
         const currentEdge = await db(EDGES_TABLE).where({ id: edgeId, graph_id: graphId }).first();
         if (!currentEdge) {
             const error = new Error('Edge not found in the specified graph.');
             (error as any).statusCode = 404;
             throw error;
         }
         return currentEdge; // Return current edge if no actual data changed
    }


    const updatedCount = await db(EDGES_TABLE)
        .where({ id: edgeId, graph_id: graphId }) // Ensure edge belongs to the correct graph
        .update(edgeToUpdate);

    if (updatedCount === 0) {
        const error = new Error('Edge not found in the specified graph or no changes made.');
        (error as any).statusCode = 404;
        throw error;
    }

    // Fetch and return the updated edge
    const updatedEdge = await db(EDGES_TABLE).where({ id: edgeId }).first();
     if (!updatedEdge) {
        throw new Error('Failed to retrieve updated edge.');
    }
    return updatedEdge;
};


/**
 * Deletes a specific edge within a graph owned by the user.
 */
export const deleteEdge = async (
  edgeId: string,
  graphId: number,
  userId: number
): Promise<number> => {
  await verifyGraphOwnership(graphId, userId);

  // Ensure the edge actually belongs to this graph before deleting
  // Ensure the edge exists in this graph and is not already deleted
  const edge = await db(EDGES_TABLE)
      .where({ id: edgeId, graph_id: graphId })
      .whereNull('deleted_at')
      .first('id');
   if (!edge) {
      return 0; // Edge doesn't exist, not owned, or already deleted
  }

  // return db(EDGES_TABLE).where({ id: edgeId }).del(); // Replace with soft delete
  return db(EDGES_TABLE).where({ id: edgeId }).update({ deleted_at: db.fn.now() });
};
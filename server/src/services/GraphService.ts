import db from '../db'; // Knex instance
// Define Graph types later or import if created elsewhere
// e.g., import { Graph, NewGraphData } from '../types/graph';

const GRAPHS_TABLE = 'graphs';

interface NewGraphData {
  title: string;
}

interface Graph extends NewGraphData {
  id: number;
  user_id: number;
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at?: string | Date | null; // Add deleted_at
}

/**
 * Creates a new graph for a specific user.
 */
export const createGraph = async (
  userId: number,
  graphData: NewGraphData
): Promise<Graph> => {
  const { title } = graphData;
  const [insertedId] = await db(GRAPHS_TABLE).insert(
    {
      user_id: userId,
      title: title,
    },
    'id'
  );

  // Fetch the newly created graph
  const newGraph = await db(GRAPHS_TABLE)
    .where({ id: typeof insertedId === 'object' ? insertedId.id : insertedId })
    .first();

  if (!newGraph) {
    throw new Error('Failed to retrieve newly created graph.');
  }
  return newGraph;
};

/**
 * Retrieves all graphs belonging to a specific user.
 */
export const getGraphsByUserId = async (userId: number): Promise<Graph[]> => {
  return db(GRAPHS_TABLE).where({ user_id: userId }).whereNull('deleted_at').select('*'); // Exclude deleted
};

/**
 * Retrieves a specific graph by its ID, ensuring it belongs to the specified user.
 * Returns undefined if not found or not owned by the user.
 */
export const getGraphById = async (
  graphId: number,
  userId: number
): Promise<Graph | undefined> => {
  return db(GRAPHS_TABLE)
    .where({ id: graphId, user_id: userId }) // Check ownership
    .whereNull('deleted_at') // Exclude deleted
    .first();
};

/**
 * Updates the title of a specific graph owned by the user.
 * Returns the number of updated rows (should be 1 if successful).
 */
export const updateGraph = async (
  graphId: number,
  userId: number,
  updateData: Partial<NewGraphData> // Allow partial updates (e.g., just title)
): Promise<number> => {
  // Ensure only allowed fields are updated (e.g., title)
  const { title } = updateData;
  if (title === undefined) {
    return 0; // Nothing to update
  }
  return db(GRAPHS_TABLE)
    .where({ id: graphId, user_id: userId }) // Check ownership
    .update({
      title: title,
      updated_at: db.fn.now(), // Manually update timestamp if not auto
    });
};

/**
 * Deletes a specific graph owned by the user.
 * Relies on onDelete('CASCADE') in migrations for nodes/edges.
 * Returns the number of deleted rows (should be 1 if successful).
 */
export const deleteGraph = async (
  graphId: number,
  userId: number
): Promise<number> => {
  return db(GRAPHS_TABLE)
    .where({ id: graphId, user_id: userId }) // Check ownership
    // .del(); // Replace with soft delete
    .update({ deleted_at: db.fn.now() });
};
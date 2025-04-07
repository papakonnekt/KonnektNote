import db from '../db'; // Knex instance

// Define interfaces for the sync response structure
interface DeletedEntity {
  id: number | string; // ID can be number (most tables) or string (nodes, edges)
  type: string; // e.g., 'note', 'graph', 'node'
}

interface SyncPayload {
  updates: {
    graphs: any[];
    nodes: any[];
    edges: any[];
    notes: any[];
    checklists: any[];
    checklistItems: any[];
    images: any[];
    // Add other entity types as needed
  };
  deletions: DeletedEntity[];
  serverTimestamp: number; // Timestamp of the sync point
}

// List of tables to include in sync
const SYNC_TABLES = [
    'graphs',
    'nodes',
    'edges',
    'notes',
    'checklists',
    'checklist_items',
    'images'
];

/**
 * Fetches all changes (updates/creations and deletions) for a user since a given timestamp.
 * Uses soft deletes (`deleted_at` column).
 *
 * @param userId - The ID of the user requesting the sync.
 * @param lastSyncTimestampISO - The ISO 8601 timestamp string of the last successful sync. Null for initial sync.
 * @returns A SyncPayload object containing changes and the new server timestamp.
 */
export async function getChangesSince(userId: number, lastSyncTimestampISO: string | null): Promise<SyncPayload> {
    const serverTimestamp = Date.now(); // Use current time as the new sync point
    const serverTimestampISO = new Date(serverTimestamp).toISOString();

    const updates: SyncPayload['updates'] = {
        graphs: [],
        nodes: [],
        edges: [],
        notes: [],
        checklists: [],
        checklistItems: [],
        images: [],
    };
    const deletions: SyncPayload['deletions'] = [];

    // Convert lastSyncTimestampISO to a Date object for comparison, handle initial sync
    const sinceDate = lastSyncTimestampISO ? new Date(lastSyncTimestampISO) : new Date(0); // Start from epoch if initial sync

    for (const tableName of SYNC_TABLES) {
        let query = db(tableName);

        // Filter by user_id if the table has it (most should, except maybe 'images' in our revised plan)
        const hasUserId = await db.schema.hasColumn(tableName, 'user_id');
        if (hasUserId) {
            query = query.where({ user_id: userId });
        } else if (tableName === 'images') {
            // For images, we might need a more complex query to find images linked
            // by entities owned by the user, or just sync all non-deleted images.
            // For simplicity now, let's sync all non-deleted images.
            // A better approach might be needed later depending on requirements.
             query = query.whereNull('deleted_at'); // Only sync non-deleted images for now
        } else {
             console.warn(`Table ${tableName} included in sync but has no user_id column.`);
             // Decide how to handle tables without user_id if any are added later
        }


        // Fetch updated/created records (not deleted)
        const updatedRecords = await query.clone() // Clone before adding more where clauses
            .where('updated_at', '>', sinceDate.toISOString())
            .whereNull('deleted_at') // Ensure we only get non-deleted updates
            .select('*');

        // Fetch deleted records (marked as deleted since last sync)
        const deletedRecords = await query.clone()
            .where('deleted_at', '>', sinceDate.toISOString())
            .select('id'); // Only need IDs for deletions

        // Add results to payload
        if (updatedRecords.length > 0) {
            (updates as any)[tableName] = updatedRecords; // Assign to the correct key
        }
        if (deletedRecords.length > 0) {
            deletions.push(...deletedRecords.map(r => ({ id: r.id, type: tableName })));
        }
    }

    return {
        updates,
        deletions,
        serverTimestamp: serverTimestamp, // Send back as number (milliseconds since epoch)
    };
}
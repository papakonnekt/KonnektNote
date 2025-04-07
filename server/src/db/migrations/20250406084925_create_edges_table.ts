import type { Knex } from 'knex';

const TABLE_NAME = 'edges';
const GRAPHS_TABLE = 'graphs';
const NODES_TABLE = 'nodes';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    // Using string ID from client (React Flow) as primary key
    table.string('id').primary();
    table
      .integer('graph_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable(GRAPHS_TABLE)
      .onDelete('CASCADE'); // Delete edges if the graph is deleted
    table
      .string('source_node_id')
      .notNullable()
      .references('id')
      .inTable(NODES_TABLE)
      .onDelete('CASCADE'); // Delete edges if the source node is deleted
    table
      .string('target_node_id')
      .notNullable()
      .references('id')
      .inTable(NODES_TABLE)
      .onDelete('CASCADE'); // Delete edges if the target node is deleted
    table.string('source_handle').nullable();
    table.string('target_handle').nullable();
    table.string('marker_start').nullable(); // Store marker type as string
    table.string('marker_end').nullable(); // Store marker type as string
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TABLE_NAME);
}

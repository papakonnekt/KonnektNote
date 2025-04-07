import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('graphs', (table) => {
    table.timestamp('deleted_at').nullable();
    table.index('deleted_at'); // Add index for querying non-deleted items
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('graphs', (table) => {
    table.dropIndex('deleted_at'); // Drop index first
    table.dropColumn('deleted_at');
  });
}


import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('checklist_items', (table) => {
    table.timestamp('deleted_at').nullable();
    table.index('deleted_at');
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('checklist_items', (table) => {
    table.dropIndex('deleted_at');
    table.dropColumn('deleted_at');
  });
}


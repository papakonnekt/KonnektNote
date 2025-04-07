import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('checklist_items', (table) => {
    table.integer('image_id').unsigned().nullable();
    table.foreign('image_id').references('id').inTable('images').onDelete('SET NULL');
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('checklist_items', (table) => {
    table.dropForeign('image_id');
    table.dropColumn('image_id');
  });
}


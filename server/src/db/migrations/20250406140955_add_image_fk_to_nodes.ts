import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    // Rename existing 'data_image_url' to avoid confusion if needed, or just add new FK
    // For simplicity, let's just add the new FK column.
    // If 'data_image_url' should be removed, do it in a separate step or migration.
    table.integer('image_id').unsigned().nullable();
    table.foreign('image_id').references('id').inTable('images').onDelete('SET NULL');
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    table.dropForeign('image_id');
    table.dropColumn('image_id');
  });
}


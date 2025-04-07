import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    // Add the new image_url column
    table.string('image_url').nullable();
    // Optionally drop the old data_image_url column if it's no longer needed
    // table.dropColumn('data_image_url');
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    table.dropColumn('image_url');
    // If you dropped data_image_url in 'up', you might want to add it back here
    // table.string('data_image_url').nullable();
  });
}


import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('notes', (table) => {
    // Store the relative URL path to the image
    table.string('image_url').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('notes', (table) => {
    table.dropColumn('image_url');
  });
}


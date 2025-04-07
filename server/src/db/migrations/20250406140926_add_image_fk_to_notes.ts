import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('notes', (table) => {
    table.integer('image_id').unsigned().nullable();
    // Add FK constraint. onDelete('SET NULL') means if the image is deleted,
    // the note's image_id becomes NULL instead of deleting the note.
    table.foreign('image_id').references('id').inTable('images').onDelete('SET NULL');
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('notes', (table) => {
    // Drop the foreign key constraint first
    table.dropForeign('image_id');
    // Then drop the column
    table.dropColumn('image_id');
  });
}


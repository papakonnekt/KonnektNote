import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('images', (table) => {
    table.increments('id').primary();
    // Remove user_id and FK - ownership inferred from linking entity
    table.string('filename').notNullable(); // Original filename
    table.string('filepath').notNullable().unique(); // Path relative to uploads dir, ensure uniqueness
    table.string('mimetype').notNullable();
    table.integer('size').unsigned().notNullable(); // Size in bytes
    table.timestamp('created_at').defaultTo(knex.fn.now());
    // No updated_at needed unless metadata is editable
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('images');
}


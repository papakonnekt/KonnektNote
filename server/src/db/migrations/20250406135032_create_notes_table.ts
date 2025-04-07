import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notes', (table) => {
    table.increments('id').primary(); // Use auto-incrementing integer ID
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('title').nullable();
    table.text('content').notNullable();
    table.text('tags').nullable(); // Store tags as JSON string or comma-separated
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('notes');
}


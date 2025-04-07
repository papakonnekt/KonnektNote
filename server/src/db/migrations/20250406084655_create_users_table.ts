import type { Knex } from 'knex';

const TABLE_NAME = 'users';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.increments('id').primary(); // Auto-incrementing integer primary key
    table.string('username').unique().notNullable();
    table.string('password_hash').notNullable();
    table.timestamps(true, true); // Adds created_at and updated_at columns
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TABLE_NAME);
}

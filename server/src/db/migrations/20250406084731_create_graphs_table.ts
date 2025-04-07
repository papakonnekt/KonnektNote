import type { Knex } from 'knex';

const TABLE_NAME = 'graphs';
const USERS_TABLE = 'users';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned() // Ensure the foreign key is unsigned if the primary key is
      .notNullable()
      .references('id')
      .inTable(USERS_TABLE)
      .onDelete('CASCADE'); // Delete graphs if the user is deleted
    table.string('title').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TABLE_NAME);
}

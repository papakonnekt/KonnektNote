import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('checklist_items', (table) => {
    table.increments('id').primary();
    table.integer('checklist_id').unsigned().notNullable();
    table.foreign('checklist_id').references('id').inTable('checklists').onDelete('CASCADE');
    table.integer('parent_item_id').unsigned().nullable(); // For nesting
    table.foreign('parent_item_id').references('id').inTable('checklist_items').onDelete('CASCADE'); // Self-referencing FK
    table.text('content').notNullable();
    table.boolean('is_completed').defaultTo(false).notNullable();
    table.integer('order').notNullable(); // For manual sorting, needs logic to manage
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('checklist_items');
}


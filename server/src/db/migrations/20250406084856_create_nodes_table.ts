import type { Knex } from 'knex';

const TABLE_NAME = 'nodes';
const GRAPHS_TABLE = 'graphs';
// Consider adding reference to images table later if using dedicated table (TODO 23)
// const IMAGES_TABLE = 'images';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    // Using string ID from client (React Flow) as primary key
    table.string('id').primary();
    table
      .integer('graph_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable(GRAPHS_TABLE)
      .onDelete('CASCADE'); // Delete nodes if the graph is deleted
    table.string('type').defaultTo('bubble');
    table.float('position_x').notNullable();
    table.float('position_y').notNullable();
    table.string('data_label').nullable(); // Label might be optional
    table.text('data_content').nullable(); // Content area
    table.string('data_image_url').nullable(); // Simple URL storage for now
    // Add image_id FK later if using dedicated images table
    // table.integer('image_id').unsigned().nullable().references('id').inTable(IMAGES_TABLE).onDelete('SET NULL');
    table.float('style_width').nullable();
    table.float('style_height').nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TABLE_NAME);
}

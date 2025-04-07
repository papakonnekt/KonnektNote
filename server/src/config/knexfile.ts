import type { Knex } from 'knex';
import path from 'path';

// Define the Knex configuration object
// We'll focus on the development environment for now
const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      // Path is now relative to src/config, go up one level then to db
      filename: path.resolve(__dirname, '..', 'db', 'dev.sqlite3'),
    },
    migrations: {
      // Path is now relative to src/config, go up one level then to db/migrations
      directory: path.resolve(__dirname, '..', 'db', 'migrations'),
      extension: 'ts', // Specify that migrations are written in TypeScript
    },
    seeds: {
      // Path is now relative to src/config, go up one level then to db/seeds
      directory: path.resolve(__dirname, '..', 'db', 'seeds'),
      extension: 'ts', // Specify that seeds are written in TypeScript
    },
    useNullAsDefault: true, // Recommended for SQLite
    // Add pool configuration to prevent issues with SQLite file locking in some cases
    pool: {
      afterCreate: (conn: any, cb: any) => {
        conn.run('PRAGMA foreign_keys = ON', cb); // Enforce foreign key constraints
      },
    },
  },

  // Add production configuration later if needed
  // production: {
  //   client: 'postgresql', // Example for production
  //   connection: process.env.DATABASE_URL,
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations'
  //   }
  // }
};

export default config; // Export the configuration object
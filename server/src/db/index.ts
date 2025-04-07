import knex from 'knex';
import config from '../config/knexfile'; // Path adjusted to new location

// Get the configuration for the development environment
// Consider using NODE_ENV later to switch between environments
const environment = process.env.NODE_ENV || 'development';
const environmentConfig = config[environment];

if (!environmentConfig) {
  throw new Error(`Knex configuration for environment '${environment}' not found.`);
}

// Initialize Knex with the development configuration
const db = knex(environmentConfig);

// Optional: Test the connection (can be removed later)
db.raw('SELECT 1')
  .then(() => {
    console.log('[db]: Connection to SQLite has been established successfully.');
  })
  .catch((err) => {
    console.error('[db]: Unable to connect to the database:', err);
    process.exit(1); // Exit if DB connection fails on startup
  });

export default db;
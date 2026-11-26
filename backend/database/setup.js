// Creates the cyberguard_db database, all tables, and the sample data.
// Usage (from the backend folder):  npm run db:setup
// WARNING: re-running this drops and recreates the CyberGuard tables.
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true, // only used here, for trusted local .sql files
  });

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const sample = fs.readFileSync(path.join(__dirname, 'sample_data.sql'), 'utf8');

  console.log('Creating database and tables...');
  await connection.query(schema);
  console.log('Inserting sample data...');
  await connection.query(sample);
  await connection.end();

  console.log('\nDone! Database "cyberguard_db" is ready.');
  console.log('Admin login: admin@cyberguard.com / Admin@123');
  console.log('User login:  ali@student.com / User@1234');
}

run().catch((err) => {
  console.error('\nDatabase setup failed:', err.code || '', err.message);
  if (err.code === 'ECONNREFUSED') console.error('-> Is MySQL running? Start it from the XAMPP Control Panel.');
  if (err.code === 'ER_ACCESS_DENIED_ERROR') console.error('-> Check DB_USER / DB_PASSWORD in backend/.env');
  process.exit(1);
});

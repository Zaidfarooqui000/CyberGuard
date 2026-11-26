// MySQL connection pool (mysql2/promise).
// All queries in the project use placeholders (?) so user input is never
// concatenated into SQL – this is our protection against SQL injection.
const mysql = require('mysql2/promise');
require('dotenv').config({ quiet: true });

// SSL is needed for cloud databases such as Aiven (set DB_SSL=true).
// DB_CA_CERT holds the provider's CA certificate (PEM text) so the server
// identity is verified. Local XAMPP does not need SSL.
function sslOptions() {
  if (String(process.env.DB_SSL).toLowerCase() !== 'true') return undefined;
  const ca = process.env.DB_CA_CERT ? process.env.DB_CA_CERT.replace(/\\n/g, '\n') : undefined;
  return ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cyberguard_db',
  ssl: sslOptions(),
  waitForConnections: true,
  // Serverless functions run many small instances – keep each pool small.
  connectionLimit: process.env.VERCEL ? 3 : 10,
});

module.exports = pool;
module.exports.sslOptions = sslOptions;

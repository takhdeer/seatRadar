const { Pool } = require('pg');

// Database connection
const pool = new Pool ({
    connectionString: process.env.DATABASE_URL,
    ssl : { rejectUnauthorized: false }     // turn off cert verification
});

console.log(process.env.DATABASE_URL);
module.exports = pool;
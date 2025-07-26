const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {rejectUnauthorized: false}
});

async function checkDatabase() {
    try {
        console.log('Connecting to database...');

        // Check if accounts table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'accounts'
            );
        `);
        console.log('Accounts table exists:', tableCheck.rows[0].exists);

        // Check accounts count
        const countResult = await pool.query('SELECT COUNT(*) FROM accounts');
        console.log('Number of accounts:', countResult.rows[0].count);

        // Get sample accounts
        const result = await pool.query('SELECT * FROM accounts LIMIT 5');
        console.log('Sample accounts:', result.rows);

        // Check customers count
        const customerCount = await pool.query('SELECT COUNT(*) FROM customers');
        console.log('Number of customers:', customerCount.rows[0].count);

    } catch (error) {
        console.error('Database error:', error.message);
    } finally {
        await pool.end();
    }
}

checkDatabase();

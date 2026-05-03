const { Client } = require('pg');

const connectionString = "postgresql://postgres.qdgnuwvtgyodtpcefufy:%40369AWZ%23dfx7@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('Connected successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err.message);
    process.exit(1);
  });

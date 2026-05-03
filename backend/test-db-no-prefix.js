const { Client } = require('pg');

// Tentando SEM o prefixo no usuário
const connectionString = "postgresql://postgres:%40369AWZ%23dfx7@aws-0-sa-east-1.pooler.supabase.com:5432/postgres";

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

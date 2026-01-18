import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the project root
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function testConnection() {
  console.log('--- MySQL Connection Test ---');
  console.log(`Loading configuration from: ${envPath}`);
  
  if (!process.env.DB_HOST) {
    console.error('❌ Error: .env file not loaded or DB_HOST not set.');
    process.exit(1);
  }

  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_USER: ${process.env.DB_USER}`);
  console.log(`DB_NAME: ${process.env.DB_NAME}`);
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306,
    });

    console.log('\n✅ Successfully connected to the MySQL database!');
    
    await connection.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
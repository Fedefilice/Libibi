// lib/db.js
import sql from 'mssql';

// Configurazione per SQL Server con autenticazione SQL
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: 'SQLEXPRESS'
  }
};

let pool;

export async function connectToDatabase() {
  if (pool) {
    return pool;
  }

  try {
    console.log('🔗 Connessione a SQL Server...');
    console.log('📍 Server:', config.server);
    console.log('📍 Instance:', config.options.instanceName);
    console.log('📂 Database:', config.database);
    console.log('👤 User:', config.user);
    pool = await sql.connect(config);
    console.log('✅ Connesso a SQL Server!');
    return pool;
  } catch (err) {
    console.error('❌ Errore connessione:', err.message);
    throw err;
  }
}

export { sql };
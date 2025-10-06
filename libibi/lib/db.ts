// lib/db.ts
import sql from 'mssql';

// Configurazione per SQL Server con autenticazione SQL
const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'LIBDB',
  user: process.env.DB_USER || 'SA',
  password: process.env.DB_PASSWORD || 'progettiAMO',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: process.env.DB_INSTANCE || 'SQLEXPRESS'
  }
};

let pool: sql.ConnectionPool | null = null;

/**
 * Funzione di connessione al database
 * @returns ConnectionPool - Pool di connessione SQL Server
 */
export async function connectToDatabase(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool;
  }

  try {
    console.log('Connessione a SQL Server...');
    console.log('Server:', config.server);
    console.log('Instance:', config.options.instanceName);
    console.log('Database:', config.database);
    console.log('User:', config.user);
    pool = await sql.connect(config);
    console.log('Connesso a SQL Server!');
    return pool;
  } catch (err: any) {
    console.error('Errore connessione:', err.message);
    throw err;
  }
}

export { sql };
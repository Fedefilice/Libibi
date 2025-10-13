import { NextResponse } from 'next/server';
import { connectToDatabase, sql } from '../../../../lib/db';

// Tipo per il risultato della query del database
interface DatabaseInfo {
  server_name: string;
  db_name: string;
  user_name: string;
  table_count: number;
}

// Tipo per la risposta dell'API
interface ApiResponse {
  success: boolean;
  message: string;
  server?: string;
  database?: string;
  user?: string;
  tables?: number;
  error?: string;
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    console.log('Test con stringa collaudata...');
    
    const pool = await connectToDatabase();
    const result = await sql.query<DatabaseInfo>`
      SELECT 
        @@SERVERNAME as server_name,
        DB_NAME() as db_name,
        SYSTEM_USER as user_name,
        COUNT(*) as table_count
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `;
    
    const dbInfo = result.recordset[0];
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Connessione riuscita con stringa collaudata!',
      server: dbInfo.server_name,
      database: dbInfo.db_name,
      user: dbInfo.user_name,
      tables: dbInfo.table_count
    });

  } catch (error: any) {
    console.error('ERRORE:', error.message);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Errore con stringa collaudata!',
      error: error.message
    }, { status: 500 });
  }
}
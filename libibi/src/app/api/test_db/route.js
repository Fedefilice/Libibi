// src/app/api/test_db/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase, sql } from '../../../../lib/db';

export async function GET() {
  try {
    console.log('Test con stringa collaudata...');
    
    const pool = await connectToDatabase();
    const result = await sql.query`
      SELECT 
        @@SERVERNAME as server_name,
        DB_NAME() as db_name,
        SYSTEM_USER as user_name,
        COUNT(*) as table_count
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Connessione riuscita con stringa collaudata!',
      server: result.recordset[0].server_name,
      database: result.recordset[0].db_name,
      user: result.recordset[0].user_name,
      tables: result.recordset[0].table_count
    });

  } catch (error) {
    console.error('ERRORE:', error.message);
    return NextResponse.json({
      success: false,
      message: 'Errore con stringa collaudata!',
      error: error.message
    }, { status: 500 });
  }
}
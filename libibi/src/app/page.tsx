"use client";

import { useState } from "react";
import Image from "next/image";
import bookIndex from "./book_index.jpg";
import Link from "next/link";
import { AuthNavigation } from "./components/navigation";

export default function Home() {
  //Test connessione database
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test_db');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: 'Errore nel test',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    setLoading(false);
  };
  return (
    <div>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Connessione Database SQL Server</h1>
      
      <button 
        onClick={testDatabase}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Test in corso...' : 'Test Database Connection'}
      </button>

      {testResult && (
        <div style={{
          padding: '15px',
          backgroundColor: testResult.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${testResult.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
          color: testResult.success ? '#155724' : '#721c24'
        }}>
          <h3>{testResult.success ? 'SUCCESSO' : 'ERRORE'}</h3>
          <p><strong>Messaggio:</strong> {testResult.message}</p>
          
          {testResult.success ? (
            <div>
              <p><strong>Versione SQL Server:</strong> {testResult.serverVersion}</p>
              <p><strong>Database trovati:</strong> {testResult.databaseCount}</p>
              <p><strong>Tabelle in LIBDB:</strong> {testResult.tables.length}</p>
              
              <details style={{ marginTop: '10px' }}>
                <summary>Dettagli tecnici</summary>
                <pre style={{ 
                  background: 'white', 
                  padding: '10px', 
                  borderRadius: '5px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div>
              <p><strong>Errore:</strong> {testResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
    <section className="flex flex-col flex-1">
      <div className="flex-1 flex flex-col justify-center items-center">
        <div
          className="relative flex flex-col items-center justify-center rounded-2xl overflow-hidden"
          style={{
            width: "80vw",      // larghezza relativa
            height: "28vw",     // altezza relativa
            minWidth: "320px",
            minHeight: "300px",
            boxShadow: "0 4px 32px var(--color-card-shadow)",
            background: "var(--color-card)",
            marginTop: "6vw",   // spazio bianco sopra
            marginBottom: "6vw" // spazio bianco sotto
          }}
        >
          <Image
            src={bookIndex}
            alt="Libibi books"
            fill
            className="absolute inset-0 w-full h-full object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-[4vw]">
            <h1
              className="text-6xl font-serif mb-6 text-center drop-shadow-lg"
              style={{ color: "var(--color-background)" }}
            >
              Libibi
            </h1>
            <p
              className="text-xl mb-8 text-center max-w-2xl drop-shadow"
              style={{ color: "var(--color-card)" }}
            >
              Il tuo rifugio personale per organizzare le tue letture e scoprire
              nuovi mondi attraverso i libri.
            </p>
            <AuthNavigation />
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}

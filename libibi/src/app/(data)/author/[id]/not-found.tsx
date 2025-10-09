import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-8 py-12">
      <div className="max-w-3xl mx-auto bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h2 className="text-2xl font-bold text-yellow-600 mb-4">Autore non trovato</h2>
        <p className="text-gray-700">Non è stato possibile trovare l'autore richiesto.</p>
        <Link 
          href="/search" 
          className="inline-block mt-6 px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-foreground)] transition-colors"
        >
          Torna alla ricerca
        </Link>
      </div>
    </div>
  );
}

<<<<<<< HEAD:libibi/src/app/book/[id]/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-8 py-12">
      <div className="max-w-3xl mx-auto bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
        <h2 className="text-3xl font-bold text-yellow-600 mb-4">Libro non trovato</h2>
        <p className="text-gray-700 mb-6">Spiacenti, non siamo riusciti a trovare il libro che stai cercando.</p>
        <Link 
          href="/search" 
          className="inline-block px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-foreground)] transition-colors"
        >
          Torna alla ricerca
        </Link>
      </div>
    </div>
  );
=======
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-8 py-12">
      <div className="max-w-3xl mx-auto bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
        <h2 className="text-3xl font-bold text-yellow-600 mb-4">Libro non trovato</h2>
        <p className="text-gray-700 mb-6">Spiacenti, non siamo riusciti a trovare il libro che stai cercando.</p>
        <Link 
          href="/data/search" 
          className="inline-block px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-foreground)] transition-colors"
        >
          Torna alla ricerca
        </Link>
      </div>
    </div>
  );
>>>>>>> 58475b57297e7c84c193746dddca9a2c191cd3c6:libibi/src/app/data/book/[id]/not-found.tsx
}
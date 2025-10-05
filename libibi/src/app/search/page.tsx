"use client";

import { useState } from "react";
import Link from "next/link";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Qui farai la chiamata API per cercare i libri
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.books || []);
    } catch (error) {
      console.error("Errore nella ricerca:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-8 py-12">
      <h1 className="text-4xl text-center font-serif mb-8 text-[var(--color-foreground)]">
        Cerca Libri:
      </h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex w-full max-w-4xl mx-auto gap-4 items-center justify-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca titolo, autore, ISBN..."
            className="flex-1 min-w-0 w-full max-w-3xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-foreground)] transition-colors disabled:opacity-50"
          >
            {loading ? "Cercando..." : "Cerca"}
          </button>
        </div>
      </form>

      {/* Risultati della ricerca */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center max-w-6xl mx-auto">
        {searchResults.map((book: any) => (
          <Link 
            key={book.id} 
            href={`/book/${book.id}`}
            className="block w-full max-w-sm p-6 bg-[var(--color-card)] rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2 text-[var(--color-foreground)]">
              {book.title}
            </h3>
            <p className="text-[var(--color-accent)] mb-2">{book.author}</p>
            <p className="text-gray-600 text-sm">{book.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
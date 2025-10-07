"use client";

import React from 'react';
import { SearchBarProps } from '@/types/ui';

export default function SearchBar({ searchQuery, setSearchQuery, loading, handleSearch }: SearchBarProps) {
  return (
    <form onSubmit={handleSearch} className="mb-8">
      <div className="flex w-full max-w-4xl mx-auto gap-4 items-center justify-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cerca titolo, autore, genere..."
          className="flex-1 min-w-0 w-full max-w-3xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !searchQuery.trim()}
          className="px-8 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-foreground)] transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cercando...
            </span>
          ) : "Cerca"}
        </button>
      </div>
    </form>
  );
}
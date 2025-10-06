// Implementazione di un sistema di cache per le chiamate API
import { OpenLibraryBookResult, OpenLibraryAuthorResult } from './open_library_types';

/**
 * Cache di memoria per le chiamate alle API
 * Permette di ridurre le chiamate HTTP ripetute alla stessa risorsa
 */
class ApiCache {
  private bookCache: Map<string, { data: OpenLibraryBookResult, timestamp: number }>;
  private authorCache: Map<string, { data: OpenLibraryAuthorResult, timestamp: number }>;
  private searchCache: Map<string, { data: OpenLibraryBookResult[], timestamp: number }>;
  private maxAge: number; // Tempo di validità cache in millisecondi (default 30 minuti)

  constructor(maxAgeMinutes: number = 30) {
    this.bookCache = new Map();
    this.authorCache = new Map();
    this.searchCache = new Map();
    this.maxAge = maxAgeMinutes * 60 * 1000;
  }

  // Gestione cache libri
  public getBook(key: string): OpenLibraryBookResult | null {
    const cachedItem = this.bookCache.get(key);
    if (!cachedItem) return null;
    
    if (this.isExpired(cachedItem.timestamp)) {
      this.bookCache.delete(key);
      return null;
    }
    
    return cachedItem.data;
  }

  public setBook(key: string, data: OpenLibraryBookResult): void {
    this.bookCache.set(key, { data, timestamp: Date.now() });
  }

  // Gestione cache autori
  public getAuthor(key: string): OpenLibraryAuthorResult | null {
    const cachedItem = this.authorCache.get(key);
    if (!cachedItem) return null;
    
    if (this.isExpired(cachedItem.timestamp)) {
      this.authorCache.delete(key);
      return null;
    }
    
    return cachedItem.data;
  }

  public setAuthor(key: string, data: OpenLibraryAuthorResult): void {
    this.authorCache.set(key, { data, timestamp: Date.now() });
  }

  // Gestione cache ricerche
  public getSearch(query: string): OpenLibraryBookResult[] | null {
    const cachedItem = this.searchCache.get(query.toLowerCase());
    if (!cachedItem) return null;
    
    if (this.isExpired(cachedItem.timestamp)) {
      this.searchCache.delete(query.toLowerCase());
      return null;
    }
    
    return cachedItem.data;
  }

  public setSearch(query: string, data: OpenLibraryBookResult[]): void {
    this.searchCache.set(query.toLowerCase(), { data, timestamp: Date.now() });
  }

  // Helper per verificare la scadenza
  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.maxAge;
  }
}

// Esporta un'istanza singleton
export const apiCache = new ApiCache();
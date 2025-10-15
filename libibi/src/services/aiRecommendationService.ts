import { 
  UserBook, 
  CategorizedBooks, 
  LLMResponse 
} from '../types/recommendations';
import { parseBookTitles } from '../../lib/bookUtils';

export class AIRecommendationService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
  }

  /**
   * Genera raccomandazioni di libri basate sul profilo utente
   */
  async generateRecommendations(userBooks: CategorizedBooks): Promise<string[]> {
    const readerProfile = this.buildReaderProfile(userBooks);
    
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt(readerProfile);

    try {
      const response = await this.callLLMAPI(systemPrompt, userPrompt);
      return this.parseBookTitles(response);
    } catch (error) {
      console.error('Errore nella generazione raccomandazioni:', error);
      throw new Error('Impossibile generare raccomandazioni AI');
    }
  }

  /**
   * Chiama l'API OpenRouter per ottenere raccomandazioni
   */
  private async callLLMAPI(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-72b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: LLMResponse = await response.json();
    return data.choices?.[0]?.message?.content || "Nessuna raccomandazione trovata.";
  }

  /**
   * Costruisce il prompt di sistema per l'AI
   */
  private getSystemPrompt(): string {
    return `Sei un bibliotecario esperto specializzato in raccomandazioni personalizzate.
Analizza il profilo di lettura dell'utente e i suoi gusti per suggerire libri perfetti per lui.

Considera:
- I libri che ha apprezzato di più (stelle alte)
- I generi e autori preferiti
- I libri abbandonati (da evitare generi/stili simili)
- Le preferenze che emergono dalle sue letture

Rispondi esclusivamente con un singolo JSON strutturato che contiene tutti e 6 i libri.
Formato richiesto: {"raccomandazioni": [{"titolo": "Nome del libro", "autore": "Nome dell'autore"}, {"titolo": "Nome del libro", "autore": "Nome dell'autore"}, {"titolo": "Nome del libro", "autore": "Nome dell'autore"}, {"titolo": "Nome del libro", "autore": "Nome dell'autore"}, {"titolo": "Nome del libro", "autore": "Nome dell'autore"}, {"titolo": "Nome del libro", "autore": "Nome dell'autore"}]}`;
  }


  private getUserPrompt(readerProfile: string): string {
    return `Ecco il profilo di lettura dell'utente:

${readerProfile}

Basandoti su questi dati, consiglia 6 libri che potrebbero piacergli. Rispondi solo con il JSON richiesto.`;
  }


  private buildReaderProfile(userBooks: CategorizedBooks): string {
    const profile: string[] = [];

    // Libri letti 
    if (userBooks.read?.length > 0) {
      profile.push("LIBRI LETTI:");
      userBooks.read.forEach(book => {
        profile.push(this.normalizeBook(book));
      });
      profile.push(""); // riga vuota
    }

    // Sto leggendo
    if (userBooks.reading?.length > 0) {
      profile.push("STO LEGGENDO:");
      userBooks.reading.forEach(book => {
        profile.push(this.normalizeBook(book));
      });
      profile.push("");
    }

    // Voglio leggere
    if (userBooks.wantToRead?.length > 0) {
      profile.push("VOGLIO LEGGERE:");
      userBooks.wantToRead.forEach(book => {
        profile.push(this.normalizeBook(book));
      });
      profile.push("");
    }

    // Libri abbandonati
    if (userBooks.abandoned?.length > 0) {
      profile.push("LIBRI ABBANDONATI (da evitare simili):");
      userBooks.abandoned.forEach(book => {
        profile.push(this.normalizeBook(book));
      });
      profile.push("");
    }

    return profile.join("\n");
  }

  /**
   * Normalizza un libro per il profilo lettore
   */
  private normalizeBook(book: UserBook): string {
    const title = book.Title || "Titolo sconosciuto";
    const author = book.AuthorName ? book.AuthorName.join(", ") : "Autore sconosciuto";
    
    return `- "${title}" di ${author}`;
  }

  /**
   * Parsa la risposta AI per estrarre i titoli dei libri
   */
  private parseBookTitles(response: string): string[] {
    // Usa la funzione esistente da bookUtils
    return parseBookTitles(response);
  }
}

export const aiRecommendationService = new AIRecommendationService();
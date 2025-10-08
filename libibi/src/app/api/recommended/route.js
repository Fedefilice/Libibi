import { requireBasicAuth } from '../../../lib/basicAuth';
import { connectToDatabase, sql } from '../../../../lib/db';

export async function POST(req) {
  try {
    // Richiede Basic Auth 
    const auth = await requireBasicAuth(req);
    if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!auth.user) return Response.json({ error: 'User info missing' }, { status: 500 });
    
    const userID = auth.user.userID;

    // Recupera i libri dell'utente dal database
    const userBooks = await getUserBooksFromDatabase(userID);

    // Prompt
    const readerProfile = buildReaderProfile(userBooks);

    const systemPrompt = "Sei un bibliotecario esperto specializzato in raccomandazioni personalizzate.\n"
                        "Analizza il profilo di lettura dell'utente e i suoi gusti per suggerire libri perfetti per lui.\n\n"
                        "Considera:\n"
                        "- I libri che ha apprezzato di più (stelle alte)\n"
                        "- I generi e autori preferiti\n"
                        "- I libri abbandonati (da evitare generi/stili simili)\n"
                        "- Le preferenze che emergono dalle sue letture\n\n"
                        "Rispondi esclusivamente con i titoli dei libri in una lista [titolo1; titolo2; ...].";

    const userPrompt = "Ecco il profilo di lettura dell'utente:\n\n"
                        + readerProfile + "\n\n"
                        + "Basandoti su questi dati, consiglia 6 libri che potrebbero piacergli.";

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
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

    if (!res.ok) {
      throw new Error("OpenRouter API error: " + res.status);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "Nessuna raccomandazione trovata.";
    
    // Parsa la risposta dell'LLM per estrarre la lista di titoli
    const match = text.match(/\[([^\]]+)\]/);
    const recommendedTitles = match ? match[1].split(";").map(title => title.trim()) : [];
    
    return Response.json(recommendedTitles);

  } catch (error) {
    console.error('Errore API raccomandazioni:', error);
    return Response.json({ 
      error: "Errore interno del server",
      details: error.message 
    }, { status: 500 });
  }
}

// Normalizza un libro e lo formatta per il profilo del lettore
function normalizeBook(book) {
  const title = book.title || book.Title || "Titolo sconosciuto";
  const author = book.author || (book.AuthorName ? book.AuthorName.join(", ") : null) || 
                 (book.Author ? book.Author.join(", ") : null) || "Autore sconosciuto";
  
  return `- "${title}" di ${author}`;
}

// Costruisce il profilo del lettore basato sui libri categorizzati
function buildReaderProfile(userBooks) {
  let profile = [];

  // Libri letti 
  if (userBooks.read?.length > 0) {
    profile.push("LIBRI LETTI:");
    userBooks.read.forEach(book => {
      profile.push(normalizeBook(book));
    });
    profile.push(""); // riga vuota
  }

  // Sto leggendo
  if (userBooks.reading?.length > 0) {
    profile.push("STO LEGGENDO:");
    userBooks.reading.forEach(book => {
      profile.push(normalizeBook(book));
    });
    profile.push("");
  }

  // Voglio leggere
  if (userBooks.wantToRead?.length > 0) {
    profile.push("VOGLIO LEGGERE:");
    userBooks.wantToRead.forEach(book => {
      profile.push(normalizeBook(book));
    });
    profile.push("");
  }

  // Libri abbandonati (da considerare per evitare raccomandazioni simili)
  if (userBooks.abandoned?.length > 0) {
    profile.push("LIBRI ABBANDONATI (da evitare simili):");
    userBooks.abandoned.forEach(book => {
      profile.push(normalizeBook(book));
    });
    profile.push("");
  }

  return profile.join("\n");
}


// Recupera i libri dell'utente dal database organizzati per categoria
async function getUserBooksFromDatabase(userID) {
  try {
    const pool = await connectToDatabase();
    const request = pool.request();
    request.input('UserID', sql.Int, userID);
    
    const query = `
      SELECT 
        b.title,
        STRING_AGG(a.authorName, ', ') as authors,
        us.status
      FROM User_Shelves us
      INNER JOIN Books b ON us.bookID = b.bookID
      LEFT JOIN Book_Authors ba ON b.bookID = ba.bookID
      LEFT JOIN Authors a ON ba.authorID = a.authorID
      WHERE us.userID = @UserID
      GROUP BY b.title, us.status
      ORDER BY us.last_updated DESC
    `;
    
    const result = await request.query(query);
    
    // Organizza i libri per categoria
    const categorizedBooks = {
      read: [],
      reading: [],
      wantToRead: [],
      abandoned: []
    };
    
    result.recordset.forEach(book => {
      const bookData = {
        title: book.title,
        author: book.authors || "Autore sconosciuto"
      };
      
      // Mappa gli status del database alle categorie richieste
      // Basato sulla mappatura in /users/shelves: WantToRead, Reading, Read, Abandoned
      switch (book.status) {
        case 'Read':
          categorizedBooks.read.push(bookData);
          break;
        case 'Reading':
          categorizedBooks.reading.push(bookData);
          break;
        case 'WantToRead':
          categorizedBooks.wantToRead.push(bookData);
          break;
        case 'Abandoned':
          categorizedBooks.abandoned.push(bookData);
          break;
        default:
          // Se non riconosciuto, metti in "want to read" come default
          console.log('Status non riconosciuto:', book.status);
          categorizedBooks.wantToRead.push(bookData);
      }
    });
    
    return categorizedBooks;
  } catch (error) {
    console.error('Errore nel recupero libri utente:', error);
    return {
      read: [],
      reading: [],
      wantToRead: [],
      abandoned: []
    };
  }
}

// Parsing della risposta
export function parseBookTitles(responseText) {
    // prende solo come output ciò che è racchiuso tra parentesi quadre
    const match = responseText.match(/\[([^\]]+)\]/);
    if (!match) return [];
    // estrae i titoli separati da punto e virgola e rimuove gli spazi bianchi
    return match[1].split(";").map(function(title) { return title.trim(); }); 
}
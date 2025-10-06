"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearLoginCookie } from '@/hooks/useAuth';
import UserReviewsList from '@/components/ui/UserReviewsList';

// Pagina del profilo utente

type User = {
  Id?: number;
  Nome?: string | null;
  Cognome?: string | null;
  Username?: string | null;
  Email?: string | null;
  Admin?: boolean;
};

type MenuTab = 'voglio-leggere' | 'sto-leggendo' | 'letto' | 'abbandonato' | 'impostazioni' | 'recensioni';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<MenuTab>('impostazioni');
  const [shelves, setShelves] = useState<any[]>([]);
  const [loadingShelves, setLoadingShelves] = useState(false);
  const [shelvesError, setShelvesError] = useState<string | null>(null);
  const router = useRouter();

  // Se non cè l'utente loggato, reindirizza al login
  useEffect(() => {
    try {
      const raw = localStorage.getItem('libibi_user');
      if (!raw) {
        router.push('/user/login');
        return;
      }
      const parsed = JSON.parse(raw);
      setUser(parsed);
    } catch (e) {
      router.push('/user/login');
    }
  }, [router]);

  function handleLogout() {
    try {
      localStorage.removeItem('libibi_user');
      clearLoginCookie(); // Rimuove anche il cookie di autenticazione
    } catch (e) {
      console.error('Errore durante il logout:', e);
    }
    router.push('/');
  }

  function getAuthHeader() {
    try {
      const credsJson = localStorage.getItem('libibi_credentials');
      if (!credsJson) return null;
      const creds = JSON.parse(credsJson);
      const token = btoa(`${creds.username}:${creds.password}`);
      return `Basic ${token}`;
    } catch (e) {
      return null;
    }
  }

  async function fetchShelves() {
    setShelvesError(null);
    setLoadingShelves(true);
    try {
      const auth = getAuthHeader();
      if (!auth) {
        setShelves([]);
        setLoadingShelves(false);
        return;
      }
      const res = await fetch('/api/users/shelves', { headers: { Authorization: auth } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setShelvesError(err?.Errore || `Errore fetching shelves ${res.status}`);
        setShelves([]);
        setLoadingShelves(false);
        return;
      }
      const data = await res.json();
      setShelves(Array.isArray(data) ? data : []);
    } catch (ex: any) {
      console.error('fetchShelves error', ex);
      setShelvesError(String(ex?.message ?? ex));
      setShelves([]);
    } finally {
      setLoadingShelves(false);
    }
  }

  useEffect(() => {
    if (activeTab !== 'impostazioni') fetchShelves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (!user) return <div className="max-w-3xl mx-auto mt-16 p-8">Caricamento...</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'voglio-leggere':
        return (
          <>
            <h1 className="text-3xl font-serif border-b border-[var(--color-accent)] pb-2 mb-8 text-[var(--color-foreground)]">
              Voglio leggere
            </h1>
            {loadingShelves ? (
              <div className="text-center py-12">Caricamento libreria...</div>
            ) : shelvesError ? (
              <div className="text-center text-red-600 py-12">{shelvesError}</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {shelves.filter(s => s.status === 'WantToRead').length === 0 && (
                  <div className="text-center text-[var(--color-foreground)] py-12">La tua lista "Voglio leggere" è vuota.</div>
                )}
                {shelves.filter(s => s.status === 'WantToRead').map((s) => (
                  <div key={s.bookID} className="flex items-center gap-4 p-4 bg-[var(--color-background)] rounded">
                    <img src={s.coverImageURL || '/placeholder-book.jpg'} alt={s.title || s.bookID} className="w-16 h-20 object-contain" />
                    <div className="flex-1">
                      <a href={`/data/book/${encodeURIComponent(s.bookID)}`} className="font-medium hover:underline">{s.title || s.bookID}</a>
                      <div className="text-sm text-gray-500">{s.last_updated ? new Date(s.last_updated).toLocaleString() : ''}</div>
                    </div>
                    <div>
                      <button onClick={() => removeFromLibrary(s.bookID, s.status)} className="px-3 py-2 bg-red-100 text-red-700 rounded">Rimuovi</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case 'sto-leggendo':
        return (
          <>
            <h1 className="text-3xl font-serif border-b border-[var(--color-accent)] pb-2 mb-8 text-[var(--color-foreground)]">
              Sto leggendo
            </h1>
            {loadingShelves ? (
              <div className="text-center py-12">Caricamento libreria...</div>
            ) : shelvesError ? (
              <div className="text-center text-red-600 py-12">{shelvesError}</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {shelves.filter(s => s.status === 'Reading').length === 0 && (
                  <div className="text-center text-[var(--color-foreground)] py-12">La tua lista "Sto leggendo" è vuota.</div>
                )}
                {shelves.filter(s => s.status === 'Reading').map((s) => (
                  <div key={s.bookID} className="flex items-center gap-4 p-4 bg-[var(--color-background)] rounded">
                    <img src={s.coverImageURL || '/placeholder-book.jpg'} alt={s.title || s.bookID} className="w-16 h-20 object-contain" />
                    <div className="flex-1">
                      <a href={`/data/book/${encodeURIComponent(s.bookID)}`} className="font-medium hover:underline">{s.title || s.bookID}</a>
                      <div className="text-sm text-gray-500">Iniziato: {s.started_reading_date ? new Date(s.started_reading_date).toLocaleDateString() : '-'}</div>
                    </div>
                    <div>
                      <button onClick={() => removeFromLibrary(s.bookID, s.status)} className="px-3 py-2 bg-red-100 text-red-700 rounded">Rimuovi</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case 'letto':
        return (
          <>
            <h1 className="text-3xl font-serif border-b border-[var(--color-accent)] pb-2 mb-8 text-[var(--color-foreground)]">
              Letto
            </h1>
            {loadingShelves ? (
              <div className="text-center py-12">Caricamento libreria...</div>
            ) : shelvesError ? (
              <div className="text-center text-red-600 py-12">{shelvesError}</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {shelves.filter(s => s.status === 'Read').length === 0 && (
                  <div className="text-center text-[var(--color-foreground)] py-12">La tua lista "Letto" è vuota.</div>
                )}
                {shelves.filter(s => s.status === 'Read').map((s) => (
                  <div key={s.bookID} className="flex items-center gap-4 p-4 bg-[var(--color-background)] rounded">
                    <img src={s.coverImageURL || '/placeholder-book.jpg'} alt={s.title || s.bookID} className="w-16 h-20 object-contain" />
                    <div className="flex-1">
                      <a href={`/data/book/${encodeURIComponent(s.bookID)}`} className="font-medium hover:underline">{s.title || s.bookID}</a>
                      <div className="text-sm text-gray-500">Finiti: {s.finished_reading_date ? new Date(s.finished_reading_date).toLocaleDateString() : '-'}</div>
                    </div>
                    <div>
                      <button onClick={() => removeFromLibrary(s.bookID, s.status)} className="px-3 py-2 bg-red-100 text-red-700 rounded">Rimuovi</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case 'abbandonato':
        return (
          <>
            <h1 className="text-3xl font-serif border-b border-[var(--color-accent)] pb-2 mb-8 text-[var(--color-foreground)]">
              Abbandonato
            </h1>
            {loadingShelves ? (
              <div className="text-center py-12">Caricamento libreria...</div>
            ) : shelvesError ? (
              <div className="text-center text-red-600 py-12">{shelvesError}</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {shelves.filter(s => s.status === 'Abandoned').length === 0 && (
                  <div className="text-center text-[var(--color-foreground)] py-12">La tua lista "Abbandonato" è vuota.</div>
                )}
                {shelves.filter(s => s.status === 'Abandoned').map((s) => (
                  <div key={s.bookID} className="flex items-center gap-4 p-4 bg-[var(--color-background)] rounded">
                    <img src={s.coverImageURL || '/placeholder-book.jpg'} alt={s.title || s.bookID} className="w-16 h-20 object-contain" />
                    <div className="flex-1">
                      <a href={`/data/book/${encodeURIComponent(s.bookID)}`} className="font-medium hover:underline">{s.title || s.bookID}</a>
                    </div>
                    <div>
                      <button onClick={() => removeFromLibrary(s.bookID, s.status)} className="px-3 py-2 bg-red-100 text-red-700 rounded">Rimuovi</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case 'recensioni':
        return (
          <>
            <h1 className="text-3xl font-serif border-b border-[var(--color-accent)] pb-2 mb-8 text-[var(--color-foreground)]">
              Le mie recensioni
            </h1>
            <UserReviewsList />
          </>
        );
      case 'impostazioni':
      default:
        return (
          <>
            <h1 className="text-3xl font-serif border-b border-[var(--color-accent)] pb-2 mb-8 text-[var(--color-foreground)]">
              Impostazioni
            </h1>
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-2">Informazioni personali</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--color-accent)]">Email</p>
                    <p className="text-[var(--color-foreground)]">{user.Email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-accent)]">Ruolo</p>
                    <p className="text-[var(--color-foreground)]">{user.Admin ? 'Amministratore' : 'Utente'}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  async function removeFromLibrary(bookID: string, currentStatus?: string) {
    try {
      const auth = getAuthHeader();
      if (!auth) {
        setShelvesError('Devi essere loggato');
        return;
      }

      // Se lo stato corrente è "Reading", sposta in "Abandoned" invece di rimuovere
      if (currentStatus === 'Reading') {
        const body = { bookID, status: 'abandoned' };
        const resPost = await fetch('/api/users/shelves', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: auth }, body: JSON.stringify(body) });
        if (!resPost.ok) {
          const err = await resPost.json().catch(() => ({}));
          setShelvesError(err?.Errore || 'Errore aggiornando lo stato del libro');
          return;
        }
        // ricarica
        fetchShelves();
        return;
      }

      const res = await fetch(`/api/users/shelves?bookID=${encodeURIComponent(bookID)}`, { method: 'DELETE', headers: { Authorization: auth } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setShelvesError(err?.Errore || 'Errore rimuovendo il libro');
        return;
      }
      // ricarica
      fetchShelves();
    } catch (ex) {
      console.error('removeFromLibrary', ex);
      setShelvesError('Errore di rete');
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row">
        {/* Colonna sinistra - Profilo utente */}
        <div className="w-full md:w-1/4 pr-0 md:pr-6 mb-6 md:mb-0">
          <div className="card overflow-hidden flex flex-col items-center">
            {/* Avatar con iniziali */}
            <div className="w-24 h-24 rounded-full bg-[var(--color-background)] border-2 border-[var(--color-accent)] flex items-center justify-center text-[var(--color-foreground)] text-3xl font-serif mb-4">
              {user.Nome ? user.Nome.charAt(0).toUpperCase() : (user.Username ? user.Username.charAt(0).toUpperCase() : '?')}
            </div>
            
            {/* Nome utente */}
            <h2 className="text-2xl font-serif text-[var(--color-foreground)] mb-1">{user.Nome || '-'} {user.Cognome || ''}</h2>
            <p className="text-sm text-[var(--color-accent)] mb-6">@{user.Username || '-'}</p>
            
            {/* Navigazione profilo */}
            <nav className="w-full">
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => setActiveTab('voglio-leggere')}
                    className={`w-full text-left py-3 px-4 rounded-full text-[var(--color-foreground)] font-medium transition-colors
                      ${activeTab === 'voglio-leggere' ? 'bg-[var(--color-background)]' : 'hover:bg-[var(--color-background)] hover:bg-opacity-50'}`}
                  >
                    Voglio leggere
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('sto-leggendo')}
                    className={`w-full text-left py-3 px-4 rounded-full text-[var(--color-foreground)] transition-colors
                      ${activeTab === 'sto-leggendo' ? 'bg-[var(--color-background)]' : 'hover:bg-[var(--color-background)] hover:bg-opacity-50'}`}
                  >
                    Sto leggendo
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('letto')}
                    className={`w-full text-left py-3 px-4 rounded-full text-[var(--color-foreground)] transition-colors
                      ${activeTab === 'letto' ? 'bg-[var(--color-background)]' : 'hover:bg-[var(--color-background)] hover:bg-opacity-50'}`}
                  >
                    Letto
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('abbandonato')}
                    className={`w-full text-left py-3 px-4 rounded-full text-[var(--color-foreground)] transition-colors
                      ${activeTab === 'abbandonato' ? 'bg-[var(--color-background)]' : 'hover:bg-[var(--color-background)] hover:bg-opacity-50'}`}
                  >
                    Abbandonato
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('recensioni')}
                    className={`w-full text-left py-3 px-4 rounded-full text-[var(--color-foreground)] transition-colors
                      ${activeTab === 'recensioni' ? 'bg-[var(--color-background)]' : 'hover:bg-[var(--color-background)] hover:bg-opacity-50'}`}
                  >
                    Le mie recensioni
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('impostazioni')}
                    className={`w-full text-left py-3 px-4 rounded-full text-[var(--color-foreground)] transition-colors
                      ${activeTab === 'impostazioni' ? 'bg-[var(--color-background)]' : 'hover:bg-[var(--color-background)] hover:bg-opacity-50'}`}
                  >
                    Impostazioni
                  </button>
                </li>
                <li className="mt-6">
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-center px-8 py-3 rounded-full bg-[var(--color-accent)] text-white hover:bg-[var(--color-foreground)] transition-all duration-150 active:scale-95 font-medium shadow"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Colonna destra - Contenuto dinamico */}
        <div className="w-full md:w-3/4 pl-0 md:pl-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

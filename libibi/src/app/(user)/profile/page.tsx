"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearLoginCookie, useIsLoggedIn } from '@/hooks/useAuth';
import UserReviewsList from '@/components/reviews/UserReviewsList';
import BookShelfList from '@/components/book/BookShelfList';
import { User, MenuTab, BookShelf, ConfirmRemovalState } from '@/types/user';

// Pagina del profilo utente

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<MenuTab>('impostazioni');
  const [shelves, setShelves] = useState<BookShelf[]>([]);
  const [loadingShelves, setLoadingShelves] = useState(false);
  const [shelvesError, setShelvesError] = useState<string | null>(null);
  const [authValidated, setAuthValidated] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [confirmRemoval, setConfirmRemoval] = useState<ConfirmRemovalState | null>(null);
  const [removingBookId, setRemovingBookId] = useState<string | null>(null);
  const { isLoggedIn, isChecking } = useIsLoggedIn();
  const router = useRouter();

  // Validazione autenticazione server-side
  useEffect(() => {
    async function validateAuth() {
      // Non fare nulla se ancora sta controllando il login
      if (isChecking) return;
      
      // Se non è loggato e abbiamo già tentato la validazione, reindirizza
      if (!isLoggedIn) {
        console.log('User not logged in, redirecting to login');
        router.push('/login');
        return;
      }

      // Se abbiamo già validato, non rifarlo
      if (validationAttempted) return;
      
      setValidationAttempted(true);

      try {
        // Verifica con il server che l'autenticazione sia valida
        const auth = getAuthHeader();
        if (!auth) {
          console.log('No auth header found, clearing and redirecting');
          clearLoginCookie();
          localStorage.removeItem('libibi_user');
          router.push('/login');
          return;
        }

        console.log('Validating auth with server...');
        const response = await fetch('/api/users/auth', {
          headers: { Authorization: auth }
        });

        if (!response.ok) {
          console.log('Server auth validation failed:', response.status);
          // Token non valido, pulisci tutto e reindirizza
          clearLoginCookie();
          localStorage.removeItem('libibi_user');
          localStorage.removeItem('libibi_credentials');
          router.push('/login');
          return;
        }

        console.log('Auth validation successful');
        // Se arriviamo qui, l'auth è valida
        setAuthValidated(true);
        
        // Carica i dati utente dal localStorage solo se l'auth è validata
        const raw = localStorage.getItem('libibi_user');
        if (raw) {
          const parsed = JSON.parse(raw);
          setUser(parsed);
        }
      } catch (e) {
        console.error('Errore validazione auth:', e);
        clearLoginCookie();
        localStorage.removeItem('libibi_user');
        localStorage.removeItem('libibi_credentials');
        router.push('/login');
      }
    }

    validateAuth();
  }, [isLoggedIn, isChecking, validationAttempted, router]);

  function handleLogout() {
    try {
      // Pulisci tutti i dati di autenticazione
      localStorage.removeItem('libibi_user');
      localStorage.removeItem('libibi_credentials');
      clearLoginCookie();
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

  // Mostra loading finché stiamo controllando o validando l'auth
  if (isChecking || (!authValidated && !validationAttempted) || (!authValidated && validationAttempted)) {
    return (
      <div className="max-w-3xl mx-auto mt-16 p-8 text-center">
        <div className="text-[var(--color-foreground)]">
          {isChecking ? 'Verificando login...' : 'Verificando autenticazione...'}
        </div>
      </div>
    );
  }

  // Se non c'è un utente dopo la validazione, significa che qualcosa è andato storto
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto mt-16 p-8 text-center">
        <div className="text-red-600">Errore nel caricamento del profilo utente</div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'voglio-leggere':
        return (
          <BookShelfList
            books={shelves}
            status="WantToRead"
            title="Voglio leggere"
            loading={loadingShelves}
            error={shelvesError}
            emptyMessage='La tua lista "Voglio leggere" è vuota.'
            onRemoveBook={handleRemoveRequest}
            onChangeStatus={handleChangeStatus}
            showDateInfo="last_updated"
            removingBookId={removingBookId}
          />
        );
      case 'sto-leggendo':
        return (
          <BookShelfList
            books={shelves}
            status="Reading"
            title="Sto leggendo"
            loading={loadingShelves}
            error={shelvesError}
            emptyMessage='La tua lista "Sto leggendo" è vuota.'
            onRemoveBook={handleRemoveRequest}
            onChangeStatus={handleChangeStatus}
            showDateInfo="started_reading_date"
            removingBookId={removingBookId}
          />
        );
      case 'letto':
        return (
          <BookShelfList
            books={shelves}
            status="Read"
            title="Letto"
            loading={loadingShelves}
            error={shelvesError}
            emptyMessage='La tua lista "Letto" è vuota.'
            onRemoveBook={handleRemoveRequest}
            onChangeStatus={handleChangeStatus}
            showDateInfo="finished_reading_date"
            removingBookId={removingBookId}
          />
        );
      case 'abbandonato':
        return (
          <BookShelfList
            books={shelves}
            status="Abandoned"
            title="Abbandonato"
            loading={loadingShelves}
            error={shelvesError}
            emptyMessage='La tua lista "Abbandonato" è vuota.'
            onRemoveBook={handleRemoveRequest}
            onChangeStatus={handleChangeStatus}
            showDateInfo="none"
            removingBookId={removingBookId}
          />
        );
      case 'recensioni':
        return (
          <>
            <h1 className="text-3xl font-serif border-b border-[var(--color-accent)] pb-2 mb-8 text-[var(--color-foreground)]">
              Le mie recensioni
            </h1>
            <div className="card">
              <UserReviewsList />
            </div>
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

  function handleRemoveRequest(bookID: string, currentStatus: string) {
    // Trova il libro per ottenere il titolo
    const book = shelves.find(s => s.bookID === bookID);
    const title = book?.title || bookID;
    
    setConfirmRemoval({ bookID, status: currentStatus, title });
  }

  async function handleChangeStatus(bookID: string, newStatus: string) {
    try {
      const auth = getAuthHeader();
      if (!auth) {
        setShelvesError('Devi essere loggato per modificare lo stato del libro');
        return;
      }

      // Mappa i valori di status per l'API
      const statusMap: Record<string, string> = {
        'WantToRead': 'want_to_read',
        'Reading': 'reading',
        'Read': 'finished',
        'Abandoned': 'abandoned'
      };

      const apiStatus = statusMap[newStatus] || newStatus.toLowerCase();

      const body = { bookID, status: apiStatus };
      const res = await fetch('/api/users/shelves', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: auth 
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setShelvesError(err?.Errore || 'Errore aggiornando lo stato del libro');
        return;
      }

      // Ricarica le liste
      await fetchShelves();
    } catch (ex: any) {
      console.error('handleChangeStatus error', ex);
      setShelvesError('Errore di rete durante il cambio di stato');
    }
  }

  async function confirmRemoveFromLibrary() {
    if (!confirmRemoval) return;
    
    const { bookID, status: currentStatus } = confirmRemoval;
    setRemovingBookId(bookID);
    
    try {
      const auth = getAuthHeader();
      if (!auth) {
        setShelvesError('Devi essere loggato');
        setConfirmRemoval(null);
        setRemovingBookId(null);
        return;
      }

      // Se lo stato corrente è "Reading", sposta in "Abandoned" invece di rimuovere
      if (currentStatus === 'Reading') {
        const body = { bookID, status: 'abandoned' };
        const resPost = await fetch('/api/users/shelves', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', Authorization: auth }, 
          body: JSON.stringify(body) 
        });
        if (!resPost.ok) {
          const err = await resPost.json().catch(() => ({}));
          setShelvesError(err?.Errore || 'Errore aggiornando lo stato del libro');
          setConfirmRemoval(null);
          setRemovingBookId(null);
          return;
        }
      } else {
        const res = await fetch(`/api/users/shelves?bookID=${encodeURIComponent(bookID)}`, { 
          method: 'DELETE', 
          headers: { Authorization: auth } 
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setShelvesError(err?.Errore || 'Errore rimuovendo il libro');
          setConfirmRemoval(null);
          setRemovingBookId(null);
          return;
        }
      }
      
      // ricarica e chiudi il modal
      await fetchShelves();
      setConfirmRemoval(null);
    } catch (ex) {
      console.error('removeFromLibrary', ex);
      setShelvesError('Errore di rete');
      setConfirmRemoval(null);
    } finally {
      setRemovingBookId(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Modal di conferma rimozione */}
      {confirmRemoval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Conferma rimozione
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmRemoval.status === 'Reading' 
                ? `Vuoi spostare "${confirmRemoval.title}" dalla lista "Sto leggendo" alla lista "Abbandonato"?`
                : `Sei sicuro di voler rimuovere "${confirmRemoval.title}" dalla tua libreria?`
              }
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setConfirmRemoval(null)}
                disabled={removingBookId !== null}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annulla
              </button>
              <button
                onClick={confirmRemoveFromLibrary}
                disabled={removingBookId !== null}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removingBookId === confirmRemoval.bookID 
                  ? 'Elaborazione...' 
                  : (confirmRemoval.status === 'Reading' ? 'Sposta' : 'Rimuovi')
                }
              </button>
            </div>
          </div>
        </div>
      )}
      
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
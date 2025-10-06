"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type UserShelf = {
  bookID: string;
  status: string;
  started_reading_date?: string | null;
  finished_reading_date?: string | null;
  last_updated?: string | null;
  title?: string | null;
  coverImageURL?: string | null;
};

// Pagina del profilo utente

type User = {
  Id?: number;
  Nome?: string | null;
  Cognome?: string | null;
  Username?: string | null;
  Email?: string | null;
  Admin?: boolean;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [shelves, setShelves] = useState<UserShelf[] | null>(null);
  const router = useRouter();


  // Se non cè l'utente loggato, reindirizza al login
  useEffect(() => {
    try {
      const raw = localStorage.getItem('libibi_user');
      if (!raw) {
        router.push('/login');
        return;
      }
      const parsed = JSON.parse(raw);
      setUser(parsed);
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  // Fetch user's shelves
  useEffect(() => {
    async function loadShelves() {
      try {
        const credsJson = localStorage.getItem('libibi_credentials');
        if (!credsJson) return;
        const creds = JSON.parse(credsJson);
        const auth = btoa(`${creds.username}:${creds.password}`);
        const res = await fetch('/api/users/shelves', { headers: { Authorization: `Basic ${auth}` } });
        if (!res.ok) return;
        const data = await res.json();
        setShelves(data);
      } catch (e) {
        console.error('Error loading shelves', e);
      }
    }
    loadShelves();
  }, []);

  function handleLogout() {
    try {
      localStorage.removeItem('libibi_user');
    } catch (e) {}
    router.push('/');
  }

  if (!user) return <div className="max-w-3xl mx-auto mt-16 p-8">Caricamento...</div>;

  // CSS stile inline per semplicità
  return (
    <div className="max-w-3xl mx-auto mt-16 p-6">
      <div className="bg-[var(--color-card)] shadow-md rounded-lg overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-28 h-28 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-3xl font-bold">
              {user.Nome ? user.Nome.charAt(0).toUpperCase() : (user.Username ? user.Username.charAt(0).toUpperCase() : '?')}
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif text-[var(--color-foreground)]">{user.Nome || '-'} {user.Cognome || ''}</h2>
                <p className="text-sm text-gray-600">@{user.Username || '-'}</p>
              </div>
              <div className="hidden md:block">
                <button onClick={handleLogout} className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-white">Logout</button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--color-background)] rounded">
                <h3 className="text-sm font-medium text-gray-700">Email</h3>
                <p className="mt-2 text-lg text-[var(--color-foreground)]">{user.Email || '-'}</p>
              </div>

              <div className="p-4 bg-[var(--color-background)] rounded">
                <h3 className="text-sm font-medium text-gray-700">Ruolo</h3>
                <p className="mt-2 text-lg text-[var(--color-foreground)]">{user.Admin ? 'Amministratore' : 'Utente'}</p>
              </div>
            </div>

            {/* La mia libreria */}
            <div className="mt-6 p-4 bg-[var(--color-background)] rounded">
              <h3 className="text-lg font-medium mb-4">La mia libreria</h3>
              {shelves === null ? (
                <div>Caricamento...</div>
              ) : shelves.length === 0 ? (
                <div className="text-sm text-gray-600">Non hai ancora libri nella tua libreria.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shelves.map((s) => (
                    <div key={s.bookID} className="flex gap-4 p-3 bg-white rounded shadow">
                      <div className="w-20 h-28 relative bg-gray-100 flex-shrink-0">
                        {s.coverImageURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.coverImageURL} alt={s.title || s.bookID} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No image</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{s.title || s.bookID}</div>
                            <div className="text-xs text-gray-600">Stato: {s.status}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          {s.started_reading_date && <div>Iniziato: {new Date(s.started_reading_date).toLocaleDateString()}</div>}
                          {s.finished_reading_date && <div>Finito: {new Date(s.finished_reading_date).toLocaleDateString()}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 block md:hidden">
              <button onClick={handleLogout} className="w-full px-4 py-2 rounded-full bg-[var(--color-accent)] text-white">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

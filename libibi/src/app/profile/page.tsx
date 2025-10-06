"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

            <div className="mt-6 block md:hidden">
              <button onClick={handleLogout} className="w-full px-4 py-2 rounded-full bg-[var(--color-accent)] text-white">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setLoginCookie, useIsLoggedIn } from "../../../hooks/useAuth";

// Pagina di login per gli utenti

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn, isChecking } = useIsLoggedIn();
  const router = useRouter();

  // Se l'utente è già loggato, reindirizzalo al profilo
  useEffect(() => {
    if (!isChecking && isLoggedIn) {
      router.push("/profile");
    }
  }, [isLoggedIn, isChecking, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.Errore || 'Errore di autenticazione');
        return;
      }
      const data = await res.json();
      // Salva i dati utente e le credenziali in localStorage
      try {
        if (typeof window !== 'undefined') {
          // Salva i dati utente e le credenziali Basic auth in modo che altri codici client possano chiamare API protette
          localStorage.setItem('libibi_user', JSON.stringify(data));
          localStorage.setItem('libibi_credentials', JSON.stringify({ username, password }));
          setLoginCookie("authenticated", 7); // Cookie valido per 7 giorni
        }
      } catch (e) {
        console.error("Errore nel salvataggio delle credenziali:", e);
      }
      // Se la login ha successo, reindirizza al profilo
      router.push("/profile");
    } catch (err: any) {
      setError(err?.message || "Errore di rete");
    }
  }

  // Mostra loading se stiamo controllando lo stato di login
  if (isChecking) {
    return (
      <div className="container mx-auto px-8 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="text-[var(--color-foreground)]">Verificando stato login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-12">
      <h1 className="text-4xl text-center font-serif mb-8 text-[var(--color-foreground)]">
        Accedi
      </h1>
      
      <div className="max-w-md mx-auto card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-medium text-[var(--color-foreground)] mb-2">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="block font-medium text-[var(--color-foreground)] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
          
          {error && (
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-full">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <button 
              className="btn btn-accent disabled:opacity-50" 
              type="submit"
            >
              Accedi
            </button>
            <a href="/register" className="text-[var(--color-accent)] hover:underline">
              Registrati
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

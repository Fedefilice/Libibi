"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Pagina di login per gli utenti

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
          localStorage.setItem('libibi_user', JSON.stringify(data));
          // Memorizza le credenziali in modo che il client possa chiamare le API protette da Basic-Auth.
          // NOTA: memorizzare la password in chiaro in localStorage non è sicuro per la produzione.(Nel caso ci fosse tale domanda)
          localStorage.setItem('libibi_credentials', JSON.stringify({ username, password }));
        }
      } catch (e) {
        console.error('Errore salvando i dati utente', e);
      }
      // Successo, reindirizza al profilo
      router.push("/profile");
    } catch (err: any) {
      setError(err?.message || "Errore di rete");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded shadow">
      <h1 className="text-2xl mb-4">Accedi</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex items-center justify-between">
          <button className="px-4 py-2 bg-[#a86c3c] text-white rounded" type="submit">
            Accedi
          </button>
          <a href="/register" className="text-sm text-[#17332a] hover:underline">
            Registrati
          </a>
        </div>
      </form>
    </div>
  );
}

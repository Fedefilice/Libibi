"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Pagina di registrazione per nuovi utenti

export default function RegisterPage() {
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/users/PostUserData`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Nome: nome, Cognome: cognome, Username: username, Email: email, Passwd: password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.Errore || "Errore durante la registrazione");
        return;
      }
      setSuccess("Registrazione avvenuta con successo. Puoi ora effettuare il login.");
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err?.message || "Errore di rete");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded shadow">
      <h1 className="text-2xl mb-4">Registrati</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block text-sm">Cognome</label>
          <input value={cognome} onChange={(e) => setCognome(e.target.value)} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block text-sm">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" required />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <div className="flex items-center justify-between">
          <button className="px-4 py-2 bg-[#a86c3c] text-white rounded" type="submit">Registrati</button>
          <a href="/login" className="text-sm text-[#17332a] hover:underline">Hai già un account?</a>
        </div>
      </form>
    </div>
  );
}

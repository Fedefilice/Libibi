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
      setTimeout(() => router.push('/user/login'), 1500);
    } catch (err: any) {
      setError(err?.message || "Errore di rete");
    }
  }

  return (
    <div className="container mx-auto px-8 py-12">
      <h1 className="text-4xl text-center font-serif mb-8 text-[var(--color-foreground)]">
        Registrati
      </h1>
      
      <div className="max-w-md mx-auto card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-[var(--color-foreground)] mb-2">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="form-input" required />
          </div>
          <div>
            <label className="block font-medium text-[var(--color-foreground)] mb-2">Cognome</label>
            <input value={cognome} onChange={(e) => setCognome(e.target.value)} className="form-input" required />
          </div>
          <div>
            <label className="block font-medium text-[var(--color-foreground)] mb-2">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="form-input" required />
          </div>
          <div>
            <label className="block font-medium text-[var(--color-foreground)] mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" required />
          </div>
          <div>
            <label className="block font-medium text-[var(--color-foreground)] mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" required />
          </div>
          
          {error && (
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-full">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-full">
              <p className="text-green-600">{success}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <button className="btn btn-accent" type="submit">Registrati</button>
            <a href="/user/login" className="text-[var(--color-accent)] hover:underline">Hai già un account?</a>
          </div>
        </form>
      </div>
    </div>
  );
}

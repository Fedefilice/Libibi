"use client";

export default function NoResultsMessage({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="text-center mt-8">
      <p className="text-lg text-[var(--color-foreground)]">Nessun risultato trovato per "{searchQuery}".</p>
      <p className="text-sm text-gray-600 mt-2">Prova con un'altra parola chiave o verifica l'ortografia.</p>
    </div>
  );
}
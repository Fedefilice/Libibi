export default function Loading() {
  return (
    <div className="container mx-auto px-8 py-12 flex justify-center items-center min-h-[500px]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-accent)] border-t-transparent mb-4"></div>
        <p className="text-lg text-[var(--color-foreground)]">Caricamento dettagli autore...</p>
      </div>
    </div>
  );
}

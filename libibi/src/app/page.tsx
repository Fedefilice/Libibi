"use client";

import Image from "next/image";
import bookIndex from "../../public/book_index.jpg";
import { AuthNavigation } from "../components/navigation";
import { useIsLoggedIn } from "../hooks/useAuth";
import ReviewsList from '../components/reviews/ReviewsList';

export default function Home() {
  const { isLoggedIn } = useIsLoggedIn();  
  // Debug - verifica il valore corretto
  console.log("Stato login:", isLoggedIn);
  
  return (
    <div>
      <section className="flex flex-col flex-1">
        <div className="flex-1 flex flex-col justify-center items-center">
          <div
            className="relative flex flex-col items-center justify-center rounded-2xl overflow-hidden"
            style={{
              width: "80vw",      // larghezza relativa
              height: "28vw",     // altezza relativa
              minWidth: "320px",
              minHeight: "300px",
              boxShadow: "0 4px 32px var(--color-card-shadow)",
              background: "var(--color-card)",
              marginTop: "6vw",   // spazio bianco sopra
              marginBottom: "6vw" // spazio bianco sotto
            }}
          >
            <Image
              src={bookIndex}
              alt="Libibi books"
              fill
              className="absolute inset-0 w-full h-full object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10" />
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-[4vw]">
              <h1
                className="text-6xl font-serif mb-6 text-center drop-shadow-lg"
                style={{ color: "var(--color-background)" }}
              >
                Libibi
              </h1>
              <p
                className="text-xl mb-8 text-center max-w-2xl drop-shadow"
                style={{ color: "var(--color-card)" }}
              >
                Il tuo rifugio personale per curare le tue letture ed esplorare nuovi mondi attraverso i libri.
              </p>
              {!isLoggedIn && <AuthNavigation />}
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-8 pb-12">
        <div className="max-w-6xl mx-auto mt-8">
          <div className="card">
            <h2 className="text-2xl text-center font-semibold text-[var(--color-foreground)]">Ultime recensioni</h2>
            <div className="flex flex-col gap-4">
              <ReviewsList limit={3} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

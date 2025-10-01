import Image from "next/image";
import bookIndex from "./book_index.jpg";
import Link from "next/link";
import { AuthNavigation } from "./components/navigation";

export default function Home() {
  return (
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
              Il tuo rifugio personale per organizzare le tue letture e scoprire
              nuovi mondi attraverso i libri.
            </p>
            <AuthNavigation />
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

export const Navigation = () => (
  <ul className="flex space-x-10">
    <li>
      <Link href="/data/search" className="text-[var(--color-background)] text-lg font-serif hover:text-[var(--color-accent)] hover:underline transition-colors">
        CERCA
      </Link>
    </li>
    <li>
      <Link href="/recommended" className="text-[var(--color-background)] text-lg font-serif hover:text-[var(--color-accent)] hover:underline transition-colors">
        CONSIGLIATI
      </Link>
    </li>
    <li>
      <Link href="/user/profile" className="text-[var(--color-background)] text-lg font-serif hover:text-[var(--color-accent)] hover:underline transition-colors">
        PROFILO
      </Link>
    </li>
  </ul>
);

export const HeaderNavigation = () => (
  <div className="flex items-center space-x-2">
    <Link href="/" className="flex items-center space-x-2">
      <span className="text-3xl font-serif text-[var(--color-background)] tracking-wide cursor-pointer">Libibi</span>
      <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] inline-block self-center"></span>
    </Link>
  </div>
);

// pagina di registrazione / accesso:

export const AuthNavigation = () => (
  <Link href="/user/login" passHref>
    <button
      className="text-lg px-8 py-3 rounded-full font-medium shadow transition-all duration-150 bg-[var(--color-accent)] text-[var(--color-card)] hover:bg-[var(--color-foreground)] active:scale-95"
      style={{
        textAlign: "center",
        textDecoration: "none",
      }}
      type="button"
    >
      Inizia il tuo viaggio
    </button>
  </Link>
);
import Link from "next/link";

export const Navigation = () => (
  <ul className="flex space-x-10">
    <li>
      <Link href="/" className="text-[#eae0ce] text-lg font-serif hover:text-[#a86c3c] hover:underline transition-colors">
        CERCA
      </Link>
    </li>
    <li>
      <Link href="#" className="text-[#eae0ce] text-lg font-serif hover:text-[#a86c3c] hover:underline transition-colors">
        CONSIGLIATI
      </Link>
    </li>
    <li>
      <Link href="#" className="text-[#eae0ce] text-lg font-serif hover:text-[#a86c3c] hover:underline transition-colors">
        PROFILO
      </Link>
    </li>
  </ul>
);

export const HeaderNavigation = () => (
  <div className="flex items-center space-x-2">
    <Link href="/" className="flex items-center space-x-2">
      <span className="text-3xl font-serif text-[#eae0ce] tracking-wide cursor-pointer">Libibi</span>
      <span className="w-2 h-2 rounded-full bg-[#a86c3c] inline-block self-center"></span>
    </Link>
  </div>
);

// pagina di registrazione / accesso:

export const AuthNavigation = () => (
  <Link href="/login" passHref>
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
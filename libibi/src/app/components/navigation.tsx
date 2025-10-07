import Link from "next/link";
import { BreadcrumbProps } from '@/types/ui';

export const Navigation = () => (
  <ul className="flex space-x-10">
    <li>
      <Link href="/search" className="text-[var(--color-background)] text-lg font-serif hover:text-[var(--color-accent)] hover:underline transition-colors">
        CERCA
      </Link>
    </li>
    <li>
      <Link href="/recommended" className="text-[var(--color-background)] text-lg font-serif hover:text-[var(--color-accent)] hover:underline transition-colors">
        CONSIGLIATI
      </Link>
    </li>
    <li>
      <Link href="/profile" className="text-[var(--color-background)] text-lg font-serif hover:text-[var(--color-accent)] hover:underline transition-colors">
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

// Breadcrumb per navigazione gerarchica

export const Breadcrumb = ({ items }: BreadcrumbProps) => (
  <nav className="mb-8 text-gray-500">
    <ol className="flex space-x-2">
      <li>
        <Link href="/" className="hover:text-[var(--color-accent)]">
          Home
        </Link>
      </li>
      {items.map((item, index) => (
        <li key={index} className="flex space-x-2">
          <span>/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--color-accent)]">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--color-foreground)] truncate max-w-xs">{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);
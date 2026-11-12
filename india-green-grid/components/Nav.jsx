'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Energy mix' },
  { href: '/rpo', label: 'RPO tracker' },
  { href: '/solar', label: 'Solar calculator' },
  { href: '/jobs', label: 'Green jobs' },
  { href: '/data', label: 'Data sources' }
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/60 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6" aria-label="Main">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-[#03130d]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
            </svg>
          </span>
          India Green Grid
        </Link>
        <ul className="-mx-2 flex flex-1 items-center gap-1 overflow-x-auto px-2 text-sm sm:justify-end">
          {LINKS.map(link => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`block whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${
                    active ? 'bg-white/10 text-ink' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

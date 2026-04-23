'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'หน้าหลัก' },
  { href: '/trending', label: 'ยอดนิยม' },
  { href: '/history', label: 'ประวัติ' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between h-[60px]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-700 focus:text-white text-sm font-medium">
        ข้ามไปเนื้อหาหลัก
      </a>

      <Link href="/" className="flex items-center gap-2.5 no-underline min-w-0 flex-shrink-0">
        <div className="w-9 h-9 bg-blue-800 rounded-lg flex items-center justify-center text-white flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width={20} height={20} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-blue-800 dark:text-blue-400 truncate hidden sm:block">ชัวร์ก่อนแชร์</span>
      </Link>

      <nav className="flex items-center" aria-label="เมนูหลัก">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`h-[60px] flex items-center px-3.5 text-sm font-medium no-underline border-b-2 transition-colors ${
              pathname === link.href
                ? 'border-blue-700 text-blue-700 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

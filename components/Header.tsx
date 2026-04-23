'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export function Header() {
  const pathname = usePathname();
  const [lang, setLang] = useState<'th' | 'en'>('th');

  useEffect(() => {
    const stored = localStorage.getItem('snbs_lang');
    if (stored === 'th' || stored === 'en') setLang(stored);
  }, []);

  function toggleLang() {
    const next = lang === 'th' ? 'en' : 'th';
    setLang(next);
    localStorage.setItem('snbs_lang', next);
  }

  const navLinks = [
    { href: '/', label: lang === 'th' ? 'หน้าหลัก' : 'Home' },
    { href: '/trending', label: lang === 'th' ? 'ยอดนิยม' : 'Trending' },
    { href: '/history', label: lang === 'th' ? 'ประวัติ' : 'History' },
  ];

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between h-[60px]">
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-9 h-9 bg-blue-800 rounded-lg flex items-center justify-center text-white text-lg font-bold">
          ✓
        </div>
        <span className="text-lg font-semibold text-blue-800 dark:text-blue-400">ชัวร์ก่อนแชร์</span>
      </Link>

      <nav className="flex gap-1 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors ${
              pathname === link.href
                ? 'bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {link.label}
          </Link>
        ))}
        <button
          onClick={toggleLang}
          className="ml-2 px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-800 transition-colors"
        >
          {lang === 'th' ? 'EN' : 'TH'}
        </button>
      </nav>
    </header>
  );
}

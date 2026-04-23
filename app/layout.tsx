import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'ชัวร์ก่อนแชร์ — ตรวจสอบข่าว',
  description: 'ตรวจสอบข่าวก่อนส่งต่อ เพราะข่าวปลอมแพร่เร็วกว่าที่คุณคิด',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen">
        <Providers>
          <PrivacyBanner />
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}

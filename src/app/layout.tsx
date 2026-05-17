import type { Metadata } from 'next';
import { Kanit } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { FilterProvider } from '@/components/FilterContext';
import './globals.css';

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500'],
  variable: '--font-kanit',
});

export const metadata: Metadata = {
  title: 'Store Manager',
  description: 'ระบบจัดการร้านค้า',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${kanit.variable}`}>
      <body>
        <FilterProvider>
          <div className="app">
            <Sidebar />
            <div className="main">
              <Topbar />
              <div className="content">{children}</div>
            </div>
          </div>
        </FilterProvider>
      </body>
    </html>
  );
}

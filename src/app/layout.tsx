import type { Metadata, Viewport } from 'next';
import { Kanit } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import PWAInit from '@/components/PWAInit';
import AuthGate from '@/components/AuthGate';
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
  applicationName: 'Store Manager',
  appleWebApp: { capable: true, title: 'Store Manager', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#1a2b45',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${kanit.variable}`}>
      <body>
        <PWAInit />
        <AuthGate>
          <FilterProvider>
            <div className="app">
              <Sidebar />
              <div className="main">
                <Topbar />
                <div className="content">{children}</div>
              </div>
            </div>
          </FilterProvider>
        </AuthGate>
      </body>
    </html>
  );
}
